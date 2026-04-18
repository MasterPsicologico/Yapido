'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

/** 
 * Maneja los errores comunes de Firebase Auth de forma centralizada.
 * Inyecta diagnósticos visuales para el administrador en tiempo real.
 */
function handleAuthError(error: any) {
  // Silenciamos errores de cancelación de usuario o de solicitudes de popup que se cancelan por redirección
  if (
    error.code === 'auth/popup-closed-by-user' || 
    error.code === 'auth/cancelled-by-user' ||
    error.code === 'auth/cancelled-popup-request'
  ) {
    return;
  }

  // DIAGNÓSTICO MAESTRO: Detecta si el dominio no está autorizado y lanza el aviso rojo
  if (error.code === 'auth/unauthorized-domain') {
    const domain = window.location.hostname;
    toast({
      title: "🚨 DOMINIO NO AUTORIZADO",
      description: `Copia esto en tu Firebase: ${domain}`,
      variant: "destructive",
      duration: 15000,
    });
    console.error("Firebase requiere que autorices este dominio:", domain);
    return;
  }

  if (error.code === 'auth/popup-blocked') {
    toast({
      title: "Popup Bloqueado",
      description: "Tu navegador bloqueó la ventana. Intentaremos redirigirte...",
    });
    return;
  }

  console.warn("Error de autenticación:", error.code, error.message);
  toast({
    title: "Error de Acceso",
    description: error.message,
    variant: "destructive",
  });
}

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(handleAuthError);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password).catch(handleAuthError);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password).catch(handleAuthError);
}

/** 
 * Inicia sesión con Google.
 * Protocolo de Redirección para entornos de IA y PC para evitar bloqueos.
 */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // Detección de entorno de Cloud IDE (AI Studio / Firebase Studio)
  // Añadimos google.com para asegurar la redirección en la consola de Firebase
  const isCloudIDE = window.location.hostname.includes('googleusercontent.com') || 
                    window.location.hostname.includes('web.app') ||
                    window.location.hostname.includes('google.com') ||
                    window.location.port !== '';

  if (isCloudIDE) {
    // La redirección es infalible en entornos protegidos o móviles
    signInWithRedirect(authInstance, provider).catch(handleAuthError);
  } else {
    signInWithPopup(authInstance, provider).catch(handleAuthError);
  }
}
