
"use client";

import { useState, useEffect } from 'react';
import { Zap, Moon, Camera, Store as StoreIcon, LayoutGrid, ChevronDown, Loader2, Lock, Unlock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
  const [localBanner, setLocalBanner] = useState<string | null>(null);

  // SISTEMA DE CACHÉ INSTANTÁNEO
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      setLocalBanner(cached);
    }
  }, []);

  useEffect(() => {
    if (bannerConfig?.backgroundImage && bannerConfig.backgroundImage !== localBanner) {
      setLocalBanner(bannerConfig.backgroundImage);
      localStorage.setItem(CACHE_KEY, bannerConfig.backgroundImage);
    }
  }, [bannerConfig?.backgroundImage, localBanner]);

  return (
    <div 
      onClick={onOpenSolicitation}
      className="relative w-full min-h-[calc(100dvh-64px)] overflow-hidden cursor-pointer flex flex-col items-center justify-start pt-32 px-6 text-center bg-[#050505] active:scale-[0.99] transition-all duration-500"
    >
      {/* Fondo de Identidad */}
      <div className="absolute inset-0 z-0">
        {localBanner ? (
          <Image 
            src={localBanner} 
            alt="Portada" 
            fill 
            className="object-cover object-top animate-in fade-in duration-700" 
            priority 
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0a0a0a] to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>

      {/* Activador Central */}
      <div className="relative z-10 flex flex-col items-center gap-8 mt-16 animate-in fade-in zoom-in duration-700">
        <div className="relative group/cta">
          {isAnyStoreOpen && (
            <div className="absolute inset-0 rounded-full bg-red-500/40 [animation-duration:2000ms] animate-ping scale-125" />
          )}
          
          <div className={cn(
            "relative z-10 backdrop-blur-md text-white px-8 py-4 rounded-full font-black text-sm uppercase italic tracking-tighter shadow-2xl border border-white/20 flex items-center gap-3 transition-all hover:scale-105 active:scale-95",
            isAnyStoreOpen ? "bg-red-600/30 hover:bg-red-600/50" : "bg-slate-800/20 grayscale"
          )}>
            {isAnyStoreOpen ? (
              <><Zap className="w-5 h-5 fill-white animate-pulse" /> SOLICITAR AHORA</>
            ) : (
              <><Moon className="w-5 h-5 text-slate-400" /> TIENDAS CERRADAS</>
            )}
          </div>
        </div>
      </div>

      {/* BOTÓN DE CANDADO (MODO ENFOQUE - EXCLUSIVO ADMIN) */}
      {isAdmin && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock?.();
          }}
          className={cn(
            "absolute bottom-6 left-6 z-[50] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-90 border-2 backdrop-blur-xl",
            isLocked 
              ? "bg-slate-900 text-primary border-primary shadow-primary/20" 
              : "bg-white/10 text-white/40 border-white/10 hover:bg-white/20 hover:text-white"
          )}
        >
          {isLocked ? <Lock className="w-6 h-6 animate-pulse" /> : <Unlock className="w-6 h-6" />}
          
          {isLocked && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
            </span>
          )}
        </button>
      )}

      {/* Botón de Gestión / Registro de Tienda (Top Right) */}
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          onOpenStoreCreation(); 
        }}
        className="absolute top-4 right-4 z-[40] w-12 h-12 rounded-[18px] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/60 hover:text-green-500 transition-all shadow-2xl active:scale-95 group/store"
      >
        <StoreIcon className="w-6 h-6 group-hover/store:scale-110 transition-transform" />
      </button>

      {/* Botón Circular de Directorio (Bottom Right) */}
      <Link 
        href="/categories/category-washer"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-6 right-6 z-[40] w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:bg-primary hover:border-primary transition-all duration-500 group/dir active:scale-90"
      >
        <LayoutGrid className="w-6 h-6 group-hover/dir:scale-110 transition-transform" />
      </Link>

      {/* Controles de Administrador (Top Left) */}
      {isAdmin && (
        <div className="absolute top-4 left-4 z-[40]">
          <input type="file" className="hidden" accept="image/*" onChange={onBannerUpload} />
          <button 
            onClick={(e) => { e.stopPropagation(); (e.currentTarget.previousSibling as HTMLInputElement).click(); }} 
            disabled={isUploadingBanner} 
            className="w-12 h-12 rounded-[18px] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/60 hover:text-primary transition-all shadow-2xl"
          >
            {isUploadingBanner ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Camera className="w-5 h-5" />}
          </button>
        </div>
      )}

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-30 animate-bounce"><ChevronDown className="w-6 h-6 text-white" /></div>
    </div>
  );
}
