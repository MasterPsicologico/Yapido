/**
 * Detección de plataforma nativa (APK Capacitor).
 * Wrap seguro que SIEMPRE existe (cliente+server, plataforma detectable).
 * La lógica real de cada plugin vive en archivos hermanos (`splash-controller.ts`, etc.).
 */
import type { Plugin } from '@capacitor/core';

interface NativeBridge {
  splash: {
    show: (options?: { autoHide?: boolean }) => Promise<void>;
    hide: () => Promise<void>;
  };
  biometric: {
    isAvailable: () => Promise<{ isAvailable: boolean; biometryType?: string }>;
    authenticate: (options: { reason?: string; title?: string; subtitle?: string }) => Promise<{ success: boolean; error?: string }>;
  };
  app: {
    addListener: (event: 'appUrlOpen', handler: (payload: { url: string }) => void) => Promise<{ remove: () => Promise<void> }>;
    getInitialUrl: () => Promise<{ url?: string }>;
  };
  haptics: {
    impact: (style?: 'light' | 'medium' | 'heavy') => Promise<void>;
    notification: (type?: 'success' | 'warning' | 'error') => Promise<void>;
  };
}

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
      Plugins: Record<string, Plugin>;
    };
  }
}

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Capacitor?.isNativePlatform());
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const p = window.Capacitor?.getPlatform();
  if (p === 'ios' || p === 'android') return p;
  return 'web';
}

export async function getBridge(): Promise<NativeBridge | null> {
  if (!isNativePlatform() || typeof window === 'undefined') return null;
  const cap = window.Capacitor;
  if (!cap) return null;

  try {
    // Carga de modulos Capacitor: @aparajita/capacitor-biometric-auth puede
    // no estar instalado en algunos entornos de build. Lo cargamos via
    // eval para evitar errores de TypeScript si falta el modulo. Solo se
    // invoca en plataforma Capacitor real (no en TWA, no en web).
    const safeImport = (mod: string): Promise<any> => {
      // eslint-disable-next-line no-eval
      return new Function('m', 'return import(m)')(mod) as Promise<any>;
    };

    const biometricMod = await safeImport('@aparajita/capacitor-biometric-auth');
    const app = await safeImport('@capacitor/app');
    const splash = await safeImport('@capacitor/splash-screen');
    const haptics = await safeImport('@capacitor/haptics');

    type HapticsMod = {
      Haptics: {
        impact: (opts: { style: string }) => Promise<void>;
        notification: (opts: { type: string }) => Promise<void>;
      };
      ImpactStyle: { Light: string; Medium: string; Heavy: string };
      NotificationType: { Success: string; Warning: string; Error: string };
    };
    const hapticsMod = haptics as unknown as HapticsMod;

    const biometricAny = biometricMod as unknown as {
      BiometricAuth: {
        isAvailable(): Promise<{ isAvailable: boolean; biometryType?: string }>;
        authenticate(opts: { reason?: string; title?: string; subtitle?: string }): Promise<{ success: boolean; error?: string }>;
      };
    };

    return {
      splash: {
        show: (options) => splash.SplashScreen.show(options as never) as Promise<void>,
        hide: () => splash.SplashScreen.hide() as Promise<void>,
      },
      biometric: {
        isAvailable: () => biometricAny.BiometricAuth.isAvailable(),
        authenticate: (options) => biometricAny.BiometricAuth.authenticate(options),
      },
      app: {
        addListener: async (event, handler) =>
          (await app.App.addListener(event, handler as never)) as unknown as { remove: () => Promise<void> },
        getInitialUrl: () => app.App.getLaunchUrl() as Promise<{ url?: string }>,
      },
      haptics: {
        impact: (style) => {
          const map = { light: hapticsMod.ImpactStyle.Light, medium: hapticsMod.ImpactStyle.Medium, heavy: hapticsMod.ImpactStyle.Heavy } as const;
          hapticsMod.Haptics.impact({ style: map[style ?? 'medium'] });
          return Promise.resolve();
        },
        notification: (type) => {
          const map = { success: hapticsMod.NotificationType.Success, warning: hapticsMod.NotificationType.Warning, error: hapticsMod.NotificationType.Error } as const;
          hapticsMod.Haptics.notification({ type: map[type ?? 'success'] });
          return Promise.resolve();
        },
      },
    };
  } catch (err) {
    console.warn('[capacitor] bridge no disponible:', err);
    return null;
  }
}
