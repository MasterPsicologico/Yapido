'use client';

import {
  Auth,
  User,
  signInAnonymously,
  signInWithEmailLink,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  linkWithCredential,
  EmailAuthProvider,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithCredential,
  onAuthStateChanged,
  updateProfile,
  UserCredential,
  AuthError,
} from 'firebase/auth';
import { getAuthInstance } from '@/firebase';
import { Capacitor } from '@capacitor/core';

export type AuthMethod = 'anonymous' | 'email-link' | 'whatsapp';
export type AuthState = 'loading' | 'anonymous' | 'authenticated' | 'error';

export interface AuthUser {
  uid: string;
  isAnonymous: boolean;
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  providerData: Array<{
    providerId: string;
    uid: string;
    email?: string | null;
    phoneNumber?: string | null;
  }>;
}

export interface AuthServiceCallbacks {
  onStateChange: (state: AuthState, user: AuthUser | null) => void;
  onError: (error: string, method?: AuthMethod) => void;
  onLinkSent: (method: 'email' | 'whatsapp') => void;
}

class AuthService {
  private auth: Auth;
  private callbacks: AuthServiceCallbacks | null = null;
  private unsubscribe: (() => void) | null = null;
  private currentUser: AuthUser | null = null;
  private currentState: AuthState = 'loading';

  constructor() {
    this.auth = getAuthInstance();
    this.initAuthListener();
  }

  private initAuthListener() {
    this.unsubscribe = onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.currentUser = this.mapFirebaseUser(user);
        this.currentState = user.isAnonymous ? 'anonymous' : 'authenticated';
      } else {
        this.currentUser = null;
        this.currentState = 'loading';
      }
      this.callbacks?.onStateChange(this.currentState, this.currentUser);
    });
  }

  private mapFirebaseUser(user: User): AuthUser {
    return {
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      email: user.email,
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
      photoURL: user.photoURL,
      providerData: user.providerData.map((p) => ({
        providerId: p.providerId,
        uid: p.uid,
        email: p.email,
        phoneNumber: p.phoneNumber,
      })),
    };
  }

  setCallbacks(callbacks: AuthServiceCallbacks) {
    this.callbacks = callbacks;
    // Emit current state immediately
    callbacks.onStateChange(this.currentState, this.currentUser);
  }

  // ==========================================
  // 1. ANONYMOUS SIGN IN (Instant access)
  // ==========================================
  async signInAnonymously(): Promise<AuthUser> {
    try {
      const result = await signInAnonymously(this.auth);
      return this.mapFirebaseUser(result.user);
    } catch (error) {
      const msg = this.getErrorMessage(error);
      this.callbacks?.onError(msg, 'anonymous');
      throw new Error(msg);
    }
  }

  // ==========================================
  // 2. EMAIL LINK (Passwordless upgrade)
  // ==========================================
  async sendEmailLink(email: string): Promise<void> {
    const actionCodeSettings = {
      url: `${window.location.origin}/auth/complete?email=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
      dynamicLinkDomain: undefined, // Configure if using Firebase Dynamic Links
    };

    try {
      await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
      // Save email locally for completion
      localStorage.setItem('auth_email_for_link', email);
      this.callbacks?.onLinkSent('email');
    } catch (error) {
      const msg = this.getErrorMessage(error);
      this.callbacks?.onError(msg, 'email-link');
      throw new Error(msg);
    }
  }

  async completeEmailLinkSignIn(email: string, link: string): Promise<AuthUser> {
    try {
      // Verify this is a valid email link
      if (!isSignInWithEmailLink(this.auth, link)) {
        throw new Error('Enlace de autenticación inválido o expirado');
      }

      const result = await signInWithEmailLink(this.auth, email, link);
      localStorage.removeItem('auth_email_for_link');
      return this.mapFirebaseUser(result.user);
    } catch (error) {
      const msg = this.getErrorMessage(error);
      this.callbacks?.onError(msg, 'email-link');
      throw new Error(msg);
    }
  }

  async upgradeAnonymousWithEmailLink(email: string): Promise<AuthUser> {
    // Send link, then user clicks, then we link to anonymous account
    await this.sendEmailLink(email);
    // User will complete via email link - handled by auth state listener
    // But we need to link the credential to the anonymous account
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
        if (user && !user.isAnonymous) {
          unsubscribe();
          resolve(this.mapFirebaseUser(user));
        }
      });
      // Timeout after 10 minutes
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Tiempo agotado esperando verificación de email'));
      }, 10 * 60 * 1000);
    });
  }

  // ==========================================
  // 3. WHATSAPP (Phone Auth upgrade)
  // ==========================================
  private confirmationResult: any = null;

  async sendWhatsAppCode(phoneNumber: string): Promise<void> {
    // Format: +573001234567 (Colombia example)
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    try {
      const recaptcha = new RecaptchaVerifier(this.auth, 'recaptcha-container', {
        size: 'invisible',
      });
      this.confirmationResult = await signInWithPhoneNumber(
        this.auth,
        formattedPhone,
        recaptcha
      );
      this.callbacks?.onLinkSent('whatsapp');
    } catch (error) {
      const msg = this.getErrorMessage(error);
      this.callbacks?.onError(msg, 'whatsapp');
      throw new Error(msg);
    }
  }

  async verifyWhatsAppCode(code: string): Promise<AuthUser> {
    if (!this.confirmationResult) {
      throw new Error('No hay verificación pendiente. Solicita código nuevamente.');
    }

    try {
      const credential = PhoneAuthProvider.credential(
        this.confirmationResult.verificationId,
        code
      );
      const result = await signInWithCredential(this.auth, credential);
      this.confirmationResult = null;
      return this.mapFirebaseUser(result.user);
    } catch (error) {
      const msg = this.getErrorMessage(error);
      this.callbacks?.onError(msg, 'whatsapp');
      throw new Error(msg);
    }
  }

  async upgradeAnonymousWithPhone(phoneNumber: string, code: string): Promise<AuthUser> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const credential = PhoneAuthProvider.credential(
      this.confirmationResult?.verificationId || '',
      code
    );

    try {
      const anonymousUser = this.auth.currentUser;
      if (!anonymousUser || !anonymousUser.isAnonymous) {
        throw new Error('No hay usuario anónimo para vincular');
      }

      const result = await linkWithCredential(anonymousUser, credential);
      this.confirmationResult = null;
      return this.mapFirebaseUser(result.user);
    } catch (error) {
      const msg = this.getErrorMessage(error);
      this.callbacks?.onError(msg, 'whatsapp');
      throw new Error(msg);
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove spaces, dashes, parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // Ensure starts with +
    if (!cleaned.startsWith('+')) {
      // Assume Colombia (+57) if no country code
      if (cleaned.length === 10) {
        cleaned = '+57' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    return cleaned;
  }

  // ==========================================
  // UTILITIES
  // ==========================================
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getCurrentState(): AuthState {
    return this.currentState;
  }

  isAnonymous(): boolean {
    return this.currentUser?.isAnonymous ?? true;
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }

  destroy() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.callbacks = null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      const code = (error as AuthError).code;
      switch (code) {
        case 'auth/invalid-email':
          return 'Correo electrónico inválido';
        case 'auth/invalid-phone-number':
          return 'Número de teléfono inválido. Formato: +573001234567';
        case 'auth/invalid-verification-code':
        case 'auth/invalid-verification-id':
          return 'Código de verificación inválido o expirado';
        case 'auth/code-expired':
          return 'El código ha expirado. Solicita uno nuevo';
        case 'auth/too-many-requests':
          return 'Demasiados intentos. Espera unos minutos';
        case 'auth/credential-already-in-use':
          return 'Esta cuenta ya está vinculada a otro usuario';
        case 'auth/operation-not-allowed':
          return 'Método de autenticación no habilitado en Firebase Console';
        case 'auth/unauthorized-domain':
          return `Dominio no autorizado: ${window.location.hostname}. Agrégalo en Firebase Console`;
        case 'auth/network-request-failed':
          return 'Error de conexión. Verifica tu internet';
        default:
          return error.message || 'Error de autenticación';
      }
    }
    return 'Error desconocido';
  }
}

// Singleton instance
export const authService = new AuthService();

// React hook for easy usage
import { useState, useEffect, useCallback } from 'react';

export function useAuth() {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authService.setCallbacks({
      onStateChange: (newState, newUser) => {
        setState(newState);
        setUser(newUser);
      },
      onError: (msg) => setError(msg),
      onLinkSent: (method) => {
        console.log(`[Auth] Link sent via ${method}`);
      },
    });

    return () => {
      authService.setCallbacks({
        onStateChange: () => {},
        onError: () => {},
        onLinkSent: () => {},
      });
    };
  }, []);

  const signInAnonymously = useCallback(async () => {
    setError(null);
    return authService.signInAnonymously();
  }, []);

  const sendEmailLink = useCallback(async (email: string) => {
    setError(null);
    return authService.sendEmailLink(email);
  }, []);

  const completeEmailLink = useCallback(async (email: string, link: string) => {
    setError(null);
    return authService.completeEmailLinkSignIn(email, link);
  }, []);

  const sendWhatsAppCode = useCallback(async (phone: string) => {
    setError(null);
    return authService.sendWhatsAppCode(phone);
  }, []);

  const verifyWhatsAppCode = useCallback(async (code: string) => {
    setError(null);
    return authService.verifyWhatsAppCode(code);
  }, []);

  const upgradeWithEmail = useCallback(async (email: string) => {
    setError(null);
    return authService.upgradeAnonymousWithEmailLink(email);
  }, []);

  const upgradeWithPhone = useCallback(async (phone: string, code: string) => {
    setError(null);
    return authService.upgradeAnonymousWithPhone(phone, code);
  }, []);

  const signOut = useCallback(async () => {
    return authService.signOut();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    state,
    user,
    error,
    isAnonymous: user?.isAnonymous ?? true,
    isAuthenticated: !user?.isAnonymous,
    signInAnonymously,
    sendEmailLink,
    completeEmailLink,
    sendWhatsAppCode,
    verifyWhatsAppCode,
    upgradeWithEmail,
    upgradeWithPhone,
    signOut,
    clearError,
  };
}

// Email link completion handler (call on /auth/complete page)
export async function handleEmailLinkCompletion(): Promise<{ success: boolean; error?: string }> {
  const authInstance = getAuthInstance();
  if (isSignInWithEmailLink(authInstance, window.location.href)) {
    const email = localStorage.getItem('auth_email_for_link') || new URLSearchParams(window.location.search).get('email');
    if (!email) {
      return { success: false, error: 'Email no encontrado en el enlace' };
    }
    try {
      await authService.completeEmailLinkSignIn(email, window.location.href);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error completando login' };
    }
  }
  return { success: false, error: 'No es un enlace de autenticación válido' };
}