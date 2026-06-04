/**
 * Helpers generales (cn, uuid, time, error).
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback simple
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function nowMs(): number {
  return Date.now();
}

export function safeJSON<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

/** Mensaje de error seguro para mostrar al usuario. */
export function userMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Algo salió mal. Intenta de nuevo.';
}

/** Sleep helper */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retry con backoff exponencial */
export async function retry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseMs?: number; maxMs?: number } = {}
): Promise<T> {
  const { retries = 3, baseMs = 400, maxMs = 5_000 } = opts;
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = Math.min(maxMs, baseMs * 2 ** i + Math.random() * 200);
      await sleep(wait);
    }
  }
  throw lastErr;
}

