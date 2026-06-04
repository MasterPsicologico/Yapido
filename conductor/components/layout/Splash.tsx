'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';

const SPLASH_KEY = 'yapido-m-splash-shown';

export function Splash({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.user);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const already = sessionStorage.getItem(SPLASH_KEY) === '1';
    if (!already) {
      setShow(true);
      sessionStorage.setItem(SPLASH_KEY, '1');
    }
  }, []);

  useEffect(() => {
    if (show) {
      const t = setTimeout(() => setShow(false), 2200);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (show) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="splash-logo splash-pulse">
          <div className="h-24 w-24 rounded-3xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-primary-foreground text-5xl font-black">Y</span>
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          Yapido <span className="text-primary">Movilidad</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Cargando tu próxima ruta…</p>
      </div>
    );
  }
  return <>{children}</>;
}

