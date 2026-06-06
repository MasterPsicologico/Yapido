
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';
import { Star, Zap, Crown, Target } from 'lucide-react';

export type UserLevel = 'promesa' | 'elite' | 'leyenda';

export interface LevelInfo {
  name: string;
  color: string;
  bg: string;
  icon: any;
  border: string;
  minStars: number;
}

export const LEVELS: Record<UserLevel, LevelInfo> = {
  promesa: { 
    name: 'PROMESA', 
    color: 'text-blue-500', 
    bg: 'bg-blue-50', 
    border: 'border-blue-100',
    icon: Target,
    minStars: 0
  },
  elite: { 
    name: 'ÉLITE', 
    color: 'text-amber-600', 
    bg: 'bg-amber-50', 
    border: 'border-amber-100',
    icon: Zap,
    minStars: 4.5
  },
  leyenda: { 
    name: 'LEYENDA', 
    color: 'text-purple-600', 
    bg: 'bg-purple-50', 
    border: 'border-purple-100',
    icon: Crown,
    minStars: 4.9
  }
};

const SUPER_ADMINS_CONFIG_DOC = 'appConfig/superAdmins';

function useSuperAdminCheck(userUid: string | undefined, firestore: any, profileData: any) {
  const superAdminConfigRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, SUPER_ADMINS_CONFIG_DOC);
  }, [firestore]);

  const { data: superAdminConfig } = useDoc(superAdminConfigRef);

  if (!userUid || !profileData) return false;
  
  if (profileData.isSuperAdmin === true) return true;
  
  if (superAdminConfig?.adminIds?.[userUid] === true) return true;
  
  return false;
}

/**
 * Hook para obtener el perfil extendido del usuario desde Firestore.
 * Incluye la lógica de niveles basada en el desempeño.
 * 
 * SEGURIDAD: Los superadmins se determinan desde Firestore (appConfig/superAdmins),
 * no desde código hardcodeado.
 */
export function useProfile() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profileData, isLoading: isProfileLoading } = useDoc(userDocRef);

  const profile = (profileData && profileData.id === user?.uid) ? profileData : null;

  const getLevel = (): UserLevel => {
    const stars = profile?.avgRating || 5.0;
    const count = profile?.completedJobs || 0;
    
    if (stars >= 4.9 && count > 50) return 'leyenda';
    if (stars >= 4.5 && count > 10) return 'elite';
    return 'promesa';
  };

  const currentLevel = getLevel();

  const isSuperAdmin = useSuperAdminCheck(user?.uid, firestore, profileData);

  return {
    profile,
    isAdmin: isSuperAdmin || profile?.role === 'admin',
    isOwner: isSuperAdmin || profile?.role === 'dueño' || profile?.role === 'admin',
    isRepartidor: profile?.role === 'repartidor',
    isSuperAdmin: isSuperAdmin,
    level: LEVELS[currentLevel],
    isLoading: isAuthLoading || isProfileLoading,
    user
  };
}
