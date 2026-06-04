/**
 * Store global del usuario autenticado.
 * Es un espejo ligero de Firebase Auth para que los componentes
 * no tengan que re-render cuando cambia auth.
 */

import { create } from 'zustand';
import type { User } from '@/lib/contracts';

interface UserStore {
  user: User | null;
  isPassenger: boolean;
  isDriver: boolean;
  isAdmin: boolean;
  setUser: (u: User | null) => void;
  setRole: (role: 'passenger' | 'driver' | 'both' | 'admin') => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isPassenger: false,
  isDriver: false,
  isAdmin: false,
  setUser: (user) =>
    set({
      user,
      isPassenger: !!user && (user.role === 'passenger' || user.role === 'both'),
      isDriver: !!user && (user.role === 'driver' || user.role === 'both'),
      isAdmin: !!user && user.role === 'admin',
    }),
  setRole: (role) =>
    set((s) => ({
      user: s.user ? { ...s.user, role } : null,
      isPassenger: role === 'passenger' || role === 'both',
      isDriver: role === 'driver' || role === 'both',
      isAdmin: role === 'admin',
    })),
}));
