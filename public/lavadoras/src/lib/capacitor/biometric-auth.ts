/**
 * Biometric gate — exige huella/faceID después del primer login guardado.
 * En web es no-op (devuelve `available: false`).
 */
import { getBridge, isNativePlatform } from './platform';

export type BiometryType = 'face' | 'fingerprint' | 'touch' | 'iris' | 'none';

export interface BiometricAvailability {
  available: boolean;
  biometryType?: BiometryType;
}

export async function checkBiometric(): Promise<BiometricAvailability> {
  if (!isNativePlatform()) return { available: false };
  const bridge = await getBridge();
  if (!bridge) return { available: false };
  try {
    const r = await bridge.biometric.isAvailable();
    const type = (r.biometryType as string | undefined)?.toLowerCase();
    const normalized: BiometryType =
      type === 'face' || type === 'fingerprint' || type === 'touch' || type === 'iris' ? (type as BiometryType) : 'none';
    return { available: Boolean(r.isAvailable), biometryType: normalized };
  } catch {
    return { available: false };
  }
}

export async function authenticateWithBiometric(opts: {
  reason?: string;
  title?: string;
  subtitle?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isNativePlatform()) return { success: false, error: 'not-native' };
  const bridge = await getBridge();
  if (!bridge) return { success: false, error: 'bridge-missing' };
  try {
    return await bridge.biometric.authenticate(opts);
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'unknown-error' };
  }
}
