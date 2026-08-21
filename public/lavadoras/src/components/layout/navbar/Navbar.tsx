
"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, Loader2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useAuth } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';

// Submódulos Atómicos
import { NavbarSidebar } from './sidebar/NavbarSidebar';
import { NavbarModeSwitcher } from './mode-switcher/NavbarModeSwitcher';
import { NavbarUserMenu } from './user/NavbarUserMenu';
import { ActivityCenter } from './actions/activity/ActivityCenter';
import { MessageCenter } from './actions/messages/MessageCenter';
import { FavoritesCenter } from './actions/favorites/FavoritesCenter';
import { CartCenter } from './actions/cart/CartCenter';

const MODE_KEY = 'yapido_click_preferred_mode';

export function Navbar() {
  const { user, isUserLoading } = useUser();
  const { profile, isOwner, isAdmin } = useProfile();
  const { getRememberedAccount, signInWithRecoveryCode } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '/';

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCodeLogin, setShowCodeLogin] = useState(false);

  // Check if user has logged out before (has remembered account)
  useEffect(() => {
    if (!isUserLoading && !user) {
      const remembered = getRememberedAccount();
      setShowCodeLogin(!!remembered);
    } else {
      setShowCodeLogin(false);
    }
  }, [user, isUserLoading, getRememberedAccount]);

  const isDeliveryZone = pathname.startsWith('/delivery');
  const isRepartidor = profile?.role === 'repartidor';
  const canAccessManage = isOwner || isAdmin || profile?.role === 'dueño';

  // LÓGICA DE ACCESO MAESTRA: Solo admin o repartidores vinculados ven el switcher
  const showModeSwitcher = isAdmin || (isRepartidor && profile?.linkedStoreId);

  const handleModeSwitch = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    let currentProgress = 0;
    
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        
        const nextMode = isDeliveryZone ? 'stores' : 'delivery';
        const nextPath = isDeliveryZone ? '/' : '/delivery/dashboard';
        
        localStorage.setItem(MODE_KEY, nextMode);
        router.push(nextPath);
        
        setTimeout(() => {
          setIsTransitioning(false);
          setProgress(0);
        }, 500);
      }
    }, 30);
  };

  const handleLogout = () => {
    localStorage.removeItem(MODE_KEY);
    // signOut() en AuthService ya guarda la remembered account
    // Disparamos evento para mostrar el botón de login con código
    setShowCodeLogin(true);
    auth.signOut();
  };

  const openCodeLogin = () => {
    window.dispatchEvent(new CustomEvent('open-code-login', { 
      detail: { mode: 'login' } 
    }));
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-2xl border-b border-slate-100">
      <div className="container mx-auto px-2 sm:px-6 h-16 flex items-center justify-between gap-1 sm:gap-2 max-w-7xl">
        
        {/* Lado Izquierdo: Compacto */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <NavbarSidebar 
            user={user} profile={profile} canAccessManage={canAccessManage} 
            isRepartidor={isRepartidor} onLogin={openCodeLogin} onLogout={handleLogout} 
            showCodeLogin={showCodeLogin}
          />
          
          {!isUserLoading && user && showModeSwitcher && (
            <NavbarModeSwitcher 
              isDeliveryZone={isDeliveryZone} 
              isTransitioning={isTransitioning} 
              progress={progress} 
              onSwitch={handleModeSwitch} 
            />
          )}
        </div>

        {/* Lado Derecho: Acciones agrupadas y Perfil Protegido */}
        <div className="flex items-center gap-1 sm:gap-3 ml-auto">
          {!isUserLoading && user && (
            <>
              <div className="flex items-center bg-slate-50/80 rounded-full px-0.5 sm:px-1 py-1 gap-0 border border-slate-100 backdrop-blur-sm shadow-inner shrink">
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

          {!isUserLoading && !user && showCodeLogin && (
            <Button 
              onClick={openCodeLogin}
              variant="default" 
              className="bg-secondary hover:bg-secondary/90 flex items-center gap-2 rounded-full px-4 font-black shadow-lg shadow-secondary/20 h-9 text-[10px] uppercase tracking-widest min-w-[120px]"
            >
              <Key className="w-4 h-4" />
              <span className="hidden xs:inline">Ingresar con código</span>
            </Button>
          )}

          {!isUserLoading && !user && !showCodeLogin && (
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest hidden xs:inline">
              Sesión automática
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
