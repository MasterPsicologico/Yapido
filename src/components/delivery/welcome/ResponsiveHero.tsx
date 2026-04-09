"use client";

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ResponsiveHeroProps {
  bgMobile?: string;
  bgDesktop?: string;
  onAction: () => void;
}

/**
 * ResponsiveHero - El visor de impacto visual.
 * AJUSTE: El contenedor ahora permite ver la imagen completa sin recortes forzados.
 */
export function ResponsiveHero({ bgMobile, bgDesktop, onAction }: ResponsiveHeroProps) {
  const defaultPlaceholder = "https://picsum.photos/seed/delivery/1920/1080";

  return (
    <div 
      onClick={onAction}
      className="relative w-full overflow-hidden shadow-2xl group/hero cursor-pointer bg-slate-900"
    >
      {/* VERSIÓN PC / TABLET (Horizontal) */}
      <div className="hidden sm:block relative w-full h-auto min-h-[400px]">
        <Image 
          src={bgDesktop || bgMobile || defaultPlaceholder} 
          alt="Bienvenida PC" 
          width={1920}
          height={1080}
          className="w-full h-auto object-contain transition-transform duration-1000 group-hover/hero:scale-[1.02]" 
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-40" />
      </div>

      {/* VERSIÓN MÓVIL (Vertical) - AJUSTADA PARA VERSE COMPLETA */}
      <div className="block sm:hidden relative w-full h-auto min-h-[500px]">
        <Image 
          src={bgMobile || defaultPlaceholder} 
          alt="Bienvenida Móvil" 
          width={1000}
          height={1600}
          className="w-full h-auto object-contain transition-transform duration-1000 group-hover/hero:scale-[1.02]" 
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-40" />
      </div>

      {/* INDICADOR DE CLICK MAESTRO */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity duration-500 bg-black/20 backdrop-blur-[2px]">
        <div className="px-8 py-4 rounded-full bg-primary/90 text-white font-black uppercase text-xs italic tracking-widest shadow-2xl animate-in zoom-in duration-300 border border-white/20">
          ACTIVAR REGISTRO ÉLITE
        </div>
      </div>
    </div>
  );
}
