
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ResponsiveHeroProps {
  bgMobile?: string;
  bgDesktop?: string;
}

export function ResponsiveHero({ bgMobile, bgDesktop }: ResponsiveHeroProps) {
  const defaultPlaceholder = "https://picsum.photos/seed/delivery/1920/1080";

  return (
    <div className="relative w-full overflow-hidden shadow-2xl group/hero cursor-pointer">
      <Link href="/delivery/register" className="block w-full">
        {/* VERSIÓN PC / TABLET (Horizontal) */}
        <div className="hidden sm:block relative w-full aspect-[21/9] lg:aspect-[25/9]">
          <Image 
            src={bgDesktop || bgMobile || defaultPlaceholder} 
            alt="Bienvenida Repartidor PC" 
            fill 
            className="object-cover object-center transition-transform duration-1000 group-hover/hero:scale-105" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        </div>

        {/* VERSIÓN MÓVIL (Vertical) */}
        <div className="block sm:hidden relative w-full aspect-[4/5]">
          <Image 
            src={bgMobile || defaultPlaceholder} 
            alt="Bienvenida Repartidor Móvil" 
            fill 
            className="object-cover object-top transition-transform duration-1000 group-hover/hero:scale-105" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        </div>

        {/* INDICADOR DE CLICK MAESTRO */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity duration-500 bg-black/20 backdrop-blur-[2px]">
          <div className="px-8 py-4 rounded-full bg-primary/90 text-white font-black uppercase text-sm italic tracking-widest shadow-2xl animate-in zoom-in duration-300">
            ENTRAR A LA FLOTA AHORA
          </div>
        </div>
      </Link>
    </div>
  );
}
