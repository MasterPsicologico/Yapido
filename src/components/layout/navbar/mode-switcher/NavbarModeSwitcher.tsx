
"use client";

import { Loader2, Zap, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarModeSwitcherProps {
  isDeliveryZone: boolean;
  isTransitioning: boolean;
  progress: number;
  onSwitch: () => void;
}

/**
 * NavbarModeSwitcher - Terminal de Conmutación Elongada Premium.
 * Rediseñado para ocupar el espacio del logo y ofrecer una estética de alta gama.
 */
export function NavbarModeSwitcher({ isDeliveryZone, isTransitioning, progress, onSwitch }: NavbarModeSwitcherProps) {
  // El destino es lo opuesto a donde estamos
  const targetLabel = isDeliveryZone ? "IR A VITRINAS" : "MODO DELIVERY";
  const currentLabel = isDeliveryZone ? "DELIVERY" : "VITRINAS";

  return (
    <button 
      type="button"
      className={cn(
        "relative flex items-center h-10 sm:h-11 rounded-2xl cursor-pointer transition-all duration-500 px-1 overflow-hidden min-w-[140px] sm:min-w-[160px] shadow-xl border-none outline-none group",
        isDeliveryZone 
          ? "bg-slate-900 border-b-2 border-primary/30" 
          : "bg-gradient-to-br from-secondary to-[#00b5c5] border-b-2 border-white/20",
        isTransitioning && "pointer-events-none"
      )}
      onClick={(e) => {
        e.preventDefault();
        onSwitch();
      }}
    >
      {/* CAPA DE PROGRESO DE CRISTAL (DURANTE TRANSICIÓN) */}
      {isTransitioning && (
        <div 
          className={cn(
            "absolute inset-0 transition-all duration-100 ease-linear opacity-30 z-0", 
            isDeliveryZone ? "bg-primary" : "bg-white"
          )}
          style={{ width: `${progress}%` }}
        />
      )}

      {/* ICONO IDENTITARIO */}
      <div className={cn(
        "relative z-10 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xl transition-all duration-500 shrink-0",
        isDeliveryZone ? "bg-primary" : "bg-slate-900",
        isTransitioning ? "scale-90 rotate-180" : "group-hover:scale-110 group-hover:rotate-12"
      )}>
        {isTransitioning ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isDeliveryZone ? (
          <Zap className="w-4 h-4 fill-white animate-pulse" />
        ) : (
          <Store className="w-4 h-4" />
        )}
      </div>
      
      {/* TEXTO ELONGADO TÁCTICO */}
      <div className="relative z-10 flex flex-col items-start ml-3 text-left">
        <span className={cn(
          "text-[7px] font-black uppercase tracking-[0.3em] leading-none opacity-50 mb-0.5",
          isDeliveryZone ? "text-primary" : "text-white"
        )}>
          {isTransitioning ? "SINCRONIZANDO" : "MODO ACTIVO"}
        </span>
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest transition-all italic leading-none",
          isDeliveryZone ? "text-white" : "text-slate-950",
          isTransitioning && "animate-pulse"
        )}>
          {isTransitioning ? targetLabel : currentLabel}
        </span>
      </div>

      {/* Brillo Premium de Barrido */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-20">
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white to-transparent skew-x-[-35deg] animate-[shimmer_4s_infinite_ease-in-out]" />
      </div>
    </button>
  );
}
