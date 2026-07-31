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
 * Inyecta diagnosticos visuales para el administrador en tiempo real.
 */
function handleAuthError(error: any) {
  if (
    error.code === 'auth/popup-closed-by-user' ||
    error.code === 'auth/cancelled-by-user' ||
    error.code === 'auth/cancelled-popup-request'
  ) {
    return;
  }

  if (error.code === 'auth/unauthorized-domain') {
    const domain = window.location.hostname;
    toast({
      title: 'DOMINIO NO AUTORIZADO',
      description: `Copia esto en tu Firebase: ${domain}`,
      variant: 'destructive',
      duration: 15000,
    });
    console.error('Firebase requiere que autorices este dominio:', domain);
    return;
  }

  if (error.code === 'auth/popup-blocked') {
    toast({
      title: 'Popup Bloqueado',
      description: 'Tu navegador bloqueo la ventana. Intenta de nuevo.',
    });
    return;
  }

  console.warn('Error de autenticacion:', error.code, error.message);
  toast({
    title: 'Error de Acceso',
    description: error.message,
    variant: 'destructive',
  });
}

export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(handleAuthError);
}

export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password).catch(handleAuthError);
}

export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password).catch(handleAuthError);
}

/**
 * Inicia sesion con Google.
 * - APK de lavadoras (TWA): usa AndroidAuthBridge inyectado por MainActivity.java
 * - APK Capacitor: usa FirebaseAuthentication.signInWithGoogle()
 * - Navegador web: usa signInWithPopup
 */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<import('firebase/auth').UserCredential> {
  // 1. APK de lavadoras (TWA con bridge Java inyectado por MainActivity)
  if (typeof window !== 'undefined' && (window as any).AndroidAuthBridge?.requestNativeGoogleAuth) {
    return initiateGoogleSignInViaAndroidBridge(authInstance);
  }

  // 2. APK Capacitor (iOS/Android nativo)
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      if (!result.credential?.idToken) {
        throw new Error('No se recibio el token de autenticacion nativa.');
      }
      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      return signInWithCredential(authInstance, credential);
    } catch (error: any) {
      if (error.message?.includes('cancel') || error.code === 'CANCELLED') {
        throw error;
      }
      handleAuthError(error);
      throw error;
    }
  }

  // 3. Navegador web (PC/Movil)
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(authInstance, provider).catch((error) => {
    handleAuthError(error);
    throw error;
  });
}

/**
 * Inicia sesion via el AndroidAuthBridge inyectado por MainActivity.java
 * en la APK de lavadoras (lava/app). El bridge dispara el selector nativo
 * de Google y al completar emite `window.event('android-native-auth-result')`
 * con detail { success: boolean, id_token?: string, error?: string, ... }.
 *
 * Esta funcion solo espera el evento, extrae el id_token y lo pasa a Firebase
 * con signInWithCredential(GoogleAuthProvider.credential(idToken)).
 */
async function initiateGoogleSignInViaAndroidBridge(authInstance: Auth): Promise<import('firebase/auth').UserCredential> {
  return new Promise((resolve, reject) => {
    const bridge = (window as any).AndroidAuthBridge;
    if (!bridge?.requestNativeGoogleAuth) {
      reject(new Error('AndroidAuthBridge no disponible'));
      return;
    }

    let settled = false;

    const cleanup = () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('android-native-auth-result', handler as EventListener);
      }
    };

    const handler = (event: Event) => {
      if (settled) return;
      const detail = (event as CustomEvent).detail || {};
      if (!detail.success) {
        settled = true;
        cleanup();
        reject(new Error(detail.error || 'android_auth_failed'));
        return;
      }
      const idToken: string | undefined = detail.id_token;
      if (!idToken) {
        settled = true;
        cleanup();
        reject(new Error('android_auth_no_id_token'));
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(authInstance, credential)
        .then((userCredential) => {
          settled = true;
          cleanup();
          resolve(userCredential);
        })
        .catch((err) => {
          settled = true;
          cleanup();
          handleAuthError(err);
          reject(err);
        });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('android-native-auth-result', handler as EventListener);
    }

    // Dispara el selector nativo de Google via el bridge Java
    try {
      bridge.requestNativeGoogleAuth();
    } catch (e) {
      cleanup();
      reject(e as Error);
    }

    // Timeout de 5 minutos por si el usuario no confirma
    setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error('android_auth_timeout'));
      }
    }, 5 * 60 * 1000);
  });
}

/**
 * Inicia sesion usando el ID token que devuelve Google One Tap.
 * One Tap entrega el ID token (JWT) directamente, sin popup ni redirect.
 */
export async function initiateGoogleSignInWithOneTap(
  authInstance: Auth,
  idToken: string
): Promise<import('firebase/auth').UserCredential> {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(authInstance, credential).catch((error) => {
    handleAuthError(error);
    throw error;
  });
}
