
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * Hook para obtener el perfil extendido del usuario desde Firestore, incluyendo su ROL.
 */
export function useProfile() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  return {
    profile,
    isAdmin: profile?.role === 'admin',
    isOwner: profile?.role === 'dueño' || profile?.role === 'admin',
    isLoading: isAuthLoading || isProfileLoading,
    user
  };
}
