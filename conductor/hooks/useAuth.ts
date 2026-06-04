/**
 * Hook de autenticación.
 * Suscribe al estado de Firebase Auth y mantiene userStore sincronizado.
 */

'use client';

import { useEffect } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { firebaseAuth, firebaseDb } from '@/lib/firebase/client';
import { useUserStore } from '@/store/userStore';
import type { User } from '@/lib/contracts';

export function useAuth() {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const isPassenger = useUserStore((s) => s.isPassenger);
  const isDriver = useUserStore((s) => s.isDriver);
  const isAdmin = useUserStore((s) => s.isAdmin);

  useEffect(() => {
    const auth = firebaseAuth();
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setUser(null);
        unsubProfile?.();
        unsubProfile = null;
        return;
      }

      // Suscribirse al perfil en Firestore (live updates)
      unsubProfile?.();
      unsubProfile = onSnapshot(
        doc(firebaseDb(), 'users', fbUser.uid),
        (snap) => {
          if (snap.exists()) {
            setUser({ uid: fbUser.uid, ...(snap.data() as Omit<User, 'uid'>) });
          } else {
            // Perfil aún no creado (race en signup) — usar datos básicos
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              phone: fbUser.phoneNumber,
              displayName: fbUser.displayName ?? 'Usuario',
              photoURL: fbUser.photoURL,
              role: 'passenger',
              fcmTokens: [],
              status: 'active',
              locale: 'es-CO',
              citiesActive: [],
            });
          }
        },
        () => {
          // Si falla, aún tener al menos el fbUser para que la app no se rompa
          setUser(null);
        }
      );
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, [setUser]);

  return { user, isPassenger, isDriver, isAdmin };
}

