'use client';

import dynamic from 'next/dynamic';

export const AmbientBackgroundLazy = dynamic(
  () => import('./AmbientBackground').then(mod => mod.AmbientBackground),
  { ssr: false, loading: () => null }
);
