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
  const isNative = Capacitor.isNativePlatform();
  console.log('[auth-v8] isNativePlatform:', isNative, '| platform:', Capacitor.getPlatform());

  if (isNative) {
    try {
      console.log('[auth-v8] Llamando FirebaseAuthentication.signInWithGoogle()');
      const result = await FirebaseAuthentication.signInWithGoogle();
      console.log('[auth-v8] Resultado del plugin:', JSON.stringify({ hasIdToken: !!result?.credential?.idToken }));
      if (!result?.credential?.idToken) {
        throw new Error('No se recibio idToken del plugin nativo.');
      }
      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      return await signInWithCredential(authInstance, credential);
    } catch (error: any) {
      console.error('[auth-v8] Error plugin nativo, intentando fallback web:', error?.code, error?.message);
      if (error.message?.includes('cancel') || error.code === 'CANCELLED') {
        throw error;
      }
    }
  }

  console.log('[auth-v8] Usando signInWithPopup (web o fallback)');
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

export const __ANDROID_BRIDGE_BUILD_MARKER__ = 'native-v16-' + Date.now();
export const __FORCE_CHUNK_INVALIDATION_V7__ = 'native-v16-' + Date.now();
