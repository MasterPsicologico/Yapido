/**
 * Hook para detectar conexión online/offline del navegador/dispositivo.
 */

'use client';

import { useEffect, useState } from 'react';

export function useOnline() {
  const [online, setOnline] = useState(true);
  const [rtdbConnected, setRtdbConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return { online, rtdbConnected, setRtdbConnected };
}

