
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
  // El error popup-closed-by-user es una acción esperada del usuario (cancelación)
  // No queremos que dispare una pantalla de error en Next.js
  if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-by-user') {
    return;
  }
  
  // Para otros errores, los registramos en la consola o podrías usar un toast si estuviera disponible
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

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  // Configuramos parámetros adicionales si fuera necesario
  provider.setCustomParameters({ prompt: 'select_account' });
  
  signInWithPopup(authInstance, provider).catch(handleAuthError);
}
