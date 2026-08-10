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
// Nota: getRedirectResult eliminado - causaba 'missing initial state' en WebView. No usamos redirect.
import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

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

export async function initiateGoogleSignIn(authInstance: Auth): Promise<import('firebase/auth').UserCredential> {
  // En plataforma nativa (Android/iOS Capacitor), SOLO flujo nativo via plugin.
  // NO fallback a redirect/popup — rompen en WebView por sessionStorage.
  if (Capacitor.isNativePlatform()) {
    // 1. Intentar bridge nativo custom (AndroidAuthBridge)
    if (typeof window !== 'undefined' && (window as any).AndroidAuthBridge?.requestNativeGoogleAuth) {
      return initiateGoogleSignInViaAndroidBridge(authInstance);
    }
    // 2. Plugin oficial @capacitor-firebase/authentication
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      if (!result.credential?.idToken) {
        throw new Error('No se recibió el token de autenticación nativa. Verifica que el plugin @capacitor-firebase/authentication esté sincronizado (npx cap sync) y que google-services.json tenga el package_name correcto.');
      }
      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      return signInWithCredential(authInstance, credential);
    } catch (error: any) {
      if (error.message?.includes('cancel') || error.code === 'CANCELLED') {
        throw error;
      }
      // NO fallback a redirect/popup — dan error 'missing initial state' en WebView.
      const msg = error.message || 'Error en Google Sign-In nativo. Asegúrate de: (1) @capacitor-firebase/authentication sincronizado, (2) google-services.json con package_name=lavadorasx.yapido.click, (3) SHA-1 de Play App Signing en Firebase Console.';
      handleAuthError({ code: 'auth/native-signin-failed', message: msg });
      throw new Error(msg);
    }
  }
  // Solo en web (no nativo): popup normal
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(authInstance, provider).catch((error) => {
    handleAuthError(error);
    throw error;
  });
}

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
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
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
    timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error('android_auth_timeout'));
      }
    }, 5 * 60 * 1000);
    try {
      bridge.requestNativeGoogleAuth();
    } catch (e) {
      cleanup();
      reject(e as Error);
    }
  });
}

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

export const __ANDROID_BRIDGE_BUILD_MARKER__ = (() => {
  const buildId = 'twa-real-v7-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  if (typeof window !== 'undefined') {
    (window as any).__diagnostics__ = (window as any).__diagnostics__ || {};
    (window as any).__diagnostics__.androidBridge = true;
    (window as any).__diagnostics__.buildId = buildId;
    (window as any).__diagnostics__.timestamp = new Date().toISOString();
  }
  return buildId;
})();

export const __FORCE_CHUNK_INVALIDATION_V7__ = 'twa-real-v7-' + Date.now();
