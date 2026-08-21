'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Auth,
  User,
  signInAnonymously,
  signInWithEmailLink,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  linkWithCredential,
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
import { deviceFingerprint } from '@/lib/device/DeviceFingerprint';
import { phoneAuth } from './PhoneAuthService';
import { doc, getDoc, setDoc, serverTimestamp, query, where, limit, collection, getDocs } from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase';

export type AuthMethod = 'anonymous' | 'email-link' | 'whatsapp' | 'recovery-code';
export type AuthState = 'loading' | 'anonymous' | 'authenticated' | 'phone_verification_needed' | 'account_selection' | 'code_login_needed' | 'error';

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
  REMEMBERED_ACCOUNT: 'lavadoras_remembered_account',
  RECOVERY_ATTEMPTS: 'lavadoras_recovery_attempts',
} as const;

// Rate limiting config
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hora

interface RecoveryAttempt {
  timestamp: number;
  ip?: string;
}

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
  originalUid?: string; // UID original si se recuperó con código diferente al actual
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

// Remembered Account type
interface RememberedAccount {
  uid: string;
  displayName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  photoURL?: string | null;
  isAnonymous: boolean;
  rememberedAt: string;
}

class AuthService {
  private auth: Auth;
  private callbacks: AuthServiceCallbacks | null = null;
  private unsubscribe: (() => void) | null = null;
  private currentUser: AuthUser | null = null;
  private currentState: AuthState = 'loading';
  private initPromise: Promise<void> | null = null;
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private initialized: boolean = false;

  constructor() {
    this.auth = getAuthInstance();
    // Don't initialize in constructor - wait for client-side
    if (typeof window !== 'undefined') {
      this.initPromise = this.initializeAuth();
    }
  }

  ensureInitialized(): Promise<void> {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initialized = true;
      this.initPromise = this.initializeAuth();
    }
    return this.initPromise || Promise.resolve();
  }

  // Error handling helper - defined early so it's available to all methods
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

  // ==========================================
  // INITIALIZATION - AUTO INSTANT AUTH WITH DEVICE FINGERPRINT
  // ==========================================
  private async initializeAuth(): Promise<void> {
    // Wrap everything in try-catch to prevent app crashes
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.warn('[AuthService] Running in non-browser environment, skipping auth init');
        return;
      }

      // 1. Get device fingerprint (persistent across reinstalls)
      let deviceFingerprintStr = '';
      try {
        const deviceFp = await deviceFingerprint.getFingerprint();
        deviceFingerprintStr = deviceFp.fingerprint;
        console.log('[AuthService] Device fingerprint:', deviceFingerprintStr);
      } catch (fpError) {
        console.warn('[AuthService] Failed to get device fingerprint, using fallback:', fpError);
        deviceFingerprintStr = 'fallback-' + Math.random().toString(36).substring(7);
      }

      // 0. Check if user is already authenticated (not anonymous)
      if (this.auth.currentUser && !this.auth.currentUser.isAnonymous) {
        console.log('[AuthService] User already authenticated, restoring session');
        this.currentUser = this.mapFirebaseUser(this.auth.currentUser);
        this.currentState = 'authenticated';
        this.callbacks?.onStateChange(this.currentState, this.currentUser);
        
        // Load local data and start listener
        await this.loadLocalData();
        this.startAuthListener();
        return;
      }

      // 1. Check for email link completion
      if (isSignInWithEmailLink(this.auth, window.location.href)) {
        const email = getStorageItem('auth_email_for_link') || 
          new URLSearchParams(window.location.search).get('email');
        if (email) {
          try {
            await this.completeEmailLinkSignIn(email, window.location.href);
          } catch (e) {
            console.warn('[AuthService] Email link sign-in failed:', e);
          }
          return;
        }
      }

      // 2. Check for remembered account (from previous logout)
      const rememberedAccount = this.getRememberedAccount();
      
      // 3. Check if device is already linked to a phone number
      let linkedPhone = null;
      try {
        linkedPhone = await phoneAuth.getPhoneByDeviceFingerprint(deviceFingerprintStr);
      } catch (e) {
        console.warn('[AuthService] Failed to check device-phone link:', e);
      }
      
      if (linkedPhone && rememberedAccount) {
        // Device is linked to a phone AND there's a remembered account
        // Show account selection screen instead of auto-sending SMS
        console.log('[AuthService] Remembered account found with device-phone link:', rememberedAccount.displayName);
        this.currentState = 'account_selection';
        this.callbacks?.onStateChange(this.currentState, null);
        // Store linked phone for quick restore
        setStorageItem('linked_phone_for_verification', linkedPhone);
      } else if (linkedPhone) {
        // Device is linked to a phone but no remembered account (new install or cleared data)
        // Auto-restore account by sending SMS code
        console.log('[AuthService] Device linked to phone, auto-restoring:', linkedPhone);
        this.currentState = 'phone_verification_needed';
        this.callbacks?.onStateChange(this.currentState, null);
        // Store linked phone for verification UI
        setStorageItem('linked_phone_for_verification', linkedPhone);
        // Auto-send SMS code for instant auto-restore
        try {
          await this.sendWhatsAppCode(linkedPhone);
        } catch (e) {
          console.warn('[AuthService] Failed to send WhatsApp code:', e);
        }
      } else {
        // Auto-instant anonymous auth (INSTANT) - first time user
        try {
          await this.ensureAuthenticated();
        } catch (e) {
          console.warn('[AuthService] Failed to ensure authentication:', e);
        }
        
        // Generate recovery code if doesn't exist
        const existingRecoveryCode = getStorageItem(STORAGE_KEYS.RECOVERY_CODE);
        if (!existingRecoveryCode) {
          try {
            await this.generateAndStoreRecoveryCode();
          } catch (e) {
            console.warn('[AuthService] Failed to generate recovery code:', e);
          }
        }
      }

      // 5. Load local data
      try {
        await this.loadLocalData();
      } catch (e) {
        console.warn('[AuthService] Failed to load local data:', e);
      }

      // 6. Start auth state listener
      try {
        this.startAuthListener();
      } catch (e) {
        console.warn('[AuthService] Failed to start auth listener:', e);
      }

    } catch (error) {
      console.error('[AuthService] Initialization error:', error);
      // Don't crash the app - set error state but allow UI to render
      this.currentState = 'anonymous';
      this.callbacks?.onStateChange(this.currentState, null);
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.auth.currentUser) {
      this.currentUser = this.mapFirebaseUser(this.auth.currentUser);
      this.currentState = this.auth.currentUser.isAnonymous ? 'anonymous' : 'authenticated';
      // Sync local data to cloud for both anonymous and authenticated users
      await this.syncToCloud();
      return;
    }

    // Instant anonymous sign-in
    const result = await signInAnonymously(this.auth);
    this.currentUser = this.mapFirebaseUser(result.user);
    this.currentState = 'anonymous';
    
    // Initialize local data for new user
    await this.initializeLocalData(result.user.uid);
    // Sync local data to cloud for anonymous user
    await this.syncToCloud();
  }

  private async initializeLocalData(uid: string): Promise<void> {
    // Get or create permanent recovery code from Firestore
    const recoveryCode = await this.getOrCreatePermanentRecoveryCode(uid);
    
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

  // ==========================================
  // RECOVERY CODE - PERMANENT IN FIRESTORE
  // ==========================================

  private async getOrCreatePermanentRecoveryCode(uid: string): Promise<string> {
    try {
      const db = getFirestoreInstance();
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && userDoc.data().recoveryCode) {
        const existingCode = userDoc.data().recoveryCode;
        console.log('[AuthService] Using existing permanent recovery code from Firestore');
        return existingCode;
      }
    } catch (error) {
      console.warn('[AuthService] Could not read recovery code from Firestore:', error);
    }

    // Generate new permanent recovery code
    const newCode = this.generateRecoveryCode();
    
    // Save to Firestore permanently
    try {
      const db = getFirestoreInstance();
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        recoveryCode: newCode,
        recoveryCodeCreatedAt: serverTimestamp(),
      }, { merge: true });
      console.log('[AuthService] Generated and saved new permanent recovery code to Firestore');
    } catch (error) {
      console.error('[AuthService] Failed to save recovery code to Firestore:', error);
    }

    return newCode;
  }

  private generateRecoveryCode(): string {
    // Generate 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateAndStoreRecoveryCode(): Promise<string> {
    if (!this.currentUser) return '';
    const code = await this.getOrCreatePermanentRecoveryCode(this.currentUser.uid);
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
  // SYNC TO CLOUD (when user upgrades OR for anonymous users)
  // ==========================================

  async syncToCloud(): Promise<boolean> {
    if (!this.currentUser) {
      return false;
    }

    try {
      const localData = this.getLocalData();
      if (!localData) return false;

      const db = getFirestoreInstance();
      const userRef = doc(db, 'users', this.currentUser.uid);
      
      // Prepare data to sync
      const syncData = {
        ...localData,
        uid: this.currentUser.uid,
        isAnonymous: this.currentUser.isAnonymous,
        deviceFingerprint: await deviceFingerprint.getFingerprintString(),
        lastSync: serverTimestamp(),
        updatedAt: new Date().toISOString(),
      };

      // Sync to Firestore
      await setDoc(doc(db, 'users', this.currentUser.uid), syncData, { merge: true });
      
      // Mark as synced locally
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
      
      // Set up WebOTP API for auto-fill on Android
      if ('OTPCredential' in window) {
        try {
          const otp = await (window as any).navigator.credentials.get({
            otp: { transport: ['sms'] },
            signal: AbortSignal.timeout(60000) // 60 second timeout
          });
          if (otp && (otp as any).code) {
            // Auto-verify the code when it arrives
            this.verifyWhatsAppCode((otp as any).code).catch(() => {});
          }
        } catch {
          // WebOTP not supported or permission denied, continue normally
        }
      }
      
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
    
    // Link device fingerprint to phone number in Firestore
    const deviceFingerprintStr = await deviceFingerprint.getFingerprintString();
    await phoneAuth.linkDeviceToPhone(deviceFingerprintStr, formattedPhone);
    
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
  // ACCOUNT RECOVERY / LOGIN BY 6-DIGIT CODE (PERMANENT IN FIRESTORE)
  // Unified method: serves both recovery and login with code
  // ==========================================

  private async checkRateLimit(uid: string): Promise<{ allowed: boolean; remainingAttempts: number }> {
    if (typeof window === 'undefined') return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS };
    
    try {
      const stored = getStorageItem(STORAGE_KEYS.RECOVERY_ATTEMPTS);
      const attempts: RecoveryAttempt[] = stored ? JSON.parse(stored) : [];
      const now = Date.now();
      const windowStart = now - RATE_LIMIT_WINDOW_MS;
      
      // Filter attempts within the last hour
      const recentAttempts = attempts.filter(a => a.timestamp > windowStart);
      
      if (recentAttempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
        return { allowed: false, remainingAttempts: 0 };
      }
      
      return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - recentAttempts.length };
    } catch {
      return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS };
    }
  }

  private async recordRecoveryAttempt(uid: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = getStorageItem(STORAGE_KEYS.RECOVERY_ATTEMPTS);
      const attempts: RecoveryAttempt[] = stored ? JSON.parse(stored) : [];
      const now = Date.now();
      
      attempts.push({ timestamp: now });
      
      // Keep only last 24 hours of attempts
      const dayAgo = now - 24 * 60 * 60 * 1000;
      const filtered = attempts.filter(a => a.timestamp > dayAgo);
      
      setStorageItem(STORAGE_KEYS.RECOVERY_ATTEMPTS, JSON.stringify(filtered));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Método unificado: Iniciar sesión / Recuperar cuenta con código de 6 dígitos
   * Busca el código en Firestore, autentica al usuario y restaura TODOS sus datos
   */
  async signInWithRecoveryCode(code: string): Promise<AuthUser> {
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      throw new Error('Código debe tener 6 dígitos numéricos');
    }

    // Rate limiting check (local, antes de consultar Firestore)
    if (this.currentUser?.uid) {
      const rateLimit = await this.checkRateLimit(this.currentUser.uid);
      if (!rateLimit.allowed) {
        throw new Error(`Demasiados intentos. Intenta de nuevo en 1 hora.`);
      }
    }

    try {
      const db = getFirestoreInstance();
      
      // Query Firestore for user with this recovery code
      const usersQuery = query(
        collection(db, 'users'),
        where('recoveryCode', '==', code),
        limit(1)
      );
      
      const snapshot = await getDocs(usersQuery);
      
      if (snapshot.empty) {
        // Record failed attempt for rate limiting
        if (this.currentUser?.uid) {
          await this.recordRecoveryAttempt(this.currentUser.uid);
        }
        throw new Error('Código de recuperación inválido. Verifica tu código de 6 dígitos.');
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      const targetUid = userDoc.id;

      // Record attempt for rate limiting
      await this.recordRecoveryAttempt(targetUid);

      // Sign in anonymously first to get a valid auth session
      await this.ensureAuthenticated();

      // If we're already the right user, just restore data
      if (this.currentUser?.uid === targetUid) {
        // Load full data from Firestore
        const fullData = userData as any;
        const localData: LocalUserData = {
          uid: targetUid,
          recoveryCode: code,
          profile: fullData.profile || {},
          rentalHistory: fullData.rentalHistory || [],
          favorites: fullData.favorites || [],
          cart: fullData.cart || [],
          notifications: fullData.notifications || [],
          createdAt: fullData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          synced: true,
        };

        // Save to localStorage
        setStorageItem(STORAGE_KEYS.RECOVERY_CODE, code);
        setStorageItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(localData));
        
        this.currentUser = this.mapFirebaseUser(this.auth.currentUser!);
        this.currentUser.localData = localData;
        this.currentState = 'authenticated';
        this.callbacks?.onStateChange(this.currentState, this.currentUser);
        
        // Update device fingerprint link to this device (in case of device switch)
        try {
          const deviceFp = await deviceFingerprint.getFingerprint();
          await phoneAuth.linkDeviceToPhone(deviceFp.fingerprint, fullData.phoneNumber || '');
          console.log('[AuthService] Device fingerprint updated for same user login');
        } catch (e) {
          console.warn('[AuthService] Could not update device fingerprint link:', e);
        }
        
        return this.currentUser;
      }

      // Different user - need to sign out and sign in as the target user
      // For anonymous users, we can't directly switch UIDs, so we restore data to current session
      // The key insight: the recovery code maps to a UID, but we're authenticated as anonymous
      // We'll restore the data to the current anonymous session
      
      const fullData = userData as any;
      const currentAuthUser = this.auth.currentUser;
      if (!currentAuthUser) {
        throw new Error('No hay sesión activa para restaurar datos');
      }
      const localData: LocalUserData = {
        uid: currentAuthUser.uid, // Keep current UID for auth
        originalUid: targetUid,    // Track original UID for reference
        recoveryCode: code,
        profile: fullData.profile || {},
        rentalHistory: fullData.rentalHistory || [],
        favorites: fullData.favorites || [],
        cart: fullData.cart || [],
        notifications: fullData.notifications || [],
        createdAt: fullData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: true,
      };

      // Save to localStorage
      setStorageItem(STORAGE_KEYS.RECOVERY_CODE, code);
      setStorageItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(localData));
      
      this.currentUser = this.mapFirebaseUser(this.auth.currentUser!);
      this.currentUser.localData = localData;
      this.currentState = 'authenticated';
      this.callbacks?.onStateChange(this.currentState, this.currentUser);
      
      // IMPORTANT: Update device fingerprint link to point to this new device
      // This effectively transfers the account to the new device
      try {
        const deviceFp = await deviceFingerprint.getFingerprint();
        await phoneAuth.linkDeviceToPhone(deviceFp.fingerprint, fullData.phoneNumber || '');
        console.log('[AuthService] Device fingerprint linked to phone for new device login');
      } catch (e) {
        console.warn('[AuthService] Could not update device fingerprint link:', e);
      }
      
      // Sync this data back to Firestore under current UID
      await this.syncToCloud();
      
      return this.currentUser;

    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Error al iniciar sesión con código');
    }
  }

  // Alias for backward compatibility
  async recoverAccountByCode(code: string): Promise<AuthUser> {
    return this.signInWithRecoveryCode(code);
  }

  // ==========================================
  // REMEMBERED ACCOUNT (for quick re-login after logout)
  // ==========================================

  private saveRememberedAccount(): void {
    if (!this.currentUser) return;
    const remembered: RememberedAccount = {
      uid: this.currentUser.uid,
      displayName: this.currentUser.displayName,
      phoneNumber: this.currentUser.phoneNumber,
      email: this.currentUser.email,
      photoURL: this.currentUser.photoURL,
      isAnonymous: this.currentUser.isAnonymous,
      rememberedAt: new Date().toISOString(),
    };
    setStorageItem(STORAGE_KEYS.REMEMBERED_ACCOUNT, JSON.stringify(remembered));
  }

  getRememberedAccount(): RememberedAccount | null {
    try {
      const data = getStorageItem(STORAGE_KEYS.REMEMBERED_ACCOUNT);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  clearRememberedAccount(): void {
    removeStorageItem(STORAGE_KEYS.REMEMBERED_ACCOUNT);
  }

  async signOut(): Promise<void> {
    // Save current user as "remembered account" for quick re-login
    this.saveRememberedAccount();
    
    // Keep local data (GUEST_DATA, USER_PROFILE) for seamless restore
    // Keep recovery code
    // Keep device-phone link in Firestore (don't unlink)
    
    await this.auth.signOut();
    this.currentUser = null;
    this.currentState = 'loading';
    this.callbacks?.onStateChange(this.currentState, null);
  }

  /**
   * Quick restore: re-authenticate using device fingerprint + phone link
   * This triggers auto-SMS which WebOTP will auto-fill on Android
   */
  async quickRestoreAccount(): Promise<AuthUser | null> {
    try {
      // Check if device is linked to a phone
      const deviceFp = await deviceFingerprint.getFingerprint();
      const linkedPhone = await phoneAuth.getPhoneByDeviceFingerprint(deviceFp.fingerprint);
      
      if (!linkedPhone) {
        return null;
      }

      // Set state to phone_verification_needed and auto-send SMS
      this.currentState = 'phone_verification_needed';
      this.callbacks?.onStateChange(this.currentState, null);
      setStorageItem('linked_phone_for_verification', linkedPhone);
      await this.sendWhatsAppCode(linkedPhone);
      
      // Return null - the auth state will change to 'authenticated' when SMS is verified
      return null;
    } catch (error) {
      console.error('[AuthService] Quick restore error:', error);
      return null;
    }
  }

  // ==========================================
  // PHONE AUTH - AUTO LOGIN WITH DEVICE FINGERPRINT
  // ==========================================

  /**
   * Inicia sesión con teléfono (para auto-login con device fingerprint)
   */
  async signInWithPhone(phoneNumber: string): Promise<AuthUser> {
    try {
      // Send verification code
      const result = await phoneAuth.sendCode(phoneNumber);
      if (!result.success) {
        throw new Error(result.error || 'Error enviando código');
      }

      // Wait for user to enter code (this would be handled by UI)
      // For auto-login, we need to store the verificationId and wait for user input
      // This is handled by the UI component
      throw new Error('PHONE_VERIFICATION_REQUIRED');
    } catch (error: any) {
      if (error.message === 'PHONE_VERIFICATION_REQUIRED') {
        throw error;
      }
      const msg = this.getErrorMessage(error);
      throw new Error(msg);
    }
  }

  /**
   * Verifica código SMS y completa login con teléfono
   */
  async verifyPhoneCode(code: string): Promise<AuthUser> {
    const result = await phoneAuth.verifyCode(code);
    if (!result.success || !result.user) {
      throw new Error(result.error || 'Código inválido');
    }

    await this.syncToCloud();
    
    this.currentUser = this.mapFirebaseUser(result.user!);
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

  destroy() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.callbacks = null;
  }
}

export const authService = new AuthService();

export function useAuth() {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ensure auth is initialized on client side
    authService.ensureInitialized();

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

  const signInWithRecoveryCode = useCallback(async (code: string) => {
    setError(null);
    return authService.signInWithRecoveryCode(code);
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

  const getRememberedAccount = useCallback(() => {
    return authService.getRememberedAccount();
  }, []);

  const clearRememberedAccount = useCallback(() => {
    return authService.clearRememberedAccount();
  }, []);

  const quickRestoreAccount = useCallback(async () => {
    setError(null);
    return authService.quickRestoreAccount();
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
    recoverAccount,
    signInWithRecoveryCode,
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
    getRememberedAccount,
    clearRememberedAccount,
    quickRestoreAccount,
    clearError,
  };
}

// Email link completion handler (call on /auth/complete page)
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