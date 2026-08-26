'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthService';

/**
 * AuthInitializer: 
 * - Inicializa listener de auth UNA VEZ
 * - Ejecuta auto-restore cuando hay usuario autenticado
 * - NO crea usuario anónimo (Firebase persiste sesión)
 */
export function AuthInitializer() {
  const { user, state, initializeAuthListener, performAutoRestore } = useAuth();

  // 1. Inicializar listener UNA VEZ al montar
  useEffect(() => {
    initializeAuthListener();
  }, [initializeAuthListener]);

  // 2. Auto-restore cuando hay usuario autenticado
  useEffect(() => {
    if (user && (state === 'anonymous' || state === 'authenticated')) {
      performAutoRestore().catch(console.error);
    }
  }, [user, state, performAutoRestore]);

  return null; // No renderiza nada
}