/**
 * Cola offline de mutaciones.
 * Si una llamada a la API falla por red, se encola y reintenta al volver online.
 */

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect } from 'react';
import { uuid } from '@/lib/utils';

export interface PendingMutation {
  id: string;
  endpoint: string;
  body: unknown;
  headers: Record<string, string>;
  createdAt: number;
  retries: number;
  lastError?: string;
}

interface OfflineQueueState {
  queue: PendingMutation[];
  enqueue: (m: Omit<PendingMutation, 'id' | 'createdAt' | 'retries'>) => string;
  dequeue: (id: string) => void;
  markError: (id: string, err: string) => void;
  clear: () => void;
}

const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      enqueue: (m) => {
        const id = uuid();
        set({ queue: [...get().queue, { id, createdAt: Date.now(), retries: 0, ...m }] });
        return id;
      },
      dequeue: (id) => set({ queue: get().queue.filter((m) => m.id !== id) }),
      markError: (id, err) =>
        set({
          queue: get().queue.map((m) =>
            m.id === id ? { ...m, retries: m.retries + 1, lastError: err } : m
          ),
        }),
      clear: () => set({ queue: [] }),
    }),
    {
      name: 'yapido-m-offline-queue',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (undefined as any))),
    }
  )
);

/** Hook que envuelve fetch y encola si falla por red. */
export function useOfflineQueue() {
  const queue = useOfflineQueueStore((s) => s.queue);
  const enqueue = useOfflineQueueStore((s) => s.enqueue);
  const dequeue = useOfflineQueueStore((s) => s.dequeue);
  const markError = useOfflineQueueStore((s) => s.markError);

  // Reintentar al volver online
  useEffect(() => {
    function onOnline() {
      flush();
    }
    function flush() {
      const items = useOfflineQueueStore.getState().queue;
      items.forEach(async (m) => {
        try {
          const res = await fetch(m.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...m.headers },
            body: JSON.stringify(m.body),
          });
          if (res.ok) {
            dequeue(m.id);
          } else {
            markError(m.id, `HTTP ${res.status}`);
          }
        } catch (e: any) {
          markError(m.id, e?.message ?? 'network');
        }
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', onOnline);
      // Intentar flush al montar (por si quedó algo pendiente de una sesión previa)
      if (navigator.onLine) flush();
      return () => window.removeEventListener('online', onOnline);
    }
  }, [dequeue, markError]);

  async function submitOrQueue(endpoint: string, body: unknown, headers: Record<string, string> = {}): Promise<{ queued: boolean; ok: boolean }> {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
      return { queued: false, ok: res.ok };
    } catch (e: any) {
      // Encolar y devolver ok=false inmediato, pero la mutación no se pierde
      enqueue({ endpoint, body, headers });
      return { queued: true, ok: false };
    }
  }

  return { queue, submitOrQueue, clear: useOfflineQueueStore.getState().clear };
}

