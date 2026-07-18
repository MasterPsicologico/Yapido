'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authenticateWithBiometric, checkBiometric, type BiometricAvailability } from '@/lib/capacitor/biometric-auth';

interface GateState {
  availability: BiometricAvailability | null;
  /** Requerir biométrica al desbloquear. */
  unlocked: boolean;
  /** Ya tuvimos un login previo (la marca vive en localStorage). */
  hasSession: boolean;
}

const GateCtx = createContext<{
  state: GateState;
  lock: () => void;
  unlock: () => Promise<{ success: boolean; error?: string }>;
} | null>(null);

const SESSION_KEY = 'lav:session';

export function BiometricGateProvider({ children }: { children: React.ReactNode }) {
  const [availability, setAvailability] = useState<BiometricAvailability | null>(null);
  const [hasSession, setHasSession] = useState<boolean>(false);
  const [unlocked, setUnlocked] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const a = await checkBiometric();
      if (!active) return;
      setAvailability(a);
      const stored =
        typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_KEY) === '1' : false;
      setHasSession(Boolean(stored) && a.available);
      if (stored && a.available) setUnlocked(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const lock = useCallback(() => {
    if (hasSession) setUnlocked(false);
  }, [hasSession]);

  const unlock = useCallback(async () => {
    if (!availability?.available) {
      setUnlocked(true);
      return { success: true };
    }
    const r = await authenticateWithBiometric({
      reason: 'Confirma tu identidad para continuar',
      title: 'Lavadoras',
      subtitle: 'Usa tu huella o rostro',
    });
    if (r.success) setUnlocked(true);
    return r;
  }, [availability]);

  const markLoggedIn = useCallback(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(SESSION_KEY, '1');
    setHasSession(true);
    setUnlocked(true);
  }, []);

  const value = useMemo(
    () => ({ state: { availability, unlocked, hasSession }, lock, unlock }),
    [availability, unlocked, hasSession, lock, unlock],
  );

  return (
    <GateCtx.Provider value={value}>
      {children}
      {/* exposto globalmente solo si el padre quiere manejar biometría */}
      <BiometricGlobalMethods markLoggedIn={markLoggedIn} />
    </GateCtx.Provider>
  );
}

export function useBiometricGate() {
  const ctx = useContext(GateCtx);
  if (!ctx) {
    return {
      state: { availability: null, hasSession: false, unlocked: true } as GateState,
      lock: () => undefined,
      unlock: async () => ({ success: true }),
    };
  }
  return ctx;
}

/** Permite marcar sesión desde auth flows sin exponer el ctx a toda la app. */
function BiometricGlobalMethods({ markLoggedIn }: { markLoggedIn: () => void }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    Object.defineProperty(window, '__lavMarkLoggedIn', { value: markLoggedIn });
    return () => {
      // keep on unload para evitar issues con SPA invocadas antes de dismissal
      return undefined as unknown as void;
    };
  }, [markLoggedIn]);
  return null;
}
