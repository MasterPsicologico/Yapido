/**
 * Splash screen controller. Solo funciona en APK; en web es un no-op.
 * Usar después del primer render (en layout effect) para desaparecer.
 */
import { getBridge, isNativePlatform } from './platform';

export async function hideSplash(): Promise<void> {
  if (!isNativePlatform()) return;
  const bridge = await getBridge();
  if (!bridge) return;
  try {
    await bridge.splash.hide();
  } catch (e) {
    console.warn('[splash] hide failed:', e);
  }
}

export async function showSplash(): Promise<void> {
  if (!isNativePlatform()) return;
  const bridge = await getBridge();
  if (!bridge) return;
  try {
    await bridge.splash.show({ autoHide: true });
  } catch (e) {
    console.warn('[splash] show failed:', e);
  }
}
