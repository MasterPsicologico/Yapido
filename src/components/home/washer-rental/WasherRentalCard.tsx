
"use client";

import { Zap, Moon, Camera, Store as StoreIcon, LayoutGrid, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface WasherRentalCardProps {
  isAdmin: boolean;
  bannerConfig: any;
  isAnyStoreOpen: boolean;
  isUploadingBanner: boolean;
  onOpenSolicitation: () => void;
  onOpenStoreCreation: () => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function WasherRentalCard({
  isAdmin,
  bannerConfig,
  isAnyStoreOpen,
  isUploadingBanner,
  onOpenSolicitation,
  onOpenStoreCreation,
  onBannerUpload
}: WasherRentalCardProps) {
  return (
    <div 
      onClick={onOpenSolicitation}
      className="relative w-full min-h-[calc(100dvh-64px)] overflow-hidden cursor-pointer flex flex-col items-center justify-start pt-32 px-6 text-center bg-[#0a0a0a] active:scale-[0.99] transition-all duration-500"
    >
      {/* Fondo de Identidad */}
      <div className="absolute inset-0 z-0">
        {bannerConfig?.backgroundImage ? (
          <Image src={bannerConfig.backgroundImage} alt="Portada" fill className="object-cover object-top" priority />
        ) : (
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/wash/1920/1080')] bg-cover bg-top" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
      </div>

      {/* Activador Central */}
      <div className="relative z-10 flex flex-col items-center gap-8 mt-64 animate-in fade-in zoom-in duration-700">
        <div className="relative group/cta">
          {isAnyStoreOpen && (
            <div className="absolute inset-0 rounded-full bg-red-500/40 [animation-duration:2000ms] animate-ping scale-125" />
          )}
          
          <div className={cn(
            "relative z-10 backdrop-blur-md text-white px-6 py-3 rounded-full font-black text-xs uppercase italic tracking-tighter shadow-2xl border border-white/20 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95",
            isAnyStoreOpen ? "bg-red-600/90 hover:bg-red-600" : "bg-slate-800/80 grayscale"
          )}>
            {isAnyStoreOpen ? (
              <><Zap className="w-4 h-4 fill-white animate-pulse" /> SOLICITAR AHORA</>
            ) : (
              <><Moon className="w-4 h-4 text-slate-400" /> TIENDAS CERRADAS</>
            )}
          </div>
        </div>
      </div>

      {/* Botón Circular de Directorio */}
      <Link 
        href="/categories/category-washer"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-10 right-10 z-[40] w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-primary hover:border-primary transition-all duration-500 group/dir"
      >
        <LayoutGrid className="w-8 h-8 group-hover/dir:scale-110 transition-transform" />
        <span className="absolute -top-10 right-0 bg-black/60 text-white text-[8px] font-black uppercase px-2 py-1 rounded opacity-0 group-hover/dir:opacity-100 transition-opacity whitespace-nowrap tracking-widest">Ver Catálogo</span>
      </Link>

      {/* Controles de Administrador */}
      {isAdmin && (
        <div className="absolute top-4 left-4 z-30">
          <input type="file" className="hidden" accept="image/*" onChange={onBannerUpload} />
          <button 
            onClick={(e) => { e.stopPropagation(); (e.currentTarget.previousSibling as HTMLInputElement).click(); }} 
            disabled={isUploadingBanner} 
            className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-primary transition-all shadow-2xl"
          >
            {isUploadingBanner ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Camera className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Botón de Creación de Vitrina */}
      <button 
        onClick={(e) => { e.stopPropagation(); onOpenStoreCreation(); }} 
        className="absolute top-4 right-4 z-30 w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-green-400 transition-all shadow-2xl"
      >
        <StoreIcon className="w-4 h-4" />
      </button>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-30 animate-bounce"><ChevronDown className="w-5 h-5 text-white" /></div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={cn("animate-spin", className)}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
