
"use client";

import { useState, useEffect, useRef } from 'react';
import { Zap, Moon, Camera, Store as StoreIcon, LayoutGrid, ChevronDown, Loader2, Lock, Unlock, MoveVertical, CheckCircle2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';

interface WasherRentalCardProps {
  isAdmin: boolean;
  bannerConfig: any;
  isAnyStoreOpen: boolean;
  isUploadingBanner: boolean;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onOpenSolicitation: () => void;
  onOpenStoreCreation: () => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CACHE_KEY = 'vitriniando_washer_banner_cache';

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
  const firestore = useFirestore();
  const [localBanner, setLocalBanner] = useState<string | null>(null);
  
  // ESTADOS DE FONDO
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [yPos, setYPos] = useState(bannerConfig?.yPos ?? 0);
  const [isDragging, setIsDragging] = useState(false);
  
  // ESTADOS DEL BOTÓN (MAESTRO)
  const [isMovingBtn, setIsMovingBtn] = useState(false);
  const [btnPos, setBtnPos] = useState({ x: bannerConfig?.btnX ?? 50, y: bannerConfig?.btnY ?? 40 });
  const [originalBtnPos, setOriginalBtnPos] = useState({ x: 50, y: 40 });
  
  const startY = useRef(0);
  const startYPos = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) setLocalBanner(cached);
  }, []);

  useEffect(() => {
    if (bannerConfig?.backgroundImage && bannerConfig.backgroundImage !== localBanner) {
      setLocalBanner(bannerConfig.backgroundImage);
      localStorage.setItem(CACHE_KEY, bannerConfig.backgroundImage);
    }
    if (bannerConfig?.yPos !== undefined && !isDragging) {
      setYPos(bannerConfig.yPos);
    }
    if (bannerConfig?.btnX !== undefined && bannerConfig?.btnY !== undefined && !isMovingBtn) {
      setBtnPos({ x: bannerConfig.btnX, y: bannerConfig.btnY });
    }
  }, [bannerConfig, localBanner, isDragging, isMovingBtn]);

  // MOTOR DE ARRASTRE DE FONDO Y BOTÓN
  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging && !isMovingBtn) return;
      if (e.cancelable) e.preventDefault();

      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

      if (isDragging) {
        const deltaY = clientY - startY.current;
        const sensitivity = 0.15;
        const nextY = startYPos.current - (deltaY * sensitivity);
        setYPos(Math.max(0, Math.min(100, nextY)));
      }

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
      if (isDragging) setIsDragging(false);
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    if (isDragging || isMovingBtn) {
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
  }, [isDragging, isMovingBtn]);

  const handleStartDragBackground = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAdjusting || isMovingBtn) return;
    setIsDragging(true);
    startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startYPos.current = yPos;
  };

  // PROTOCOLO DE PRESIÓN LARGA PARA BOTÓN
  const handleBtnStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAdmin || isAdjusting || isMovingBtn) return;
    
    setOriginalBtnPos({ ...btnPos });
    
    longPressTimer.current = setTimeout(() => {
      setIsMovingBtn(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
      toast({ title: "Modo Mover Activado", description: "Ubica el botón y confirma." });
    }, 3000);
  };

  const handleSaveBackground = async () => {
    if (!firestore) return;
    const bannerRef = doc(firestore, 'appConfig', 'washer_banner');
    updateDocumentNonBlocking(bannerRef, { yPos, updatedAt: serverTimestamp() });
    setIsAdjusting(false);
    toast({ title: "Encuadre Guardado" });
  };

  const handleSaveBtnPos = async () => {
    if (!firestore) return;
    const bannerRef = doc(firestore, 'appConfig', 'washer_banner');
    updateDocumentNonBlocking(bannerRef, { 
      btnX: btnPos.x, 
      btnY: btnPos.y, 
      updatedAt: serverTimestamp() 
    });
    setIsMovingBtn(false);
    toast({ title: "Posición Guardada", className: "bg-green-600 text-white" });
  };

  const handleCancelBtnMove = () => {
    setBtnPos({ ...originalBtnPos });
    setIsMovingBtn(false);
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full min-h-[calc(100dvh-64px)] overflow-hidden flex flex-col items-center justify-start bg-[#050505] transition-all duration-500",
        (isAdjusting || isMovingBtn) ? "cursor-move" : ""
      )}
    >
      {/* IMAGEN DE PORTADA */}
      <div 
        onMouseDown={handleStartDragBackground}
        onTouchStart={handleStartDragBackground}
        className="absolute inset-0 z-0 select-none touch-none"
      >
        {localBanner ? (
          <Image 
            src={localBanner} 
            alt="Portada" 
            fill 
            style={{ objectPosition: `center ${yPos}%`, filter: isAdjusting ? 'brightness(1.2)' : 'none' }}
            className="object-cover transition-transform duration-100 ease-out" 
            priority 
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0a0a0a] to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>

      {/* CONTROLES ADMIN FONDO */}
      {isAdmin && !isMovingBtn && (
        <div className="absolute top-4 left-4 z-[50] flex flex-col gap-3">
          <input type="file" className="hidden" accept="image/*" onChange={onBannerUpload} id="banner-input" />
          <button onClick={() => document.getElementById('banner-input')?.click()} disabled={isUploadingBanner} className="w-12 h-12 rounded-[18px] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/60 hover:text-primary transition-all shadow-2xl">
            {isUploadingBanner ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Camera className="w-5 h-5" />}
          </button>
          <button onClick={() => setIsAdjusting(!isAdjusting)} className={cn("w-12 h-12 rounded-[18px] backdrop-blur-xl border flex items-center justify-center transition-all shadow-2xl", isAdjusting ? "bg-primary text-white border-white animate-pulse" : "bg-white/10 text-white/60 border-white/20 hover:text-yellow-500")}>
            <MoveVertical className="w-5 h-5" />
          </button>
          {isAdjusting && (
            <button onClick={handleSaveBackground} className="w-12 h-12 rounded-[18px] bg-green-500 text-white border border-white flex items-center justify-center shadow-2xl animate-in zoom-in">
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
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
        {/* MINI CONTROLES DE GUARDADO (X y CHULITO) */}
        {isMovingBtn && (
          <div className="flex gap-3 mb-2 animate-in slide-in-from-bottom-2 duration-300">
            <button 
              onClick={handleCancelBtnMove}
              className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 border border-white/20"
            >
              <X className="w-4 h-4 stroke-[4]" />
            </button>
            <button 
              onClick={handleSaveBtnPos}
              className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg active:scale-90 border border-white/20"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <div 
          onClick={() => !isMovingBtn && onOpenSolicitation()}
          className="relative group/cta cursor-pointer"
        >
          {isAnyStoreOpen && !isMovingBtn && (
            <div className="absolute inset-0 rounded-full bg-red-500/40 [animation-duration:2000ms] animate-ping scale-125" />
          )}
          <div className={cn(
            "relative z-10 backdrop-blur-md text-white px-8 py-4 rounded-full font-black text-sm uppercase italic tracking-tighter shadow-2xl border border-white/20 flex items-center gap-3 transition-all",
            isMovingBtn ? "bg-primary/60 border-primary ring-4 ring-primary/20" : isAnyStoreOpen ? "bg-red-600/30 hover:bg-red-600/50 hover:scale-105 active:scale-95" : "bg-slate-800/20 grayscale"
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
      {isAdmin && !isAdjusting && !isMovingBtn && (
        <button onClick={onToggleLock} className={cn("absolute bottom-6 left-6 z-[50] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-90 border-2 backdrop-blur-xl", isLocked ? "bg-slate-900 text-primary border-primary shadow-primary/20" : "bg-white/10 text-white/40 border-white/10 hover:bg-white/20 hover:text-white")}>
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
          <Link href="/categories/category-washer" className="absolute bottom-6 right-6 z-[40] w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:bg-primary hover:border-primary transition-all duration-500 group/dir active:scale-90">
            <LayoutGrid className="w-6 h-6 group-hover/dir:scale-110 transition-transform" />
          </Link>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-30 animate-bounce"><ChevronDown className="w-6 h-6 text-white" /></div>
        </>
      )}
    </div>
  );
}
