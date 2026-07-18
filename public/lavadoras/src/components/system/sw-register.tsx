'use client';

import { useEffect } from 'react';
import { warm } from '@/lib/offline/warm';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
        })
        .catch((err) => console.warn('[sw] register failed:', err));

      if (navigator.onLine) {
        warm().catch(() => undefined);
      }

      window.addEventListener('online', () => {
        warm().catch(() => undefined);
      });
    };

    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad);

    return () => {
      window.removeEventListener('load', onLoad);
    };
  }, []);

  return null;
}
