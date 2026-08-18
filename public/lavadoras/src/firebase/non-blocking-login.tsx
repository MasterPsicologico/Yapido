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
    // 1. Intentar bridge nativo custom (AndroidAuthBridge) via Capacitor.Plugins
    // @ts-ignore - Plugins solo existe en runtime nativo
    const { AndroidAuthBridge } = Capacitor.Plugins;
    if (AndroidAuthBridge?.requestNativeGoogleAuth) {
      return initiateGoogleSignInViaAndroidBridge(authInstance);
    }
    // 2. Plugin oficial @capacitor-firebase/authentication
    // useCredentialManager: false => usa GoogleSignInClient clasico (mas robusto)
    // en vez de CredentialManager (que lanza "No credentials available" cuando
    // el OAuth Web Client no esta vinculado al Android Client en Cloud Console).
    try {
      const result = await FirebaseAuthentication.signInWithGoogle({
        useCredentialManager: false,
      });
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
      const msg = error.message || 'Error en Google Sign-In nativo. Asegúrate de: (1) @capacitor-firebase/authentication sincronizado, (2) google-services.json con package_name=lava.yapido.click, (3) SHA-1 de Play App Signing en Firebase Console.';
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
  // Acceder al plugin via Capacitor.Plugins (no window)
  // @ts-ignore - Plugins solo existe en runtime nativo
  const { AndroidAuthBridge } = Capacitor.Plugins;
  if (!AndroidAuthBridge?.requestNativeGoogleAuth) {
    throw new Error('AndroidAuthBridge no disponible en Capacitor.Plugins');
  }
  console.info('[auth] AndroidAuthBridge detectada en Capacitor.Plugins, disparando Chrome Custom Tab con Google OAuth');

  const result = await AndroidAuthBridge.requestNativeGoogleAuth();
  console.log('[auth] Resultado del bridge:', result);

  if (!result?.success) {
    throw new Error(result?.error || 'android_auth_failed');
  }

  const idToken = result.id_token;
  if (!idToken) {
    throw new Error('android_auth_no_id_token');
  }

  console.log('[auth] Llamando signInWithCredential con id_token');
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(authInstance, credential);
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
