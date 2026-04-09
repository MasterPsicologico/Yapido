
"use client";

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ResponsiveHeroProps {
  bgMobile?: string;
  bgDesktop?: string;
  onAction: () => void;
}

/**
 * ResponsiveHero - El Portal de Impacto Absoluto.
 * Ocupa el 100% del ancho y alto disponible sin scroll.
 */
export function ResponsiveHero({ bgMobile, bgDesktop, onAction }: ResponsiveHeroProps) {
  const defaultPlaceholder = "https://picsum.photos/seed/delivery/1920/1080";

  return (
    <div 
      onClick={onAction}
      className="relative w-full h-[calc(100dvh-64px)] overflow-hidden cursor-pointer bg-slate-900 group/hero"
    >
      {/* VERSIÓN PC / TABLET */}
      <div className="hidden sm:block relative w-full h-full">
        <Image 
          src={bgDesktop || bgMobile || defaultPlaceholder} 
          alt="Bienvenida PC" 
          fill
          className="object-cover object-center transition-transform duration-[3000ms] group-hover/hero:scale-105" 
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* VERSIÓN MÓVIL */}
      <div className="block sm:hidden relative w-full h-full">
        <Image 
          src={bgMobile || defaultPlaceholder} 
          alt="Bienvenida Móvil" 
          fill
          className="object-cover object-center transition-transform duration-[3000ms] group-hover/hero:scale-105" 
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* CAPA DE INTERACCIÓN ÉLITE */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity duration-700 bg-black/10 backdrop-blur-[1px]">
        <div className="px-10 py-5 rounded-full bg-primary/20 backdrop-blur-xl text-white font-black uppercase text-xs italic tracking-[0.3em] shadow-2xl border border-white/10 animate-in zoom-in duration-500">
          INICIAR REGISTRO ÉLITE
        </div>
      </div>
    </div>
  );
}
