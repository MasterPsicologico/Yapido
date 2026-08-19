'use client';

import { 
  PhoneAuthProvider, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signInWithCredential,
  linkWithCredential,
  PhoneAuthCredential,
  User
} from 'firebase/auth';
import { getAuthInstance } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase';
import { deviceFingerprint } from '@/lib/device/DeviceFingerprint';
import { Capacitor } from '@capacitor/core';

export interface PhoneAuthResult {
  success: boolean;
  user?: User;
  error?: string;
  verificationId?: string;
}

export interface DevicePhoneLink {
  deviceFingerprint: string;
  phoneNumber: string;
  linkedAt: Date;
  lastUsed: Date;
  verified: boolean;
}

export interface PhoneAuthCallbacks {
  onCodeSent?: (verificationId: string) => void;
  onError?: (error: string) => void;
  onSuccess?: (user: User) => void;
}

class PhoneAuthService {
  private static instance: PhoneAuthService;
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: any = null;

  static getInstance(): PhoneAuthService {
    if (!PhoneAuthService.instance) {
      PhoneAuthService.instance = new PhoneAuthService();
    }
    return PhoneAuthService.instance;
  }

  private getAuth() {
    return getAuthInstance();
  }

  private getDb() {
    return getFirestoreInstance();
  }

  /**
   * Inicializa RecaptchaVerifier para Phone Auth
   */
  private async ensureRecaptchaVerifier(): Promise<RecaptchaVerifier> {
    if (this.recaptchaVerifier) return this.recaptchaVerifier;

    this.recaptchaVerifier = new RecaptchaVerifier(this.getAuth(), 'recaptcha-container', {
      size: 'invisible',
    });

    return this.recaptchaVerifier;
  }

  /**
   * Formatea número de teléfono a formato E.164
   */
  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = '+57' + cleaned; // Colombia por defecto
      } else {
        cleaned = '+' + cleaned;
      }
    }
    return cleaned;
  }

  /**
   * Envía código SMS al número de teléfono
   */
  async sendCode(phoneNumber: string): Promise<PhoneAuthResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const recaptcha = await this.ensureRecaptchaVerifier();
      
      this.confirmationResult = await signInWithPhoneNumber(
        getAuthInstance(),
        this.formatPhoneNumber(phoneNumber),
        await this.ensureRecaptchaVerifier()
      );

      return { success: true, verificationId: this.confirmationResult.verificationId };
    } catch (error: any) {
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  /**
   * Verifica código SMS y autentica usuario
   */
  async verifyCode(code: string): Promise<PhoneAuthResult> {
    if (!this.confirmationResult) {
      return { success: false, error: 'No hay verificación pendiente. Solicita código nuevamente.' };
    }

    if (!code || code.length !== 6) {
      return { success: false, error: 'Código debe tener 6 dígitos' };
    }

    try {
      const credential = PhoneAuthProvider.credential(
        this.confirmationResult.verificationId,
        code
      );

      const result = await signInWithCredential(getAuthInstance(), credential);
      this.confirmationResult = null;

      return { success: true, user: result.user };
    } catch (error: any) {
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  /**
   * Vincula número de teléfono a usuario anónimo actual
   */
  async linkPhoneToAnonymous(phoneNumber: string, code: string): Promise<PhoneAuthResult> {
    const user = getAuthInstance().currentUser;
    if (!user || !user.isAnonymous) {
      return { success: false, error: 'No hay usuario anónimo para vincular' };
    }

    try {
      const credential = PhoneAuthProvider.credential(
        (await this.getConfirmationResult()).verificationId,
        code
      );

      const result = await linkWithCredential(getAuthInstance().currentUser!, 
        PhoneAuthProvider.credential(
          (await this.getConfirmationResult()).verificationId,
          code
        )
      );

      return { success: true, user: result.user };
    } catch (error: any) {
      return { 
        success: false, 
        error: this.getErrorMessage(error) 
      };
    }
  }

  private async getConfirmationResult() {
    if (!this.confirmationResult) {
      throw new Error('No hay verificación pendiente');
    }
    return this.confirmationResult;
  }

  /**
   * Vincula device fingerprint con número de teléfono en Firestore
   * Crea/actualiza documento en colección device_phone_links
   */
  async linkDeviceToPhone(deviceFingerprint: string, phoneNumber: string): Promise<void> {
    const db = this.getDb();
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    
    const linkRef = doc(this.getDb(), 'device_phone_links', deviceFingerprint);
    const existingDoc = await getDoc(linkRef);

    const linkData: DevicePhoneLink = {
      deviceFingerprint,
      phoneNumber: phoneNumber,
      linkedAt: existingDoc.exists() ? (existingDoc.data().linkedAt.toDate() || new Date()) : new Date(),
      lastUsed: new Date(),
      verified: true,
    };

    await setDoc(linkRef, {
      ...linkData,
      linkedAt: linkData.linkedAt,
      lastUsed: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  /**
   * Busca número de teléfono asociado a device fingerprint
   */
  async getPhoneByDeviceFingerprint(deviceFingerprint: string): Promise<string | null> {
    const db = this.getDb();
    const linkRef = doc(db, 'device_phone_links', deviceFingerprint);
    const docSnap = await getDoc(linkRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as DevicePhoneLink;
      // Actualizar lastUsed
      await updateDoc(doc(db, 'device_phone_links', deviceFingerprint), {
        lastUsed: serverTimestamp(),
      });
      return data.phoneNumber;
    }
    return null;
  }

  /**
   * Verifica si un device fingerprint ya está vinculado a un teléfono
   */
  async isDeviceLinked(deviceFingerprint: string): Promise<boolean> {
    const phone = await this.getPhoneByDeviceFingerprint(deviceFingerprint);
    return phone !== null;
  }

  /**
   * Obtiene información del enlace dispositivo-teléfono
   */
  async getDevicePhoneLink(deviceFingerprint: string): Promise<DevicePhoneLink | null> {
    const db = this.getDb();
    const docSnap = await getDoc(doc(db, 'device_phone_links', deviceFingerprint));
    if (docSnap.exists()) {
      return docSnap.data() as DevicePhoneLink;
    }
    return null;
  }

  /**
   * Desvincula dispositivo de teléfono (para logout completo)
   */
  async unlinkDevice(deviceFingerprint: string): Promise<void> {
    const db = this.getDb();
    await updateDoc(doc(db, 'device_phone_links', deviceFingerprint), {
      verified: false,
      unlinkedAt: serverTimestamp(),
    });
  }

  /**
   * Manejo de errores de Firebase Auth
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      const code = (error as any).code;
      switch (code) {
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
          return 'Este número ya está vinculado a otra cuenta';
        case 'auth/operation-not-allowed':
          return 'Autenticación por teléfono no habilitada en Firebase Console';
        case 'auth/network-request-failed':
          return 'Error de conexión. Verifica tu internet';
        default:
          return error.message || 'Error de autenticación';
      }
    }
    return 'Error desconocido';
  }
}

export const phoneAuth = PhoneAuthService.getInstance();