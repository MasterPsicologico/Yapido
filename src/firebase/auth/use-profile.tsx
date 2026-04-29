
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
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

/**
 * Hook para obtener el perfil extendido del usuario desde Firestore.
 * Incluye la lógica de niveles basada en el desempeño.
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

  // Lógica de cálculo de nivel (Simplificada para MVP, basada en avgRating del perfil)
  const getLevel = (): UserLevel => {
    const stars = profile?.avgRating || 5.0;
    const count = profile?.completedJobs || 0;
    
    if (stars >= 4.9 && count > 50) return 'leyenda';
    if (stars >= 4.5 && count > 10) return 'elite';
    return 'promesa';
  };

  const currentLevel = getLevel();

  // Hardcoded Superadmin bypass for the master creator accounts
  const isSuperAdmin = user?.uid === '9qjHXRHfKfS2LrlE6074rR9JOm83' || user?.uid === 'OUeZfonX8AY4YHRI4qLCc1WiVFN2' || user?.uid === 'YohYZ5BLFiUIL9Z4IWrTVlDjwt43' || user?.uid === 'ZfSO1go6agR2owAsDh07GH440QN2';

  return {
    profile,
    isAdmin: isSuperAdmin || profile?.role === 'admin',
    isOwner: isSuperAdmin || profile?.role === 'dueño' || profile?.role === 'admin',
    isRepartidor: profile?.role === 'repartidor',
    level: LEVELS[currentLevel],
    isLoading: isAuthLoading || isProfileLoading,
    user
  };
}
