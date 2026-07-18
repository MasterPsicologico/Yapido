/**
 * Haptics ligero. Solo funciona en APK nativa.
 */
import { getBridge, isNativePlatform } from './platform';

export async function impactLight(): Promise<void> {
  if (!isNativePlatform()) return;
  const b = await getBridge();
  if (!b) return;
  try {
    await b.haptics.impact('light');
  } catch {
    /* no-op */
  }
}

export async function impactMedium(): Promise<void> {
  if (!isNativePlatform()) return;
  const b = await getBridge();
  if (!b) return;
  try {
    await b.haptics.impact('medium');
  } catch {
    /* no-op */
  }
}

export async function notifySuccess(): Promise<void> {
  if (!isNativePlatform()) return;
  const b = await getBridge();
  if (!b) return;
  try {
    await b.haptics.notification('success');
  } catch {
    /* no-op */
  }
}

export async function notifyError(): Promise<void> {
  if (!isNativePlatform()) return;
  const b = await getBridge();
  if (!b) return;
  try {
    await b.haptics.notification('error');
  } catch {
    /* no-op */
  }
}
