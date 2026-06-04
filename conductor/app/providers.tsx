'use client';

import { useEffect, useState } from 'react';
import { firebaseAuth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { useUserStore } from '@/store/userStore';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase/client';
import type { User } from '@/lib/contracts';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useUserStore((s) => s.setUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setReady(true);
        return;
      }
      try {
        const snap = await getDoc(doc(firebaseDb(), 'users', fbUser.uid));
        if (snap.exists()) {
          setUser({ uid: fbUser.uid, ...(snap.data() as Omit<User, 'uid'>) });
        } else {
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
      } catch {
        setUser(null);
      } finally {
        setReady(true);
      }
    });
    return () => unsub();
  }, [setUser]);

  if (!ready) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-primary">Cargando Yapido…</div>
      </div>
    );
  }
  return <>{children}</>;
}

