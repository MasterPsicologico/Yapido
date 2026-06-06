
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ResponsiveHeroProps {
  bgMobile?: string;
  bgDesktop?: string;
  onAction: () => void;
}

const CACHE_MOBILE = 'yapido_click_delivery_welcome_mobile';
const CACHE_DESKTOP = 'yapido_click_delivery_welcome_desktop';

/**
 * ResponsiveHero - El Portal de Impacto Absoluto.
 * Ocupa el 100% del ancho y alto disponible sin scroll inicial.
 * SISTEMA DE CARGA INSTANTÁNEA: Eliminado el placeholder de águila y activado el caché local
 * para que la imagen real cargue al milisegundo desde la segunda sesión.
 */
export function ResponsiveHero({ bgMobile, bgDesktop, onAction }: ResponsiveHeroProps) {
  const [localMobile, setLocalMobile] = useState<string | null>(null);
  const [localDesktop, setLocalDesktop] = useState<string | null>(null);

  // 1. RECUPERACIÓN INSTANTÁNEA DESDE EL DISPOSITIVO (SIN ESPERAR A LA NUBE)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalMobile(localStorage.getItem(CACHE_MOBILE));
      setLocalDesktop(localStorage.getItem(CACHE_DESKTOP));
    }
  }, []);

  // 2. SINCRONIZACIÓN CON LA NUBE Y ACTUALIZACIÓN DE CACHÉ
  useEffect(() => {
    if (bgMobile && bgMobile !== localMobile) {
      setLocalMobile(bgMobile);
      localStorage.setItem(CACHE_MOBILE, bgMobile);
    }
    if (bgDesktop && bgDesktop !== localDesktop) {
      setLocalDesktop(bgDesktop);
      localStorage.setItem(CACHE_DESKTOP, bgDesktop);
    }
  }, [bgMobile, bgDesktop, localMobile, localDesktop]);

  const mobileSrc = localMobile || bgMobile;
  const desktopSrc = localDesktop || bgDesktop;

  return (
    <div 
      onClick={onAction}
      className="relative w-full h-[calc(100dvh-64px)] overflow-hidden cursor-pointer bg-slate-950 group/hero"
    >
      {/* VERSIÓN PC / TABLET */}
      <div className="hidden sm:block relative w-full h-full">
        {desktopSrc ? (
          <Image 
            src={desktopSrc} 
            alt="Bienvenida PC" 
            fill
            className="object-cover object-center animate-in fade-in duration-500" 
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-slate-950" />
        )}
      </div>

      {/* VERSIÓN MÓVIL */}
      <div className="block sm:hidden relative w-full h-full">
        {mobileSrc ? (
          <Image 
            src={mobileSrc} 
            alt="Bienvenida Móvil" 
            fill
            className="object-cover object-center animate-in fade-in duration-500" 
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-slate-950" />
        )}
      </div>
    </div>
  );
}
