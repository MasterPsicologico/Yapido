/* ANDROID_BRIDGE_5b115a4c-e00_v3_BUILD_639211141536328914 */
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
 *
 * El listener se limpia siempre: en exito, en error y en timeout. Evita memory
 * leaks que dejaban la app en blanco tras el login.
 */
async function initiateGoogleSignInViaAndroidBridge(authInstance: Auth): Promise<import('firebase/auth').UserCredential> {
  return new Promise((resolve, reject) => {
    const bridge = (window as any).AndroidAuthBridge;
    if (!bridge?.requestNativeGoogleAuth) {
      reject(new Error('AndroidAuthBridge no disponible'));
      return;
    }

    if (typeof window !== 'undefined' && typeof console !== 'undefined') {
      console.info('[auth] AndroidAuthBridge detectada, disparando selector nativo');
    }

    let settled = false;
    const cleanup = () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('android-native-auth-result', handler as EventListener);
        if (timeoutId) clearTimeout(timeoutId);
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

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error('android_auth_timeout'));
      }
    }, 5 * 60 * 1000);

    // Dispara el selector nativo de Google via el bridge Java
    try {
      bridge.requestNativeGoogleAuth();
    } catch (e) {
      cleanup();
      reject(e as Error);
    }
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

/**
 * Flag de diagnostico para confirmar que el bundle actual contiene el listener
 * AndroidAuthBridge. Si este simbolo aparece en window.__diagnostics__, sabemos
 * que el chunk firebase 7855 que se esta sirviendo en produccion incluye el codigo.
 *
 * Si en consola del navegador (F12) ves este simbolo en window.__diagnostics__,
 * el codigo AndroidAuthBridge llego al usuario.
 */
export const __ANDROID_BRIDGE_BUILD_MARKER__ = (() => {
  const buildId = 'force-v3-' + (typeof performance !== 'undefined' ? performance.timeOrigin : Date.now());
  if (typeof window !== 'undefined') {
    (window as any).__diagnostics__ = (window as any).__diagnostics__ || {};
    (window as any).__diagnostics__.androidBridge = true;
    (window as any).__diagnostics__.buildId = buildId;
    (window as any).__diagnostics__.timestamp = new Date().toISOString();
  }
  return buildId;
})();
