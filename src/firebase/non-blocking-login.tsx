'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

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
      description: "Tu navegador bloqueó la ventana. Intenta de nuevo.",
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
 * Usa Autenticación Nativa en dispositivos móviles (Capacitor) para evitar errores de WebView.
 * Usa signInWithPopup en navegadores web para una experiencia fluida.
 */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<import('firebase/auth').UserCredential> {
  // 1. Detectar si estamos en plataforma nativa (iOS/Android APK)
  if (Capacitor.isNativePlatform()) {
    try {
      // Iniciar sesión nativa con el plugin de Capacitor
      const result = await FirebaseAuthentication.signInWithGoogle();
      
      if (!result.credential?.idToken) {
        throw new Error("No se recibió el token de autenticación nativa.");
      }

      // Vincular la credencial nativa con la instancia de Firebase JS SDK
      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      return signInWithCredential(authInstance, credential);
    } catch (error: any) {
      // Manejar cancelaciones del usuario de forma silenciosa
      if (error.message?.includes('cancel') || error.code === 'CANCELLED') {
        throw error;
      }
      handleAuthError(error);
      throw error;
    }
  }

  // 2. Comportamiento para Navegador Web (PC/Móvil)
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  return signInWithPopup(authInstance, provider).catch((error) => {
    handleAuthError(error);
    throw error;
  });
}
