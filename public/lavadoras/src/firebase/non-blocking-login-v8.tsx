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

function isAndroidNative(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  if (w.Capacitor?.isNativePlatform?.()) return true;
  if (w.Capacitor?.getPlatform?.() === 'android') return true;
  if (w.AndroidAuthBridge?.requestNativeGoogleAuth) return true;
  if (/; wv\)/.test(navigator.userAgent) && /Android/.test(navigator.userAgent)) return true;
  if (/Capacitor/i.test(navigator.userAgent)) return true;
  return false;
}

async function callFirebaseAuthPlugin(): Promise<any> {
  const w = window as any;
  const plugins = w.Capacitor?.Plugins;
  if (plugins?.FirebaseAuthentication?.signInWithGoogle) {
    return await plugins.FirebaseAuthentication.signInWithGoogle();
  }
  const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
  return await FirebaseAuthentication.signInWithGoogle();
}

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
  const native = isAndroidNative();
  console.log('[auth] initiateGoogleSignIn - isAndroidNative:', native, '- userAgent:', navigator.userAgent.substring(0, 100));

  if (native) {
    try {
      console.log('[auth] Intentando FirebaseAuthentication.signInWithGoogle() nativo');
      const result = await callFirebaseAuthPlugin();
      console.log('[auth] Plugin nativo resultado:', !!result, '- idToken:', !!result?.idToken);
      if (!result?.idToken) {
        throw new Error('No se recibio idToken del plugin nativo. Verifica SHA-1 en Firebase y google-services.json.');
      }
      const credential = GoogleAuthProvider.credential(result.idToken);
      return await signInWithCredential(authInstance, credential);
    } catch (error: any) {
      console.error('[auth] Error en plugin nativo:', error.code, error.message);
      if (error.message?.includes('cancel') || error.code === 'CANCELLED') {
        throw error;
      }
      toast({
        title: 'Error de Google Sign-In',
        description: 'Error nativo: ' + (error.message || 'Verifica que Google Play Services este actualizado'),
        variant: 'destructive',
        duration: 10000,
      });
      throw error;
    }
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(authInstance, provider).catch((error) => {
    handleAuthError(error);
    throw error;
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
  const buildId = 'native-v15-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  if (typeof window !== 'undefined') {
    (window as any).__diagnostics__ = (window as any).__diagnostics__ || {};
    (window as any).__diagnostics__.androidBridge = true;
    (window as any).__diagnostics__.buildId = buildId;
    (window as any).__diagnostics__.timestamp = new Date().toISOString();
    (window as any).__diagnostics__.isNative = isAndroidNative();
  }
  return buildId;
})();

export const __FORCE_CHUNK_INVALIDATION_V7__ = 'native-v15-' + Date.now();
