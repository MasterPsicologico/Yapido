
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
 * Ocupa el 100% del ancho y alto disponible sin scroll inicial.
 * Actualizado: Eliminados todos los overlays y efectos para mostrar el diseño puro.
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
          className="object-cover object-center" 
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      {/* VERSIÓN MÓVIL */}
      <div className="block sm:hidden relative w-full h-full">
        <Image 
          src={bgMobile || defaultPlaceholder} 
          alt="Bienvenida Móvil" 
          fill
          className="object-cover object-center" 
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>
    </div>
  );
}
