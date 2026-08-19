'use client';

/**
 * DeviceFingerprint Service
 * Genera una huella digital única del dispositivo que persiste tras desinstalar/reinstalar
 * Combina múltiples señales del dispositivo para crear un identificador único
 */

export interface DeviceFingerprint {
  fingerprint: string;
  components: {
    androidId?: string;
    installTime?: number;
    appVersion?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
    userAgent?: string;
    hardwareConcurrency?: number;
    deviceMemory?: number;
    colorDepth?: number;
    pixelRatio?: number;
    touchSupport?: boolean;
    maxTouchPoints?: number;
  };
  timestamp: number;
  version: string;
}

class DeviceFingerprintService {
  private static instance: DeviceFingerprintService;
  private fingerprint: DeviceFingerprint | null = null;
  private readonly STORAGE_KEY = 'lavadoras_device_fingerprint';
  private readonly VERSION = '2.0.0';

  static getInstance(): DeviceFingerprintService {
    if (!DeviceFingerprintService.instance) {
      DeviceFingerprintService.instance = new DeviceFingerprintService();
    }
    return DeviceFingerprintService.instance;
  }

  /**
   * Obtiene la huella digital del dispositivo (cacheada)
   */
  async getFingerprint(): Promise<DeviceFingerprint> {
    if (this.fingerprint) {
      return this.fingerprint;
    }

    // 1. Intentar cargar desde localStorage
    const stored = this.loadFromStorage();
    if (stored && this.isValidFingerprint(stored)) {
      this.fingerprint = stored;
      return stored;
    }

    // 2. Generar nueva huella
    this.fingerprint = await this.generateFingerprint();
    this.saveToStorage(this.fingerprint);
    return this.fingerprint;
  }

  /**
   * Fuerza regeneración de la huella
   */
  async regenerateFingerprint(): Promise<DeviceFingerprint> {
    this.fingerprint = await this.generateFingerprint();
    this.saveToStorage(this.fingerprint);
    return this.fingerprint;
  }

  /**
   * Genera huella digital combinando múltiples señales
   */
  private async generateFingerprint(): Promise<DeviceFingerprint> {
    const components: DeviceFingerprint['components'] = {};

    // 1. Android ID (persistente tras reinstalación en Android 8.0+)
    if (typeof window !== 'undefined' && 'Android' in window) {
      try {
        // En Capacitor/Android, podemos acceder al Android ID
        components.androidId = await this.getAndroidId();
      } catch {
        // Ignore
      }
    }

    // 2. Timestamp de instalación (persistente en localStorage)
    let installTime = localStorage.getItem('lavadoras_install_time');
    if (!installTime) {
      installTime = Date.now().toString();
      localStorage.setItem('lavadoras_install_time', installTime);
    }
    components.installTime = parseInt(installTime);

    // 3. App version
    components.appVersion = this.getAppVersion();

    // 4. Screen resolution
    if (typeof screen !== 'undefined') {
      components.screenResolution = `${screen.width}x${screen.height}`;
    }

    // 5. Timezone
    components.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 6. Language
    components.language = navigator.language || 'unknown';

    // 7. Platform
    components.platform = navigator.platform || 'unknown';

    // 7. User Agent
    components.userAgent = navigator.userAgent || 'unknown';

    // 8. Hardware concurrency
    components.hardwareConcurrency = navigator.hardwareConcurrency || 0;

    // 9. Device memory
    components.deviceMemory = (navigator as any).deviceMemory || 0;

    // 10. Color depth
    components.colorDepth = screen.colorDepth || 0;

    // 11. Pixel ratio
    components.pixelRatio = window.devicePixelRatio || 1;

    // 12. Touch support
    components.touchSupport = 'ontouchstart' in window;
    components.maxTouchPoints = navigator.maxTouchPoints || 0;

    // Crear fingerprint hash
    const fingerprintString = this.componentsToString(components);
    const fingerprint = await this.hashString(fingerprintString);

    return {
      fingerprint,
      components,
      timestamp: Date.now(),
      version: this.VERSION,
    };
  }

  /**
   * Obtiene Android ID (requiere Capacitor en Android)
   */
  private async getAndroidId(): Promise<string | undefined> {
    if (typeof window === 'undefined') return undefined;
    
    try {
      // En Capacitor, podemos usar el plugin Device
      // @ts-ignore - dynamic import with fallback
      const capacitorDevice = await import('@capacitor/device');
      const { Device } = capacitorDevice;
      if (!Device) return undefined;
      const info = await Device.getInfo();
      return info.uuid; // UUID único del dispositivo en Android 8.0+
    } catch {
      // Fallback: usar un identificador basado en características del navegador
      return undefined;
    }
  }

  /**
   * Obtiene versión de la app
   */
  private getAppVersion(): string {
    if (typeof window !== 'undefined') {
      // En Next.js, podemos leer de package.json o usar una variable de entorno
      return process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
    }
    return '1.0.0';
  }

  /**
   * Convierte componentes a string para hashear
   */
  private componentsToString(components: DeviceFingerprint['components']): string {
    return Object.entries(components)
      .filter(([, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  }

  /**
   * Hash simple pero efectivo (SHA-256 via Web Crypto API)
   */
  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Guarda fingerprint en localStorage
   */
  private saveToStorage(fingerprint: DeviceFingerprint): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(fingerprint));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Carga fingerprint desde localStorage
   */
  private loadFromStorage(): DeviceFingerprint | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return this.isValidFingerprint(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Valida que el fingerprint tenga la estructura correcta
   */
  private isValidFingerprint(obj: any): obj is DeviceFingerprint {
    return (
      obj &&
      typeof obj.fingerprint === 'string' &&
      obj.fingerprint.length === 64 && // SHA-256 hex
      obj.components &&
      typeof obj.timestamp === 'number' &&
      typeof obj.version === 'string'
    );
  }

  /**
   * Verifica si dos fingerprints son del mismo dispositivo
   */
  async isSameDevice(otherFingerprint: string): Promise<boolean> {
    const current = await this.getFingerprint();
    return current.fingerprint === otherFingerprint;
  }

  /**
   * Obtiene el fingerprint actual como string simple
   */
  async getFingerprintString(): Promise<string> {
    const fp = await this.getFingerprint();
    return fp.fingerprint;
  }
}

export const deviceFingerprint = DeviceFingerprintService.getInstance();