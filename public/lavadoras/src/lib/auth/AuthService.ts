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
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { getAuthInstance } from '@/firebase';
import { deviceFingerprint } from '@/lib/device/DeviceFingerprint';
import { phoneAuth } from './PhoneAuthService';
import { doc, getDoc, setDoc, serverTimestamp, query, where, limit, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase';

export type AuthMethod = 'anonymous' | 'email-link' | 'whatsapp' | 'recovery-code' | 'google';
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

  // ==========================================
  // AUTO-RESTORE & AUTH LISTENER
  // ==========================================

  private autoRestoreLock = false;

  /**
   * Initialize the auth state listener (call once on app mount)
   */
  initializeAuthListener(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
    this.startAuthListener();
  }

  /**
   * Perform auto-restore of session from cloud/device data
   * Called when user is already authenticated
   */
  async performAutoRestore(): Promise<void> {
    if (!this.auth.currentUser) return;
    if (this.currentState !== 'anonymous' && this.currentState !== 'authenticated') return;

    // Prevent duplicate executions
    if (this.autoRestoreLock) {
      console.log('[AuthService] performAutoRestore: ALREADY RUNNING, skipping...');
      return;
    }
    this.autoRestoreLock = true;

    try {
      // 1. READ FIRST FROM CLOUD (users/{uid}) - SOURCE OF TRUTH CROSS-DEVICE
      console.log('[AuthService] performAutoRestore: reading users/{uid} from cloud...');
      const userData = await this.getUserDataFromCloud(this.auth.currentUser.uid);
      
      if (userData) {
        console.log('[AuthService] ✓ Data found in cloud, restoring...');
        await this.restoreFromCloudData(userData);
        
        // Save to device_data for future fast local restores
        const deviceFp = await deviceFingerprint.getFingerprint();
        await this.addAccountToDeviceData(deviceFp.fingerprint, this.auth.currentUser.uid, {
          ...userData,
          synced: true,
        });
        await this.setCurrentAccount(deviceFp.fingerprint, this.auth.currentUser.uid);
        await this.linkDeviceFingerprintToUid(this.auth.currentUser.uid);
        
        // Load local and sync
        await this.loadLocalData();
        await this.syncToCloud();
        console.log('[AuthService] performAutoRestore COMPLETE (from cloud)');
        return;
      }

      console.log('[AuthService] No data in cloud for UID:', this.auth.currentUser.uid);

      // 2. FALLBACK: device_data (device-only)
      console.log('[AuthService] No data in cloud, trying device_data...');
      const deviceFp = await deviceFingerprint.getFingerprint();
      const deviceFingerprintStr = deviceFp.fingerprint;
      const deviceData = await this.getDeviceData(deviceFingerprintStr);
      
      if (deviceData) {
        await this.restoreFromDeviceData(deviceFingerprintStr, deviceData);
      } else {
        // 3. FALLBACK: legacy mapping
        let linkedUid = null;
        try {
          linkedUid = await this.getUidByDeviceFingerprint(deviceFingerprintStr);
        } catch (e) {
          console.warn('[AuthService] Failed to check legacy mapping:', e);
        }

        if (linkedUid) {
          if (linkedUid === this.auth.currentUser?.uid) {
            const localData = this.getLocalData();
            if (localData) {
              await this.addAccountToDeviceData(deviceFingerprintStr, this.auth.currentUser.uid, {
                ...localData,
                synced: true,
              });
            }
          }
          await this.linkDeviceFingerprintToUid(this.auth.currentUser.uid);
        } else {
          // No cloud data found anywhere. CRITICAL: do NOT create a new
          // anonymous session here — churning the user's uid is what made
          // data "disappear" after logout/reopen. Keep the current session
          // and back up the existing local data to the cloud instead.
          console.log('[AuthService] No cloud data found — keeping current session and backing up local data');
          try {
            await this.syncToCloud();
          } catch (e) {
            console.warn('[AuthService] Initial cloud backup failed (non-fatal):', e);
          }
        }
      }

      await this.loadLocalData();
      await this.syncToCloud();

    } catch (error) {
      console.error('[AuthService] Auto-restore error:', error);
      // Ensure user has minimal data
      if (this.auth.currentUser && !this.getLocalData()) {
        await this.initializeLocalData(this.auth.currentUser.uid);
        await this.syncToCloud();
      }
    } finally {
      // ALWAYS release the lock
      this.autoRestoreLock = false;
    }
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

      // IMPORTANT: Wait for Firebase Auth to finish loading persisted session from IndexedDB
      // Using a Promise that resolves when auth state is first detected
      const authUser = await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(this.auth, (user) => {
          unsubscribe();
          resolve(user);
        });
        // Timeout fallback in case onAuthStateChanged never fires
        setTimeout(() => {
          unsubscribe();
          resolve(this.auth.currentUser);
        }, 3000);
      });
      console.log('[AuthService] Firebase auth state ready, user:', authUser ? (authUser as any).uid : 'null');

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

      // 2. Check if user is already authenticated (not anonymous)
      if (this.auth.currentUser && !this.auth.currentUser.isAnonymous) {
        console.log('[AuthService] User already authenticated, restoring session');
        this.currentUser = this.mapFirebaseUser(this.auth.currentUser);
        this.currentState = 'authenticated';
        this.callbacks?.onStateChange(this.currentState, this.currentUser);
        
        // Load local data and start listener
        await this.loadLocalData();
        
        // Ensure recovery code is in localStorage for authenticated users
        // (may be missing if user logged in via email/phone on this device for first time)
        const hasRecoveryCode = getStorageItem(STORAGE_KEYS.RECOVERY_CODE);
        if (!hasRecoveryCode) {
          try {
            const db = getFirestoreInstance();
            const userRef = doc(db, 'users', this.auth.currentUser.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists() && userDoc.data().recoveryCode) {
              const recoveryCode = userDoc.data().recoveryCode;
              setStorageItem(STORAGE_KEYS.RECOVERY_CODE, recoveryCode);
              console.log('[AuthService] Recovery code restored from Firestore for authenticated user');
            }
          } catch (e) {
            console.warn('[AuthService] Could not restore recovery code from Firestore:', e);
          }
        }
        
        this.startAuthListener();
        return;
      }

      // 3. Check if already anonymous - if so, auto-restore
      if (this.auth.currentUser && this.auth.currentUser.isAnonymous) {
        console.log('[AuthService] User is anonymous, performing auto-restore...');
        await this.performAutoRestore();
        this.startAuthListener();
        return;
      }

      // 4. NO USER AT ALL - create new anonymous session
      console.log('[AuthService] No user found, creating new anonymous session...');
      await this.signInAnonymously();
      this.currentState = 'anonymous';
      this.callbacks?.onStateChange(this.currentState, null);
      this.startAuthListener();
      return;

      // 5. Check email link completion
      if (isSignInWithEmailLink(this.auth, window.location.href)) {
        const email = getStorageItem('auth_email_for_link') || 
          new URLSearchParams(window.location.search).get('email');
        if (email) {
          try {
            await this.completeEmailLinkSignIn(email!, window.location.href);
          } catch (e) {
            console.warn('[AuthService] Email link sign-in failed:', e);
          }
          return;
        }
      }

      // 6. Check remembered account (from previous logout)
      // 7. Check if device is already linked to a phone number
      let linkedPhone = null;
      try {
        linkedPhone = await phoneAuth.getPhoneByDeviceFingerprint(deviceFingerprintStr);
      } catch (e) {
        console.warn('[AuthService] Failed to check device-phone link:', e);
      }
      
      // 6. Load remembered account (from previous logout)
      const rememberedAccount = this.getRememberedAccount();

      if (linkedPhone && rememberedAccount) {
        // Device is linked to a phone AND there's a remembered account
        // Show account selection screen instead of auto-sending SMS
        console.log('[AuthService] Remembered account found with device-phone link:', rememberedAccount?.displayName);
        this.currentState = 'account_selection';
        this.callbacks?.onStateChange(this.currentState, null);
        // Store linked phone for quick restore
        setStorageItem('linked_phone_for_verification', linkedPhone);
        return;
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
        return;
      } else {
        // NEW ARCHITECTURE: Check device_data collection first (stable by device fingerprint)
        console.log('[AuthService] Checking device_data for fingerprint:', deviceFingerprintStr);
        const deviceData = await this.getDeviceData(deviceFingerprintStr);
        
        if (deviceData) {
          // EXISTING DATA ON THIS DEVICE → Restore session
          console.log('[AuthService] Device data found, restoring session');
          await this.restoreFromDeviceData(deviceFingerprintStr, deviceData);
        } else {
          // NO DATA ON THIS DEVICE → Check legacy mapping as fallback
          console.log('[AuthService] No device data, checking legacy device_fingerprints mapping');
          let linkedUid = null;
          try {
            linkedUid = await this.getUidByDeviceFingerprint(deviceFingerprintStr);
            console.log('[AuthService] Legacy mapping lookup:', linkedUid ? `found UID: ${linkedUid}` : 'no linked UID');
          } catch (e) {
            console.warn('[AuthService] Failed to check legacy mapping:', e);
          }
          
          if (linkedUid) {
            // LEGACY MAPPING EXISTS → Migrate to new architecture
            console.log('[AuthService] Legacy mapping found, migrating to device_data');
            try {
              const db = getFirestoreInstance();
              const userRef = doc(db, 'users', linkedUid);
              const userDoc = await getDoc(userRef);
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const fullData = userData as any;
                
                // Sign in anonymously
                await this.ensureAuthenticated();
                const currentAuthUser = this.auth.currentUser;
                if (!currentAuthUser) throw new Error('No auth user after ensureAuthenticated');
                
                // Restore data to device_data (NEW architecture)
                const deviceData = {
                  uid: currentAuthUser!.uid,
                  recoveryCode: fullData.recoveryCode || '',
                  profile: fullData.profile || {},
                  rentalHistory: fullData.rentalHistory || [],
                  favorites: fullData.favorites || [],
                  cart: fullData.cart || [],
                  notifications: fullData.notifications || [],
                  createdAt: fullData.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  synced: true,
                };
                
                // Save to device_data (NEW architecture)
                await this.saveDeviceData(deviceFingerprintStr, deviceData);
                
                // Prepare local data
                const localData: LocalUserData = {
                  uid: currentAuthUser!.uid,
                  recoveryCode: deviceData.recoveryCode,
                  profile: deviceData.profile,
                  rentalHistory: deviceData.rentalHistory,
                  favorites: deviceData.favorites,
                  cart: deviceData.cart,
                  notifications: deviceData.notifications,
                  createdAt: deviceData.createdAt,
                  updatedAt: new Date().toISOString(),
                  synced: true,
                };

                setStorageItem(STORAGE_KEYS.RECOVERY_CODE, deviceData.recoveryCode);
                setStorageItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(localData));
                
                this.currentUser = this.mapFirebaseUser(currentAuthUser!);
                this.currentUser!.localData = localData;
                this.currentState = 'authenticated';
                this.callbacks?.onStateChange(this.currentState, this.currentUser);
                
                // Update canonical UID
                this.setCanonicalUid(currentAuthUser!.uid);
                
                // Update legacy mapping to current auth UID
                await this.linkDeviceFingerprintToUid(currentAuthUser!.uid);
                
                // Sync to users collection
                await this.syncToCloud();
                
                console.log('[AuthService] Legacy migration complete, session restored');
              } else {
                // Legacy UID has no data, create new session
                await this.createNewSession(deviceFingerprintStr);
              }
            } catch (restoreError) {
              console.error('[AuthService] Legacy migration failed:', restoreError);
              await this.createNewSession(deviceFingerprintStr);
            }
          } else {
            // NO DATA, NO LEGACY → First time on this device
            await this.createNewSession(deviceFingerprintStr);
}
        }
      } // Close else block for linkedPhone check

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

    // Check for canonical UID stored locally (stable across reloads)
    const canonicalUid = this.getCanonicalUid();
    
    if (canonicalUid) {
      // We have a canonical UID - create anonymous session and ensure data is linked
      console.log('[AuthService] Using canonical UID:', canonicalUid);
      const result = await signInAnonymously(this.auth);
      const newUid = result.user.uid;
      
      // If the new UID differs from canonical, migrate data
      if (newUid !== canonicalUid) {
        console.log('[AuthService] Migrating data from canonical UID:', canonicalUid, 'to new UID:', newUid);
        await this.migrateDeviceDataToUid(canonicalUid, newUid);
        // Update canonical UID to new one
        this.setCanonicalUid(newUid);
      } else {
        // Same UID, just ensure it's set
        this.setCanonicalUid(newUid);
      }
      
      this.currentUser = this.mapFirebaseUser(result.user);
      this.currentState = 'anonymous';
      await this.syncToCloud();
      await this.linkDeviceFingerprintToUid(newUid);
      return;
    }

    // No canonical UID - first time on this device
    const result = await signInAnonymously(this.auth);
    const newUid = result.user.uid;
    this.setCanonicalUid(newUid);
    
    this.currentUser = this.mapFirebaseUser(result.user);
    this.currentState = 'anonymous';
    
    // Initialize local data for new user
    await this.initializeLocalData(newUid);
    await this.syncToCloud();
    
    // Link device fingerprint to this new UID
    await this.linkDeviceFingerprintToUid(newUid);
  }

  // ==========================================
  // DEVICE FINGERPRINT MAPPING (Firestore)
  // ==========================================

  /**
   * Link device fingerprint to UID in Firestore for cross-device restore
   * Creates/updates document in device_fingerprints collection
   */
  private async linkDeviceFingerprintToUid(uid: string): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const deviceFp = await deviceFingerprint.getFingerprint();
      const deviceFingerprintStr = deviceFp.fingerprint;
      const recoveryCode = getStorageItem(STORAGE_KEYS.RECOVERY_CODE);
      
      const db = getFirestoreInstance();
      const linkRef = doc(db, 'device_fingerprints', deviceFingerprintStr);
      
      await setDoc(linkRef, {
        uid,
        recoveryCode: recoveryCode || '',
        updatedAt: serverTimestamp(),
        deviceInfo: deviceFp.components,
      }, { merge: true });
      
      console.log('[AuthService] Device fingerprint linked to UID:', uid);
    } catch (error) {
      console.warn('[AuthService] Failed to link device fingerprint:', error);
    }
  }

  /**
   * Get UID associated with device fingerprint from Firestore
   */
  private async getUidByDeviceFingerprint(deviceFingerprintStr: string): Promise<string | null> {
    try {
      const db = getFirestoreInstance();
      const linkRef = doc(db, 'device_fingerprints', deviceFingerprintStr);
      const linkDoc = await getDoc(linkRef);
      
      if (linkDoc.exists()) {
        const data = linkDoc.data();
        return data.uid || null;
      }
      return null;
    } catch (error) {
      console.warn('[AuthService] Failed to get UID by device fingerprint:', error);
      return null;
    }
  }

  /**
   * Remove device fingerprint mapping (for complete logout)
   */
  private async unlinkDeviceFingerprint(deviceFingerprintStr: string): Promise<void> {
    try {
      const db = getFirestoreInstance();
      const linkRef = doc(db, 'device_fingerprints', deviceFingerprintStr);
      await updateDoc(linkRef, {
        unlinkedAt: serverTimestamp(),
        unlinked: true,
      });
    } catch (error) {
      console.warn('[AuthService] Failed to unlink device fingerprint:', error);
    }
  }

  // ==========================================
  // DEVICE DATA STORAGE (NEW ARCHITECTURE)
  // Data stored by device fingerprint (stable), not UID
  // ==========================================

  /**
   * Get device data from Firestore by device fingerprint
   * This is the NEW primary data lookup - stable across UID changes
   */
  private async getDeviceData(deviceFingerprintStr: string): Promise<any | null> {
    try {
      const db = getFirestoreInstance();
      const deviceDataRef = doc(db, 'device_data', deviceFingerprintStr);
      const docSnap = await getDoc(deviceDataRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('[AuthService] Device data found for fingerprint:', deviceFingerprintStr);
        return data;
      }
      console.log('[AuthService] No device data found for fingerprint:', deviceFingerprintStr);
      return null;
    } catch (error) {
      console.warn('[AuthService] Failed to get device data:', error);
      return null;
    }
  }

  /**
   * Save device data to Firestore by device fingerprint
   * This is the NEW primary data storage - stable across UID changes
   */
  private async saveDeviceData(deviceFingerprintStr: string, data: any): Promise<void> {
    try {
      const db = getFirestoreInstance();
      const deviceDataRef = doc(db, 'device_data', deviceFingerprintStr);
      
      await setDoc(deviceDataRef, {
        ...data,
        deviceFingerprint: deviceFingerprintStr,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      console.log('[AuthService] Device data saved for fingerprint:', deviceFingerprintStr);
    } catch (error) {
      console.error('[AuthService] Failed to save device data:', error);
    }
  }

  /**
   * Get or create canonical UID for this device
   * Stored in localStorage to maintain stable UID across reloads
   */
  private getCanonicalUid(): string | null {
    if (typeof window === 'undefined') return null;
    return getStorageItem('lavadoras_canonical_uid');
  }

  private setCanonicalUid(uid: string): void {
    if (typeof window === 'undefined') return;
    setStorageItem('lavadoras_canonical_uid', uid);
  }

  /**
   * Create new session for first-time user on this device
   */
  private async createNewSession(deviceFingerprintStr: string): Promise<void> {
    console.log('[AuthService] Creating new session for device:', deviceFingerprintStr);
    
    // Create new anonymous user
    const result = await signInAnonymously(this.auth);
    const newUid = result.user.uid;
    
    // Set as canonical UID for this device
    this.setCanonicalUid(newUid);
    
    // Initialize local data.
    // CRITICAL: if this device already has local data (profile, history,
    // favorites...), KEEP IT — never overwrite it with empty data.
    const existingLocal = this.getLocalData();
    const recoveryCode = await this.getOrCreatePermanentRecoveryCode(newUid);
    const localData: LocalUserData = {
      uid: newUid,
      recoveryCode: recoveryCode || existingLocal?.recoveryCode || '',
      profile: existingLocal?.profile || {},
      rentalHistory: existingLocal?.rentalHistory || [],
      favorites: existingLocal?.favorites || [],
      cart: existingLocal?.cart || [],
      notifications: existingLocal?.notifications || [],
      createdAt: existingLocal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    setStorageItem(STORAGE_KEYS.RECOVERY_CODE, localData.recoveryCode);
    setStorageItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(localData));
    setStorageItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(localData.profile));
    
    // Save to device-based storage (NEW) — always with the preserved data
    await this.saveDeviceData(deviceFingerprintStr, {
      ...localData,
      updatedAt: new Date().toISOString(),
    });

    // Link device fingerprint to this UID (legacy mapping)
    await this.linkDeviceFingerprintToUid(newUid);

    this.currentUser = this.mapFirebaseUser(result.user);
    this.currentUser.localData = localData;
    this.currentState = 'anonymous';
    this.callbacks?.onStateChange(this.currentState, this.currentUser);

    this.callbacks?.onRecoveryCodeGenerated?.(localData.recoveryCode);
    console.log('[AuthService] New session created with UID:', newUid);
  }

  /**
   * Merge remote (cloud/device) data with existing local data.
   * RULE: NEVER ERASE. Local values survive whenever remote data is empty
   * or missing; arrays keep the longer version (favorites are unioned).
   * This prevents refreshes (F5) and restores from wiping user data.
   */
  private mergeUserData(remote: any, local: LocalUserData | null, code: string): LocalUserData {
    const remoteProfile: Record<string, any> = (remote && typeof remote.profile === 'object' && remote.profile) || {};
    const localProfile: Record<string, any> = local?.profile || {};

    // Field-by-field: remote provides the base (fills gaps on a new device),
    // but existing LOCAL values always win — they are what the user sees
    // and edited most recently on this device.
    const profile: Record<string, any> = { ...remoteProfile };
    for (const key of Object.keys(localProfile)) {
      const value = localProfile[key];
      if (value !== undefined && value !== null && value !== '') {
        profile[key] = value;
      }
    }

    const pickLongest = (remoteArr: any, localArr: any): any[] => {
      const a = Array.isArray(remoteArr) ? remoteArr : [];
      const b = Array.isArray(localArr) ? localArr : [];
      return a.length >= b.length ? a : b;
    };

    const unionStrings = (remoteArr: any, localArr: any): string[] => {
      const combined = [
        ...(Array.isArray(remoteArr) ? remoteArr : []),
        ...(Array.isArray(localArr) ? localArr : []),
      ];
      return Array.from(new Set(combined));
    };

    return {
      uid: local?.uid || '',
      recoveryCode: remote?.recoveryCode || code || local?.recoveryCode || '',
      profile: profile as LocalUserData['profile'],
      rentalHistory: pickLongest(remote?.rentalHistory, local?.rentalHistory),
      favorites: unionStrings(remote?.favorites, local?.favorites),
      cart: pickLongest(remote?.cart, local?.cart),
      notifications: pickLongest(remote?.notifications, local?.notifications),
      createdAt: remote?.createdAt || local?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: true,
    };
  }

  /**
   * Restore session from device data (existing user on this device)
   */
  private async restoreFromDeviceData(deviceFingerprintStr: string, deviceData: any): Promise<void> {
    console.log('[AuthService] Restoring session from device data for:', deviceFingerprintStr);
    
    // Get or create canonical UID
    let canonicalUid = this.getCanonicalUid() ?? '';
    
    // If device data has a different UID, use that as canonical
    if (deviceData.uid && deviceData.uid !== canonicalUid) {
      console.log('[AuthService] Updating canonical UID from device data:', deviceData.uid);
      canonicalUid = deviceData.uid;
      this.setCanonicalUid(canonicalUid);
    }
    
    // If no canonical UID, generate one and migrate
    if (!canonicalUid) {
      const result = await signInAnonymously(this.auth);
      canonicalUid = result.user.uid;
      this.setCanonicalUid(canonicalUid);
      await this.migrateDeviceDataToUid(deviceFingerprintStr, canonicalUid);
    }
    
    // Sign in anonymously to get valid auth session
    await this.ensureAuthenticated();
    
    // Prepare local data from device data.
    // CRITICAL: merge with existing local data — NEVER erase local data
    // with empty/stale remote fields (this was wiping data on refresh).
    const localData: LocalUserData = this.mergeUserData(
      deviceData,
      this.getLocalData(),
      deviceData.recoveryCode || ''
    );
    localData.uid = canonicalUid;
    localData.synced = true;

    // Save to localStorage
    setStorageItem(STORAGE_KEYS.RECOVERY_CODE, localData.recoveryCode || '');
    setStorageItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(localData));
    setStorageItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(localData.profile || {}));
    
    // Update current user
    const currentAuthUser = this.auth.currentUser;
    if (currentAuthUser) {
      this.currentUser = this.mapFirebaseUser(currentAuthUser);
      this.currentUser.localData = localData;
      this.currentState = 'authenticated';
      this.callbacks?.onStateChange(this.currentState, this.currentUser);
    }
    
    // Update device data with current canonical UID (in case it changed)
    await this.saveDeviceData(deviceFingerprintStr, {
      ...deviceData,
      uid: canonicalUid,
      updatedAt: serverTimestamp(),
    });
    
    // Update legacy mapping
    await this.linkDeviceFingerprintToUid(canonicalUid);
    
    console.log('[AuthService] Session restored from device data, UID:', canonicalUid);
  }

  /**
   * Migrate device data to new canonical UID
   */
  private async migrateDeviceDataToUid(deviceFingerprintStr: string, newUid: string): Promise<void> {
    try {
      const db = getFirestoreInstance();
      const deviceDataRef = doc(db, 'device_data', deviceFingerprintStr);
      await updateDoc(deviceDataRef, {
        uid: newUid,
        updatedAt: serverTimestamp(),
      });
      console.log('[AuthService] Device data migrated to new UID:', newUid);
    } catch (error) {
      console.warn('[AuthService] Failed to migrate device data:', error);
    }
  }

  private async initializeLocalData(uid: string): Promise<void> {
    // Get or create permanent recovery code from Firestore
    const recoveryCode = await this.getOrCreatePermanentRecoveryCode(uid);

    // CRITICAL: preserve any existing local data — never erase it with
    // empty defaults. This function may run after an unexpected new
    // anonymous session and MUST NOT wipe the user's information.
    const existingLocal = this.getLocalData();

    const localData: LocalUserData = {
      uid,
      recoveryCode: recoveryCode || existingLocal?.recoveryCode || '',
      profile: existingLocal?.profile || {},
      rentalHistory: existingLocal?.rentalHistory || [],
      favorites: existingLocal?.favorites || [],
      cart: existingLocal?.cart || [],
      notifications: existingLocal?.notifications || [],
      createdAt: existingLocal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    setStorageItem(STORAGE_KEYS.RECOVERY_CODE, localData.recoveryCode);
    setStorageItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(localData));
    setStorageItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(localData.profile));

    this.callbacks?.onRecoveryCodeGenerated?.(localData.recoveryCode);
  }

  // ==========================================
  // RECOVERY CODE - PERMANENT IN FIRESTORE
  // ==========================================

  private async getOrCreatePermanentRecoveryCode(uid: string): Promise<string> {
    let docExists = false;
    try {
      const db = getFirestoreInstance();
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        docExists = true;
        if (userDoc.data().recoveryCode) {
          const existingCode = userDoc.data().recoveryCode;
          console.log('[AuthService] Using existing permanent recovery code from Firestore');
          return existingCode;
        }
      }
    } catch (error) {
      console.warn('[AuthService] Could not read recovery code from Firestore:', error);
    }

    // Generate new permanent recovery code
    const newCode = this.generateRecoveryCode();

    // Save to Firestore permanently.
    // NOTE: Firestore rules require 'email' and 'role' keys when CREATING
    // the document — include them only in that case so the write isn't
    // silently denied (which is why codes sometimes never reached the cloud).
    try {
      const db = getFirestoreInstance();
      const userRef = doc(db, 'users', uid);
      const data: Record<string, any> = {
        recoveryCode: newCode,
        recoveryCodeCreatedAt: serverTimestamp(),
      };
      if (!docExists) {
        data.email = this.auth.currentUser?.email || '';
        data.role = 'cliente';
      }
      await setDoc(userRef, data, { merge: true });
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
      // Preserve all existing fields, only update provided ones
      const baseData = existing || {
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
      };
      
      const updated: LocalUserData = {
        ...baseData,
        ...data,
        // Ensure nested objects are merged, not replaced
        profile: { ...baseData.profile, ...(data.profile || {}) },
        updatedAt: new Date().toISOString(),
        synced: false,
      };

      setStorageItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(updated));
      console.log('[AuthService] saveLocalData:', Object.keys(data).join(', '));
      
      if (this.currentUser) {
        this.currentUser.localData = updated;
      }
      
      // Auto-sync to cloud after local save (debounced)
      this.scheduleSyncToCloud();
    } catch (error) {
      console.error('[AuthService] Error saving local data:', error);
    }
  }

  // Debounced sync to avoid too many Firestore writes
  private syncTimeout: NodeJS.Timeout | null = null;
  
  private scheduleSyncToCloud(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    this.syncTimeout = setTimeout(() => {
      this.syncToCloud().catch(console.error);
    }, 1000); // 1 second debounce
  }

  async updateProfile(profile: Partial<LocalUserData['profile']>): Promise<void> {
    const current = await this.loadLocalData();
    await this.saveLocalData({
      profile: { ...(current?.profile || {}), ...profile },
    });
    await this.syncToCloud(); // Immediate sync for profile changes
  }

  async addRentalHistory(rental: LocalUserData['rentalHistory'][0]): Promise<void> {
    const current = await this.loadLocalData();
    const history = current?.rentalHistory || [];
    history.unshift(rental);
    await this.saveLocalData({ rentalHistory: history });
    await this.syncToCloud(); // Immediate sync - critical for history persistence
  }

  async addFavorite(washerId: string): Promise<void> {
    const current = await this.loadLocalData();
    const favorites = current?.favorites || [];
    if (!favorites.includes(washerId)) {
      await this.saveLocalData({ favorites: [...favorites, washerId] });
      await this.syncToCloud();
    }
  }

  async removeFavorite(washerId: string): Promise<void> {
    const current = await this.loadLocalData();
    const favorites = (current?.favorites || []).filter(id => id !== washerId);
    await this.saveLocalData({ favorites });
    await this.syncToCloud();
  }

  async updateCart(cart: LocalUserData['cart']): Promise<void> {
    await this.saveLocalData({ cart });
    await this.syncToCloud();
  }

  async addNotification(notification: LocalUserData['notifications'][0]): Promise<void> {
    const current = await this.loadLocalData();
    const notifications = current?.notifications || [];
    notifications.unshift(notification);
    await this.saveLocalData({ notifications });
    await this.syncToCloud();
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
      console.warn('[AuthService] syncToCloud skipped: no currentUser');
      return false;
    }

    try {
      const localData = this.getLocalData();
      if (!localData) {
        console.warn('[AuthService] syncToCloud skipped: no localData');
        return false;
      }

      // CRITICAL: Don't sync empty/default data - protect against data loss
      const hasMeaningfulData = localData.rentalHistory?.length > 0 || 
                                localData.favorites?.length > 0 || 
                                localData.cart?.length > 0 || 
                                localData.notifications?.length > 0 || 
                                localData.profile?.name || 
                                localData.profile?.phone || 
                                localData.profile?.address;
      
      if (!hasMeaningfulData && !localData.synced) {
        console.warn('[AuthService] syncToCloud skipped: no meaningful data to sync');
        return false;
      }

      const db = getFirestoreInstance();
      const userRef = doc(db, 'users', this.currentUser.uid);

      // Firestore rules require the keys 'email' and 'role' when CREATING
      // a user document. Check if the doc exists first and include those
      // keys ONLY on creation — never overwrite an existing role (e.g. admin).
      let docExists = true;
      try {
        docExists = (await getDoc(userRef)).exists();
      } catch {
        docExists = true; // If the read fails, assume it exists (update path)
      }

      // Prepare data to sync
      const syncData: Record<string, any> = {
        ...localData,
        uid: this.currentUser.uid,
        isAnonymous: this.currentUser.isAnonymous,
        deviceFingerprint: await deviceFingerprint.getFingerprintString(),
        lastSync: serverTimestamp(),
        updatedAt: new Date().toISOString(),
      };
      if (!docExists) {
        syncData.email = this.currentUser.email || localData.profile?.email || '';
        syncData.role = 'cliente';
      }

      // Sync to users collection
      await setDoc(userRef, syncData, { merge: true });
      console.log('[AuthService] syncToCloud successful for UID:', this.currentUser.uid);
      
      // ALSO sync to device_data (NEW architecture - primary storage)
      try {
        const deviceFp = await deviceFingerprint.getFingerprint();
        const deviceFingerprintStr = deviceFp.fingerprint;
        await this.saveDeviceData(deviceFingerprintStr, {
          uid: this.currentUser.uid,
          recoveryCode: localData.recoveryCode,
          profile: localData.profile,
          rentalHistory: localData.rentalHistory,
          favorites: localData.favorites,
          cart: localData.cart,
          notifications: localData.notifications,
          createdAt: localData.createdAt,
          updatedAt: new Date().toISOString(),
          synced: true,
        });
        console.log('[AuthService] syncToCloud: device_data updated');
      } catch (deviceError) {
        console.warn('[AuthService] Failed to sync to device_data:', deviceError);
      }
      
      // Mark as synced locally - USE DIRECT STORAGE to avoid infinite loop
      const currentLocal = this.getLocalData();
      if (currentLocal) {
        const syncedLocal = { ...currentLocal, synced: true, updatedAt: new Date().toISOString() };
        setStorageItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(syncedLocal));
        if (this.currentUser) {
          this.currentUser.localData = syncedLocal;
        }
      }
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
  // GOOGLE AUTH
  // ==========================================

  async signInWithGoogle(): Promise<AuthUser> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(this.auth, provider);
      
      // Sync to cloud to save/update user profile
      await this.syncToCloud();
      
      this.currentUser = this.mapFirebaseUser(result.user);
      this.currentState = 'authenticated';
      this.callbacks?.onStateChange(this.currentState, this.currentUser);
      
      // Link device fingerprint for auto-restore
      const deviceFingerprintStr = await deviceFingerprint.getFingerprintString();
      await this.linkDeviceFingerprintToUid(result.user.uid);
      
      return this.currentUser;
    } catch (error) {
      const msg = this.getErrorMessage(error);
      this.callbacks?.onError(msg, 'google');
      throw new Error(msg);
    }
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
   * Método unificado: Iniciar sesión / Recuperar cuenta con código de 6 dígitos.
   *
   * Método simple, el MISMO mecanismo que hace que un F5 funcione:
   *   1. Garantiza una sesión anónima válida (como la que persiste al refrescar).
   *   2. Lee la colección `users` buscando el código (lectura permitida por las
   *      reglas de Firestore para cualquier sesión iniciada, incluso anónima).
   *   3. Restaura los datos encontrados haciendo MERGE con los datos locales
   *      (NUNCA borra información existente).
   *
   * NO usa API routes, NO usa Admin SDK, NO requiere claves ni configuración
   * extra, y NO escribe a colecciones restringidas — por eso el error
   * "Missing or insufficient permissions" no puede ocurrir.
   */
  async signInWithRecoveryCode(code: string): Promise<AuthUser> {
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      throw new Error('Código debe tener 6 dígitos numéricos');
    }

    // Rate limiting check (local)
    if (this.currentUser?.uid) {
      const rateLimit = await this.checkRateLimit(this.currentUser.uid);
      if (!rateLimit.allowed) {
        throw new Error(`Demasiados intentos. Intenta de nuevo en 1 hora.`);
      }
    }

    try {
      // Paso 1: sesión válida — el mismo mecanismo que funciona al dar F5
      await this.ensureAuthenticated();
      const currentAuthUser = this.auth.currentUser;
      if (!currentAuthUser) {
        throw new Error('No se pudo iniciar sesión. Intenta de nuevo.');
      }

      // Paso 2: buscar la cuenta por su código (operación de SOLO LECTURA,
      // permitida por las reglas de Firestore para sesiones autenticadas).
      // Puede haber más de un documento con el mismo código (cada sesión
      // anónima nueva crea uno): nos quedamos con el MÁS RECIENTE, que es
      // el que tiene la información actualizada de la cuenta.
      let snapshot;
      try {
        const db = getFirestoreInstance();
        const usersQuery = query(
          collection(db, 'users'),
          where('recoveryCode', '==', code),
          limit(5)
        );
        snapshot = await getDocs(usersQuery);
      } catch (lookupError) {
        console.error('[AuthService] Recovery code lookup failed:', lookupError);
        throw new Error('No se pudo verificar el código. Revisa tu conexión e intenta de nuevo.');
      }

      if (snapshot.empty) {
        throw new Error('Código de recuperación inválido. Verifica tu código de 6 dígitos.');
      }

      const toMillis = (v: any): number => {
        if (!v) return 0;
        if (typeof v === 'string') { const t = Date.parse(v); return isNaN(t) ? 0 : t; }
        if (typeof v?.toMillis === 'function') return v.toMillis();
        if (typeof v?.seconds === 'number') return v.seconds * 1000;
        return 0;
      };
      const matches = snapshot.docs.map((d) => d.data());
      matches.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
      const accountData = matches[0];
      console.log('[AuthService] Account found for recovery code, restoring data...');

      // Record attempt for rate limiting
      if (this.currentUser?.uid) {
        await this.recordRecoveryAttempt(this.currentUser.uid);
      }

      // Paso 3: restaurar datos con MERGE — NUNCA borrar datos locales
      const localData: LocalUserData = this.mergeUserData(accountData, this.getLocalData(), code);
      localData.uid = currentAuthUser.uid;
      localData.recoveryCode = code;
      localData.synced = false;
      localData.updatedAt = new Date().toISOString();

      setStorageItem(STORAGE_KEYS.RECOVERY_CODE, code);
      setStorageItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(localData));
      setStorageItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(localData.profile || {}));

      this.setCanonicalUid(currentAuthUser.uid);
      this.currentUser = this.mapFirebaseUser(currentAuthUser);
      this.currentUser.localData = localData;
      this.currentUser.recoveryCode = code;
      this.currentState = 'authenticated';
      this.callbacks?.onStateChange(this.currentState, this.currentUser);

      // Paso 4: respaldo a la nube best-effort. Completamente envuelto:
      // un fallo de sincronización JAMÁS debe mostrar error al usuario.
      try {
        await this.syncToCloud();
      } catch (e) {
        console.warn('[AuthService] Post-recovery sync failed (non-fatal):', e);
      }

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
    // CRITICAL: Save current data to device_data BEFORE signing out
    // This enables auto-restore on next visit to this device
    if (this.currentUser) {
      try {
        // Save current state to device_data
        await this.syncToCloud();
        console.log('[AuthService] Data synced to device_data on signOut');
      } catch (e) {
        console.warn('[AuthService] Failed to sync on signOut:', e);
      }
    }
    
    // CRITICAL: Link device fingerprint to current UID BEFORE signing out
    // This enables auto-restore on next visit to this device
    let uidToLink: string | null = null;
    if (this.currentUser) {
      uidToLink = this.currentUser.uid;
    } else if (this.auth.currentUser) {
      uidToLink = this.auth.currentUser.uid;
    }
    
    if (uidToLink) {
      try {
        // Force generate/get device fingerprint first
        const deviceFp = await deviceFingerprint.getFingerprint();
        const deviceFingerprintStr = deviceFp.fingerprint;
        console.log('[AuthService] Device fingerprint for signOut:', deviceFingerprintStr);
        
        // CRITICAL: Save current user data to device_data for auto-restore
        const localData = this.getLocalData();
        if (localData) {
          const recoveryCode = getStorageItem(STORAGE_KEYS.RECOVERY_CODE) || localData.recoveryCode;
          await this.saveDeviceData(deviceFingerprintStr, {
            uid: uidToLink,
            recoveryCode: recoveryCode || '',
            profile: localData.profile || {},
            rentalHistory: localData.rentalHistory || [],
            favorites: localData.favorites || [],
            cart: localData.cart || [],
            notifications: localData.notifications || [],
            createdAt: localData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            synced: true,
          });
          console.log('[AuthService] Data saved to device_data on signOut for auto-restore');
        }
        
        // Also link device fingerprint for legacy support
        await this.linkDeviceFingerprintToUid(uidToLink);
        console.log('[AuthService] Device fingerprint linked on signOut for auto-restore, UID:', uidToLink);
      } catch (e) {
        console.error('[AuthService] Failed to save device data on signOut:', e);
      }
    } else {
      console.warn('[AuthService] signOut called but no UID available to link device fingerprint');
    }
    
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

  // ==========================================
  // AUTO-RESTORE HELPER METHODS
  // ==========================================

  /**
   * Get user data from cloud (users collection) - SOURCE OF TRUTH
   */
  private async getUserDataFromCloud(uid: string): Promise<any | null> {
    try {
      const db = getFirestoreInstance();
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        console.log('[AuthService] User data found in cloud:', uid);
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.warn('[AuthService] Failed to get user data from cloud:', error);
      return null;
    }
  }

  /**
   * Restore session from cloud data (users collection)
   */
  private async restoreFromCloudData(userData: any): Promise<void> {
    const currentAuthUser = this.auth.currentUser;
    if (!currentAuthUser) throw new Error('No auth user');

    // CRITICAL: merge with existing local data — NEVER erase local data
    // with empty cloud fields (this was wiping the profile/history on F5).
    const localData: LocalUserData = this.mergeUserData(
      userData,
      this.getLocalData(),
      userData.recoveryCode || ''
    );
    localData.uid = currentAuthUser.uid;
    localData.synced = true;

    setStorageItem(STORAGE_KEYS.RECOVERY_CODE, localData.recoveryCode || '');
    setStorageItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(localData));
    setStorageItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(localData.profile || {}));

    this.currentUser = this.mapFirebaseUser(currentAuthUser);
    this.currentUser.localData = localData;
    this.currentState = 'authenticated';
    this.callbacks?.onStateChange(this.currentState, this.currentUser);

    // Save to device_data for future fast local restores
    const deviceFp = await deviceFingerprint.getFingerprint();
    await this.addAccountToDeviceData(deviceFp.fingerprint, currentAuthUser.uid, {
      ...localData,
      synced: true,
    });
    await this.setCurrentAccount(deviceFp.fingerprint, currentAuthUser.uid);
    await this.linkDeviceFingerprintToUid(currentAuthUser.uid);

    console.log('[AuthService] Session restored from cloud');
  }

  /**
   * Add a new account to device_data.accounts without overwriting existing
   */
  private async addAccountToDeviceData(deviceFingerprintStr: string, uid: string, accountData: any): Promise<void> {
    try {
      const db = getFirestoreInstance();
      const deviceDataRef = doc(db, 'device_data', deviceFingerprintStr);
      const deviceDoc = await getDoc(deviceDataRef);
      const accountKey = `accounts.${uid}`;
      
      if (deviceDoc.exists()) {
        await setDoc(deviceDataRef, {
          [accountKey]: {
            ...accountData,
            synced: true,
          },
          currentUid: uid,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        await setDoc(deviceDataRef, {
          currentUid: uid,
          accounts: {
            [uid]: {
              ...accountData,
              synced: true,
            },
          },
          updatedAt: serverTimestamp(),
        });
      }
      
      console.log('[AuthService] Account added to device_data:', uid);
    } catch (error) {
      console.error('[AuthService] Failed to add account to device_data:', error);
    }
  }

  /**
   * Set the current active account on this device
   */
  private async setCurrentAccount(deviceFingerprintStr: string, uid: string): Promise<void> {
    try {
      const db = getFirestoreInstance();
      const deviceDataRef = doc(db, 'device_data', deviceFingerprintStr);
      await setDoc(deviceDataRef, {
        currentUid: uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      console.log('[AuthService] Current account set to:', uid);
    } catch (error) {
      console.error('[AuthService] Failed to set current account:', error);
    }
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

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    return authService.signInWithGoogle();
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

  const initializeAuthListener = useCallback(() => {
    return authService.initializeAuthListener();
  }, []);

  const performAutoRestore = useCallback(async () => {
    return authService.performAutoRestore();
  }, []);

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
    signInWithGoogle,
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
    initializeAuthListener,
    performAutoRestore,
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