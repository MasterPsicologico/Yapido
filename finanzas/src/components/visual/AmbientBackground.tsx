'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

/**
 * AmbientBackground (CSS-based)
 *
 * Fondo animado de 3 capas con gradientes cónicos, blobs con movimiento
 * independiente y grano sutil. Reemplaza la versión Three.js porque
 * el build de Vercel Hobby excede el límite con R3F.
 *
 * - 0% JS bundle extra (todo CSS)
 * - Animado a 60fps con transform/opacity
 * - Respeta prefers-reduced-motion
 * - Temas light/dark sincronizados con CSS vars
 */
export function AmbientBackground() {
  const { theme } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const animClass = reducedMotion ? '' : 'animate-morph-slow';

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Layer 1: Gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: theme === 'dark'
            ? 'radial-gradient(ellipse at 30% 20%, hsl(222 60% 12%) 0%, hsl(222 47% 5%) 50%, hsl(222 47% 3%) 100%)'
            : 'radial-gradient(ellipse at 70% 30%, hsl(183 100% 95%) 0%, hsl(220 30% 96%) 50%, hsl(220 30% 98%) 100%)',
        }}
      />

      {/* Layer 2: Blob 1 */}
      <div
        className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-50 blur-3xl ${animClass}`}
        style={{
          background: theme === 'dark'
            ? 'radial-gradient(circle, hsl(183 100% 30% / 0.5) 0%, transparent 70%)'
            : 'radial-gradient(circle, hsl(183 100% 60% / 0.4) 0%, transparent 70%)',
          animation: reducedMotion ? 'none' : 'float-slow 20s ease-in-out infinite',
        }}
      />

      {/* Layer 3: Blob 2 */}
      <div
        className={`absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full opacity-40 blur-3xl ${animClass}`}
        style={{
          background: theme === 'dark'
            ? 'radial-gradient(circle, hsl(222 80% 30% / 0.6) 0%, transparent 70%)'
            : 'radial-gradient(circle, hsl(222 70% 70% / 0.5) 0%, transparent 70%)',
          animation: reducedMotion ? 'none' : 'float-slow 25s ease-in-out infinite reverse',
        }}
      />

      {/* Layer 4: Center accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30 blur-3xl"
        style={{
          background: theme === 'dark'
            ? 'radial-gradient(circle, hsl(280 60% 40% / 0.3) 0%, transparent 60%)'
            : 'radial-gradient(circle, hsl(280 60% 70% / 0.2) 0%, transparent 60%)',
          animation: reducedMotion ? 'none' : 'float-slow 30s ease-in-out infinite',
        }}
      />

      {/* Layer 5: Grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
