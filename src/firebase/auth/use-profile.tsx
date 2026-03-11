'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * Hook para obtener el perfil extendido del usuario desde Firestore.
 * Garantiza que el perfil coincida con el usuario autenticado actual para evitar fugas de datos en cambios de cuenta.
 */
export function useProfile() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc(userDocRef);

  // Validación crítica: asegurar que el perfil cargado pertenezca al UID actual
  const profile = profileData?.id === user?.uid ? profileData : null;

  return {
    profile,
    isAdmin: profile?.role === 'admin',
    isOwner: profile?.role === 'dueño' || profile?.role === 'admin',
    isLoading: isAuthLoading || isProfileLoading,
    user
  };
}