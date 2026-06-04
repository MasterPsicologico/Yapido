'use client';

import { useEffect } from 'react';
import { firebaseApp } from '@/lib/firebase/client';

export function FirebaseBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inicializa Firebase en cliente (cliente-only).
    firebaseApp();
  }, []);
  return <>{children}</>;
}

