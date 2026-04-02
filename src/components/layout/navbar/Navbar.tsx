
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingBag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useProfile } from '@/firebase/auth/use-profile';

// Submódulos Atómicos
import { NavbarSidebar } from './sidebar/NavbarSidebar';
import { NavbarModeSwitcher } from './mode-switcher/NavbarModeSwitcher';
import { NavbarUserMenu } from './user/NavbarUserMenu';
import { ActivityCenter } from './actions/activity/ActivityCenter';
import { MessageCenter } from './actions/messages/MessageCenter';
import { FavoritesCenter } from './actions/favorites/FavoritesCenter';
import { CartCenter } from './actions/cart/CartCenter';

const MODE_KEY = 'vitriniando_preferred_mode';

export function Navbar() {
  const { user, isUserLoading } = useUser();
  const { profile, isOwner, isAdmin } = useProfile();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '/';

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);

  const isDeliveryZone = pathname.startsWith('/delivery');
  const isRepartidor = profile?.role === 'repartidor';
  const canAccessManage = isOwner || isAdmin || profile?.role === 'dueño';

  const handleModeSwitch = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    let currentProgress = 0;
    
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        
        // Determinamos la ruta de destino
        const nextMode = isDeliveryZone ? 'stores' : 'delivery';
        const nextPath = isDeliveryZone ? '/' : '/delivery/dashboard';
        
        localStorage.setItem(MODE_KEY, nextMode);
        
        // Redirección inmediata
        router.push(nextPath);
        
        // Delay para reset visual
        setTimeout(() => {
          setIsTransitioning(false);
          setProgress(0);
        }, 500);
      }
    }, 30);
  };

  const handleLogin = () => initiateGoogleSignIn(auth);
  const handleLogout = () => {
    localStorage.removeItem(MODE_KEY);
    auth.signOut();
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-2xl border-b border-slate-100">
      <div className="container mx-auto px-2 sm:px-6 h-16 flex items-center justify-between gap-1 sm:gap-2 max-w-7xl">
        
        {/* Lado Izquierdo: Sidebar y Logo */}
        <div className="flex items-center gap-0.5 sm:gap-4 shrink-0">
          <NavbarSidebar 
            user={user} profile={profile} canAccessManage={canAccessManage} 
            isRepartidor={isRepartidor} onLogin={handleLogin} onLogout={handleLogout} 
          />
          <Link href="/" className="flex items-center gap-1 sm:gap-2 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-lg shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-base sm:text-xl font-black tracking-tight text-primary hidden md:inline italic uppercase leading-none">Vitriniando</span>
          </Link>
        </div>

        {/* Lado Derecho: Acciones y Usuario */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          {!isUserLoading && user && (
            <>
              <NavbarModeSwitcher 
                isDeliveryZone={isDeliveryZone} isTransitioning={isTransitioning} 
                progress={progress} onSwitch={handleModeSwitch} 
              />
              <div className="flex items-center bg-slate-50/80 rounded-full px-0.5 sm:px-1 py-0.5 sm:py-1 gap-0 sm:gap-0.5 border border-slate-100 backdrop-blur-sm shadow-inner">
                <CartCenter />
                <FavoritesCenter />
                <ActivityCenter />
                <MessageCenter />
              </div>
              <NavbarUserMenu 
                user={user} profile={profile} canAccessManage={canAccessManage} onLogout={handleLogout} 
              />
            </>
          )}

          {!isUserLoading && !user && (
            <Button onClick={handleLogin} variant="default" className="bg-secondary hover:bg-secondary/90 flex items-center gap-2 rounded-full px-3 sm:px-6 font-black shadow-lg shadow-secondary/20 h-9 sm:h-10 text-[9px] sm:text-[10px] uppercase tracking-widest">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Ingresar</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
