"use client";

import { useState, useEffect, useRef } from 'react';
import { Zap, Moon, Camera, Store as StoreIcon, LayoutGrid, ChevronDown, Loader2, Lock, Unlock, Smartphone, Monitor, X, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';

interface WasherRentalCardProps {
  isAdmin: boolean;
  bannerConfig: any;
  isAnyStoreOpen: boolean;
  isUploadingBanner: boolean;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onOpenSolicitation: () => void;
  onOpenStoreCreation: () => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>, target: 'mobile' | 'pc') => void;
}

const CACHE_MOBILE = 'vitriniando_washer_banner_mobile';
const CACHE_DESKTOP = 'vitriniando_washer_banner_desktop';

export function WasherRentalCard({
  isAdmin,
  bannerConfig,
  isAnyStoreOpen,
  isUploadingBanner,
  isLocked = false,
  onToggleLock,
  onOpenSolicitation,
  onOpenStoreCreation,
  onBannerUpload
}: WasherRentalCardProps) {
  const [localMobile, setLocalMobile] = useState<string | null>(null);
  const [localDesktop, setLocalDesktop] = useState<string | null>(null);
  
  // ESTADOS DEL BOTÓN (MAESTRO)
  const [isMovingBtn, setIsMovingBtn] = useState(false);
  const [btnPos, setBtnPos] = useState({ x: bannerConfig?.btnX ?? 50, y: bannerConfig?.btnY ?? 40 });
  const [originalBtnPos, setOriginalBtnPos] = useState({ x: 50, y: 40 });
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cachedMobile = localStorage.getItem(CACHE_MOBILE);
    const cachedDesktop = localStorage.getItem(CACHE_DESKTOP);
    if (cachedMobile) setLocalMobile(cachedMobile);
    if (cachedDesktop) setLocalDesktop(cachedDesktop);
  }, []);

  useEffect(() => {
    if (bannerConfig?.backgroundImage && bannerConfig.backgroundImage !== localMobile) {
      setLocalMobile(bannerConfig.backgroundImage);
      localStorage.setItem(CACHE_MOBILE, bannerConfig.backgroundImage);
    }
    if (bannerConfig?.backgroundImageDesktop && bannerConfig.backgroundImageDesktop !== localDesktop) {
      setLocalDesktop(bannerConfig.backgroundImageDesktop);
      localStorage.setItem(CACHE_DESKTOP, bannerConfig.backgroundImageDesktop);
    }
    if (bannerConfig?.btnX !== undefined && bannerConfig?.btnY !== undefined && !isMovingBtn) {
      setBtnPos({ x: bannerConfig.btnX, y: bannerConfig.btnY });
    }
  }, [bannerConfig, localMobile, localDesktop, isMovingBtn]);

  // MOTOR DE MOVIMIENTO DE BOTÓN CTA
  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isMovingBtn) return;
      if (e.cancelable) e.preventDefault();

      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

      if (isMovingBtn && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const xPercent = ((clientX - rect.left) / rect.width) * 100;
        const yPercent = ((clientY - rect.top) / rect.height) * 100;
        setBtnPos({ 
          x: Math.max(5, Math.min(95, xPercent)), 
          y: Math.max(5, Math.min(95, yPercent)) 
        });
      }
    };

    const onUp = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    if (isMovingBtn) {
      window.addEventListener('mousemove', onMove, { passive: false });
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isMovingBtn]);

  const handleBtnStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAdmin || isMovingBtn) return;
    const touch = 'touches' in e ? e.touches[0] : e;
    const startX = touch.clientX;
    const startYPress = touch.clientY;
    setOriginalBtnPos({ ...btnPos });
    
    const cancelLongPress = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    longPressTimer.current = setTimeout(() => {
      setIsMovingBtn(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(150);
    }, 5000);
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full min-h-[calc(100dvh-64px)] overflow-hidden flex flex-col items-center justify-start bg-[#050505] transition-all duration-500",
        isMovingBtn ? "cursor-move" : ""
      )}
    >
      {/* IMAGEN DE PORTADA RESPONSIVA */}
      <div className="absolute inset-0 z-0 select-none touch-none">
        {/* VERSIÓN MÓVIL */}
        <div className="sm:hidden relative w-full h-full">
          {localMobile ? (
            <Image src={localMobile} alt="Portada Móvil" fill className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
          )}
        </div>
        
        {/* VERSIÓN DESKTOP */}
        <div className="hidden sm:block relative w-full h-full">
          {localDesktop ? (
            <Image src={localDesktop} alt="Portada PC" fill className="object-cover" priority />
          ) : localMobile ? (
            <Image src={localMobile} alt="Portada Fallback" fill className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
          )}
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>

      {/* CONTROLES ADMIN PORTADA DUAL */}
      {isAdmin && !isMovingBtn && (
        <div className="absolute top-4 left-4 z-[50] flex flex-col gap-3 animate-in slide-in-from-left-4 duration-500">
          {/* CARGA MÓVIL */}
          <div className="group relative">
            <input type="file" ref={mobileInputRef} className="hidden" accept="image/*" onChange={(e) => onBannerUpload(e, 'mobile')} />
            <button 
              onClick={() => mobileInputRef.current?.click()} 
              disabled={isUploadingBanner} 
              className="w-12 h-12 rounded-[18px] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/60 hover:text-primary hover:border-primary transition-all shadow-2xl active:scale-90"
            >
              {isUploadingBanner ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
            </button>
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-[7px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/5 pointer-events-none">PORTADA MÓVIL</span>
          </div>

          {/* CARGA PC */}
          <div className="group relative">
            <input type="file" ref={desktopInputRef} className="hidden" accept="image/*" onChange={(e) => onBannerUpload(e, 'pc')} />
            <button 
              onClick={() => desktopInputRef.current?.click()} 
              disabled={isUploadingBanner} 
              className="w-12 h-12 rounded-[18px] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/60 hover:text-secondary hover:border-secondary transition-all shadow-2xl active:scale-90"
            >
              {isUploadingBanner ? <Loader2 className="w-5 h-5 animate-spin" /> : <Monitor className="w-5 h-5" />}
            </button>
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-[7px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/5 pointer-events-none">PORTADA PC</span>
          </div>
        </div>
      )}

      {/* BOTÓN "SOLICITAR AHORA" DINÁMICO */}
      <div 
        style={{ 
          position: 'absolute', 
          left: `${btnPos.x}%`, 
          top: `${btnPos.y}%`, 
          transform: 'translate(-50%, -50%)' 
        }}
        onMouseDown={handleBtnStart}
        onTouchStart={handleBtnStart}
        className={cn(
          "z-20 flex flex-col items-center gap-2 transition-transform duration-300",
          isMovingBtn ? "scale-110" : "animate-in fade-in zoom-in duration-700"
        )}
      >
        {isMovingBtn && (
          <div className="flex gap-3 mb-2 animate-in slide-in-from-bottom-2 duration-300">
            <button onClick={() => { setBtnPos({...originalBtnPos}); setIsMovingBtn(false); }} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90"><X className="w-4 h-4" /></button>
            <button onClick={() => setIsMovingBtn(false)} className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg active:scale-90"><CheckCircle2 className="w-4 h-4" /></button>
          </div>
        )}

        <div onClick={() => !isMovingBtn && onOpenSolicitation()} className="relative group/cta cursor-pointer">
          {isAnyStoreOpen && !isMovingBtn && (
            <div className="absolute inset-0 rounded-full bg-red-500/40 [animation-duration:2000ms] animate-ping scale-125" />
          )}
          <div className={cn(
            "relative z-10 backdrop-blur-md text-white px-8 py-4 rounded-full font-black text-sm uppercase italic tracking-tighter shadow-2xl border border-white/20 flex items-center gap-3 transition-all",
            isMovingBtn ? "bg-primary/60 border-primary" : isAnyStoreOpen ? "bg-red-600/30 hover:bg-red-600/50 hover:scale-105 active:scale-95" : "bg-slate-800/20 grayscale"
          )}>
            {isAnyStoreOpen ? (
              <><Zap className="w-5 h-5 fill-white animate-pulse" /> SOLICITAR AHORA</>
            ) : (
              <><Moon className="w-5 h-5 text-slate-400" /> TIENDAS CERRADAS</>
            )}
          </div>
        </div>
      </div>

      {/* CONTROLES ADMIN INFERIORES */}
      {isAdmin && !isMovingBtn && (
        <button onClick={onToggleLock} className={cn("absolute bottom-6 left-6 z-[50] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-90 border-2 backdrop-blur-xl", isLocked ? "bg-slate-900 text-primary border-primary" : "bg-white/10 text-white/40 border-white/10 hover:bg-white/20")}>
          {isLocked ? <Lock className="w-6 h-6 animate-pulse" /> : <Unlock className="w-6 h-6" />}
        </button>
      )}

      {!isMovingBtn && (
        <button onClick={onOpenStoreCreation} className="absolute top-4 right-4 z-[40] w-12 h-12 rounded-[18px] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/60 hover:text-green-500 transition-all shadow-2xl active:scale-95 group/store">
          <StoreIcon className="w-6 h-6 group-hover/store:scale-110 transition-transform" />
        </button>
      )}

      {!isMovingBtn && (
        <>
          <Link href="/categories/category-washer" className="absolute bottom-6 right-6 z-[40] w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:bg-primary transition-all group/dir active:scale-90">
            <LayoutGrid className="w-6 h-6" />
          </Link>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-30 animate-bounce"><ChevronDown className="w-6 h-6 text-white" /></div>
        </>
      )}
    </div>
  );
}
