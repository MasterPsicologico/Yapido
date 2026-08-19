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

export type AuthMethod = 'anonymous' | 'email-link' | 'whatsapp' | 'recovery-code';
export type AuthState = 'loading' | 'anonymous' | 'authenticated' | 'error';

// AuthUser type - plain interface with only the properties we need
export interface AuthUser {
  uid: string;
  isAnonymous: boolean;
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
  metadata?: any;
  recoveryCode?: string;
  providerData: Array<{
    providerId: string;
    uid: string;
    email?: string | null;
    phoneNumber?: string | null;
    displayName?: string | null | undefined;
    photoURL?: string | null | undefined;
  }>;
  localData?: LocalUserData;
  // Methods we might need
  delete?: () => Promise<void>;
  toJSON?: () => object;
  refreshToken?: string;
  tenantId?: string | null;
}

// ==========================================
// LOCAL STORAGE KEYS
// ==========================================
const STORAGE_KEYS = {
  RECOVERY_CODE: 'lavadoras_recovery_code',
  GUEST_DATA: 'lavadoras_guest_data',
  USER_PROFILE: 'lavadoras_user_profile',
  LAST_SYNC: 'lavadoras_last_sync',
  PENDING_SYNC: 'lavadoras_pending_sync',
} as const;

// Safe localStorage access (SSR-safe)
function getStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
}

function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

// ==========================================
// LOCAL DATA TYPES
// ==========================================
export interface LocalUserData {
  uid: string;
  recoveryCode: string;
  profile: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    preferences?: Record<string, any>;
  };
  rentalHistory: Array<{
    id: string;
    washerId: string;
    startDate: string;
    endDate: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
  favorites: string[];
  cart: Array<{
    washerId: string;
    quantity: number;
    startDate: string;
    endDate: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface AuthServiceCallbacks {
  onStateChange: (state: AuthState, user: AuthUser | null) => void;
  onError: (error: string, method?: AuthMethod) => void;
  onLinkSent: (method: 'email' | 'whatsapp') => void;
  onRecoveryCodeGenerated: (code: string) => void;
  onSyncComplete: (synced: boolean) => void;
}

class AuthService {
  private auth: Auth;
  private callbacks: AuthServiceCallbacks | null = null;
  private unsubscribe: (() => void) | null = null;
  private currentUser: AuthUser | null = null;
  private currentState: AuthState = 'loading';
  private initPromise: Promise<void> | null = null;
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  constructor() {
    this.auth = getAuthInstance();
    this.initPromise = this.initializeAuth();
  }

  // ==========================================
  // INITIALIZATION - AUTO INSTANT AUTH
  // ==========================================
  private async initializeAuth(): Promise<void> {
    try {
      // 1. Check for existing recovery code in localStorage
      const existingRecoveryCode = getStorageItem(STORAGE_KEYS.RECOVERY_CODE);
      
      // 2. Check for email link completion
      if (isSignInWithEmailLink(this.auth, window.location.href)) {
        const email = getStorageItem('auth_email_for_link') || 
          new URLSearchParams(window.location.search).get('email');
        if (email) {
          await this.completeEmailLinkSignIn(email, window.location.href);
          return;
        }
      }

      // 3. Auto-instant anonymous auth (INSTANT)
      await this.ensureAuthenticated();
      
      // 4. Generate recovery code if doesn't exist
      if (!existingRecoveryCode) {
        await this.generateAndStoreRecoveryCode();
      }

      // 5. Load local data
      await this.loadLocalData();

      // 6. Start auth state listener
      this.startAuthListener();

    } catch (error) {
      console.error('[AuthService] Initialization error:', error);
      this.currentState = 'error';
      this.callbacks?.onStateChange(this.currentState, null);
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.auth.currentUser) {
      this.currentUser = this.mapFirebaseUser(this.auth.currentUser);
      this.currentState = this.auth.currentUser.isAnonymous ? 'anonymous' : 'authenticated';
      return;
    }

    // Instant anonymous sign-in
    const result = await signInAnonymously(this.auth);
    this.currentUser = this.mapFirebaseUser(result.user);
    this.currentState = 'anonymous';
    
    // Initialize local data for new user
    await this.initializeLocalData(result.user.uid);
  }

  private async initializeLocalData(uid: string): Promise<void> {
    const recoveryCode = this.generateRecoveryCode();
    
    const localData: LocalUserData = {
      uid,
      recoveryCode,
      profile: {},
      rentalHistory: [],
      favorites: [],
      cart: [],
      notifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    setStorageItem(STORAGE_KEYS.RECOVERY_CODE, recoveryCode);
    setStorageItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(localData));
    setStorageItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify({}));
    
    this.callbacks?.onRecoveryCodeGenerated?.(recoveryCode);
  }

  private generateRecoveryCode(): string {
    // Generate 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateAndStoreRecoveryCode(): Promise<string> {
    const code = this.generateRecoveryCode();
    setStorageItem(STORAGE_KEYS.RECOVERY_CODE, code);
    this.callbacks?.onRecoveryCodeGenerated?.(code);
    return code;
  }

  private startAuthListener(): void {
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
    const recoveryCode = getStorageItem(STORAGE_KEYS.RECOVERY_CODE) || undefined;
    return {
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      email: user.email,
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
      photoURL: user.photoURL,
      recoveryCode: getStorageItem(STORAGE_KEYS.RECOVERY_CODE) || undefined,
      providerData: user.providerData.map((p) => ({
        providerId: p.providerId,
        uid: p.uid,
        email: p.email,
        phoneNumber: p.phoneNumber,
        displayName: p.displayName ?? null,
        photoURL: p.photoURL ?? null,
      })),
    };
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  async waitForInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getCurrentState(): AuthState {
    return this.currentState;
  }

  isAnonymous(): boolean {
    return this.currentUser?.isAnonymous ?? true;
  }

  getRecoveryCode(): string | null {
    return getStorageItem(STORAGE_KEYS.RECOVERY_CODE);
  }

  async signInAnonymously(): Promise<AuthUser> {
    const result = await signInAnonymously(this.auth);
    this.currentUser = this.mapFirebaseUser(result.user);
    this.currentState = 'anonymous';
    this.callbacks?.onStateChange(this.currentState, this.currentUser);
    return this.currentUser;
  }

  // ==========================================
  // LOCAL DATA MANAGEMENT (LOCAL-FIRST)
  // ==========================================

  async loadLocalData(): Promise<LocalUserData | null> {
    try {
      const data = getStorageItem(STORAGE_KEYS.GUEST_DATA);
      if (data) {
        const parsed = JSON.parse(data);
        if (this.currentUser) {
          this.currentUser.localData = parsed;
        }
        return parsed;
      }
    } catch (error) {
      console.error('[AuthService] Error loading local data:', error);
    }
    return null;
  }

  async saveLocalData(data: Partial<LocalUserData>): Promise<void> {
    try {
      const existing = await this.loadLocalData();
      const updated: LocalUserData = {
        ...(existing || {
          uid: this.currentUser?.uid || '',
          recoveryCode: this.getRecoveryCode() || '',
          profile: {},
          rentalHistory: [],
          favorites: [],
          cart: [],
          notifications: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          synced: false,
        }),
        ...data,
        updatedAt: new Date().toISOString(),
        synced: false,
      };

      setStorageItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(updated));
      
      if (this.currentUser) {
        this.currentUser.localData = updated;
      }
    } catch (error) {
      console.error('[AuthService] Error saving local data:', error);
    }
  }

  async updateProfile(profile: Partial<LocalUserData['profile']>): Promise<void> {
    const current = await this.loadLocalData();
    await this.saveLocalData({
      profile: { ...(current?.profile || {}), ...profile },
    });
  }

  async addRentalHistory(rental: LocalUserData['rentalHistory'][0]): Promise<void> {
    const current = await this.loadLocalData();
    const history = current?.rentalHistory || [];
    history.unshift(rental);
    await this.saveLocalData({ rentalHistory: history });
  }

  async addFavorite(washerId: string): Promise<void> {
    const current = await this.loadLocalData();
    const favorites = current?.favorites || [];
    if (!favorites.includes(washerId)) {
      await this.saveLocalData({ favorites: [...favorites, washerId] });
    }
  }

  async removeFavorite(washerId: string): Promise<void> {
    const current = await this.loadLocalData();
    const favorites = (current?.favorites || []).filter(id => id !== washerId);
    await this.saveLocalData({ favorites });
  }

  async updateCart(cart: LocalUserData['cart']): Promise<void> {
    await this.saveLocalData({ cart });
  }

  async addNotification(notification: LocalUserData['notifications'][0]): Promise<void> {
    const current = await this.loadLocalData();
    const notifications = current?.notifications || [];
    notifications.unshift(notification);
    await this.saveLocalData({ notifications });
  }

  getLocalData(): LocalUserData | null {
    try {
      const data = getStorageItem(STORAGE_KEYS.GUEST_DATA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // ==========================================
  // SYNC TO CLOUD (when user upgrades)
  // ==========================================

  async syncToCloud(): Promise<boolean> {
    if (!this.currentUser || this.currentUser.isAnonymous) {
      return false;
    }

    try {
      const localData = this.getLocalData();
      if (!localData) return false;

      // Here you would sync to Firestore
      // For now, mark as synced locally
      await this.saveLocalData({ synced: true });
      setStorageItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      
      this.callbacks?.onSyncComplete?.(true);
      return true;
    } catch (error) {
      console.error('[AuthService] Sync error:', error);
      this.callbacks?.onSyncComplete?.(false);
      return false;
    }
  }

  // ==========================================
  // ACCOUNT UPGRADE METHODS
  // ==========================================

  async sendEmailLink(email: string): Promise<void> {
    const actionCodeSettings = {
      url: `${window.location.origin}/auth/complete?email=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
    };

    await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
    localStorage.setItem('auth_email_for_link', email);
    this.callbacks?.onLinkSent('email');
  }

  async completeEmailLinkSignIn(email: string, link: string): Promise<AuthUser> {
    if (!isSignInWithEmailLink(this.auth, link)) {
      throw new Error('Enlace de autenticación inválido o expirado');
    }

    const result = await signInWithEmailLink(this.auth, email, link);
    localStorage.removeItem('auth_email_for_link');
    
    // Sync local data to cloud
    await this.syncToCloud();
    
    this.currentUser = this.mapFirebaseUser(result.user);
    this.currentState = 'authenticated';
    this.callbacks?.onStateChange(this.currentState, this.currentUser);
    
    return this.currentUser;
  }

  async upgradeAnonymousWithEmailLink(email: string): Promise<AuthUser> {
    await this.sendEmailLink(email);
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
        if (user && !user.isAnonymous) {
          unsubscribe();
          await this.syncToCloud();
          resolve(this.mapFirebaseUser(user));
        }
      });
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Tiempo agotado esperando verificación de email'));
      }, 10 * 60 * 1000);
    });
  }

  // ==========================================
  // WHATSAPP / PHONE AUTH
  // ==========================================

  private confirmationResult: any = null;

  async sendWhatsAppCode(phoneNumber: string): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    try {
      if (!this.recaptchaVerifier) {
        this.recaptchaVerifier = new RecaptchaVerifier(this.auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }

      this.confirmationResult = await signInWithPhoneNumber(
        this.auth,
        this.formatPhoneNumber(phoneNumber),
        this.recaptchaVerifier
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
      
      await this.syncToCloud();
      
      this.currentUser = this.mapFirebaseUser(result.user);
      this.currentState = 'authenticated';
      this.callbacks?.onStateChange(this.currentState, this.currentUser);
      
      return this.currentUser;
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

    const anonymousUser = this.auth.currentUser;
    if (!anonymousUser || !anonymousUser.isAnonymous) {
      throw new Error('No hay usuario anónimo para vincular');
    }

    const result = await linkWithCredential(anonymousUser, credential);
    this.confirmationResult = null;
    
    await this.syncToCloud();
    
    this.currentUser = this.mapFirebaseUser(result.user);
    this.currentState = 'authenticated';
    this.callbacks?.onStateChange(this.currentState, this.currentUser);
    
    return this.currentUser;
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = '+57' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    return cleaned;
  }

  // ==========================================
  // ACCOUNT RECOVERY BY 6-DIGIT CODE
  // ==========================================

  async recoverAccountByCode(code: string): Promise<AuthUser> {
    if (!code || code.length !== 6) {
      throw new Error('Código de recuperación debe tener 6 dígitos');
    }

    const storedCode = getStorageItem(STORAGE_KEYS.RECOVERY_CODE);
    if (!storedCode || storedCode !== code) {
      throw new Error('Código de recuperación inválido');
    }

    // Sign in anonymously first (to get a user session)
    await this.ensureAuthenticated();
    
    // Load local data associated with this code
    const localData = getStorageItem(STORAGE_KEYS.GUEST_DATA);
    if (localData) {
      const parsed = JSON.parse(localData);
      if (parsed.recoveryCode === code) {
        // Data matches - restore local data
        this.currentUser = this.currentUser ? { ...this.currentUser, localData: parsed } : null;
        return this.currentUser!;
      }
    }

    throw new Error('No se encontraron datos para este código de recuperación');
  }

  // ==========================================
  // GOOGLE OAUTH (LEGACY - kept for compatibility)
  // ==========================================

  async signInWithGoogle(): Promise<AuthUser> {
    // @ts-ignore - Capacitor.Plugins exists at runtime but not in types
    const { AndroidAuthBridge } = Capacitor.Plugins;
    if (AndroidAuthBridge?.requestNativeGoogleAuth) {
      return this.initiateGoogleSignInViaAndroidBridge();
    }

    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    const result = await FirebaseAuthentication.signInWithGoogle({
      useCredentialManager: false,
    });

    if (!result.credential?.idToken) {
      throw new Error('No se recibió token de autenticación');
    }

    const credential = EmailAuthProvider.credential(result.credential.idToken, result.credential.accessToken || '');
    const result2 = await signInWithCredential(this.auth, credential);
    
    await this.syncToCloud();
    
    this.currentUser = this.mapFirebaseUser(result2.user);
    this.currentState = 'authenticated';
    this.callbacks?.onStateChange(this.currentState, this.currentUser);
    
    return this.currentUser;
  }

  private async initiateGoogleSignInViaAndroidBridge(): Promise<AuthUser> {
    // @ts-ignore - Capacitor.Plugins exists at runtime but not in types
    const { AndroidAuthBridge } = Capacitor.Plugins;
    const result = await AndroidAuthBridge.requestNativeGoogleAuth();
    
    if (!result?.success || !result.id_token) {
      throw new Error(result?.error || 'Error en Google Sign-In nativo');
    }

    const credential = EmailAuthProvider.credential(result.id_token, '');
    const result2 = await signInWithCredential(this.auth, credential);
    
    await this.syncToCloud();
    
    this.currentUser = this.mapFirebaseUser(result2.user);
    this.currentState = 'authenticated';
    this.callbacks?.onStateChange(this.currentState, this.currentUser);
    
    return this.currentUser;
  }

// ==========================================
// UTILITIES
// ==========================================

  setCallbacks(callbacks: AuthServiceCallbacks) {
    this.callbacks = callbacks;
    this.callbacks.onStateChange(this.currentState, this.currentUser);
  }

  async signOut(): Promise<void> {
    // Clear local data but keep recovery code for account recovery
    removeStorageItem(STORAGE_KEYS.GUEST_DATA);
    removeStorageItem(STORAGE_KEYS.USER_PROFILE);
    removeStorageItem(STORAGE_KEYS.PENDING_SYNC);
    await this.auth.signOut();
    this.currentUser = null;
    this.currentState = 'loading';
    this.callbacks?.onStateChange(this.currentState, null);
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

// ==========================================
// SINGLETON & HOOK
// ==========================================

export const authService = new AuthService();

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
      onLinkSent: (method) => console.log(`[Auth] Link sent via ${method}`),
      onRecoveryCodeGenerated: (code) => console.log('[Auth] Recovery code generated:', code),
      onSyncComplete: (synced) => console.log('[Auth] Sync complete:', synced),
    });

    return () => {
      authService.setCallbacks({
        onStateChange: () => {},
        onError: () => {},
        onLinkSent: () => {},
        onRecoveryCodeGenerated: () => {},
        onSyncComplete: () => {},
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

  const recoverAccount = useCallback(async (code: string) => {
    setError(null);
    return authService.recoverAccountByCode(code);
  }, []);

  const getRecoveryCode = useCallback(() => {
    return authService.getRecoveryCode();
  }, []);

  const saveLocalData = useCallback(async (data: any) => {
    return authService.saveLocalData(data);
  }, []);

  const loadLocalData = useCallback(async () => {
    return authService.loadLocalData();
  }, []);

  const updateProfile = useCallback(async (profile: any) => {
    return authService.updateProfile(profile);
  }, []);

  const addRentalHistory = useCallback(async (rental: any) => {
    return authService.addRentalHistory(rental);
  }, []);

  const addFavorite = useCallback(async (washerId: string) => {
    return authService.addFavorite(washerId);
  }, []);

  const removeFavorite = useCallback(async (washerId: string) => {
    return authService.removeFavorite(washerId);
  }, []);

  const updateCart = useCallback(async (cart: any) => {
    return authService.updateCart(cart);
  }, []);

  const addNotification = useCallback(async (notification: any) => {
    return authService.addNotification(notification);
  }, []);

  const getLocalData = useCallback(() => {
    return authService.getLocalData();
  }, []);

  const signOut = useCallback(async () => {
    return authService.signOut();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    state,
    user: authService.getCurrentUser(),
    error,
    isAnonymous: authService.isAnonymous(),
    isAuthenticated: !authService.isAnonymous(),
    signInAnonymously,
    sendEmailLink,
    completeEmailLink,
    sendWhatsAppCode,
    verifyWhatsAppCode,
    upgradeWithEmail,
    upgradeWithPhone,
    recoverAccount,
    getRecoveryCode,
    saveLocalData,
    loadLocalData,
    updateProfile,
    addRentalHistory,
    addFavorite,
    removeFavorite,
    updateCart,
    addNotification,
    getLocalData,
    signOut,
    clearError,
  };
}

// Email link completion handler
export async function handleEmailLinkCompletion(): Promise<{ success: boolean; error?: string }> {
  const authInstance = getAuthInstance();
  if (isSignInWithEmailLink(authInstance, window.location.href)) {
    const email = getStorageItem('auth_email_for_link') || new URLSearchParams(window.location.search).get('email');
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