'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

/** 
 * Maneja los errores comunes de Firebase Auth de forma centralizada.
 */
function handleAuthError(error: any) {
  if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-by-user') {
    return;
  }
  console.warn("Error de autenticación:", error.code, error.message);
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
 * Inicia sesión con Google mediante ventana emergente (Popup).
 * Este método es más fiable en entornos de desarrollo y evita errores 403 de redirección.
 */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  signInWithPopup(authInstance, provider).catch(handleAuthError);
}
