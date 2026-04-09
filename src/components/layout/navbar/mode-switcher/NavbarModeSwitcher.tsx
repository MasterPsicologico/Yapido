
"use client";

import { Loader2, Zap, Store, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarModeSwitcherProps {
  isDeliveryZone: boolean;
  isTransitioning: boolean;
  progress: number;
  onSwitch: () => void;
}

/**
 * NavbarModeSwitcher - Terminal de Conmutación Elongada Compacta v2.2.
 * Ajuste: Ancho dinámico para evitar desbordamiento de Navbar.
 */
export function NavbarModeSwitcher({ isDeliveryZone, isTransitioning, progress, onSwitch }: NavbarModeSwitcherProps) {
  const targetLabel = isDeliveryZone ? "VITRINAS" : "DELIVERY";
  const accentColor = isDeliveryZone ? "text-secondary" : "text-primary";
  const accentBg = isDeliveryZone ? "bg-secondary" : "bg-primary";

  return (
    <button 
      type="button"
      className={cn(
        "relative flex items-center h-10 rounded-xl cursor-pointer transition-all duration-500 px-1 overflow-hidden shadow-sm border border-slate-200 outline-none group",
        "bg-white",
        isTransitioning && "pointer-events-none"
      )}
      style={{ width: 'fit-content', minWidth: '95px' }}
      onClick={(e) => {
        e.preventDefault();
        onSwitch();
      }}
    >
      {/* CAPA DE PROGRESO */}
      {isTransitioning && (
        <div 
          className={cn(
            "absolute inset-0 transition-all duration-100 ease-linear opacity-10 z-10", 
            accentBg
          )}
          style={{ width: `${progress}%` }}
        />
      )}

      {/* ICONO TÁCTICO COMPACTO */}
      <div className={cn(
        "relative z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white shadow-md transition-all duration-500 shrink-0",
        isDeliveryZone ? "bg-slate-800" : "bg-[#050505]",
        isTransitioning ? "scale-90 rotate-180" : "group-hover:scale-105 group-hover:rotate-6"
      )}>
        {isTransitioning ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
        ) : isDeliveryZone ? (
          <Store className="w-3.5 h-3.5 text-secondary" />
        ) : (
          <Zap className="w-3.5 h-3.5 text-primary fill-current animate-pulse" />
        )}
      </div>
      
      {/* TEXTO ELONGADO REFINADO */}
      <div className="relative z-20 flex flex-col items-start ml-1.5 sm:ml-2 text-left pr-1 sm:pr-2">
        <span className="text-[5px] sm:text-[6px] font-black uppercase tracking-[0.2em] leading-none mb-0.5 text-slate-400">
          {isTransitioning ? "CARGANDO" : "IR A"}
        </span>
        <div className="flex items-center gap-0.5">
          <span className={cn(
            "text-[9px] sm:text-[10px] font-black uppercase tracking-tight transition-all italic leading-none text-slate-900",
            isTransitioning && "animate-pulse"
          )}>
            {targetLabel}
          </span>
          {!isTransitioning && (
            <ChevronRight className={cn("w-2 h-2 transition-transform group-hover:translate-x-0.5", accentColor)} />
          )}
        </div>
      </div>

      <div className="absolute inset-0 z-30 pointer-events-none opacity-5">
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-slate-400 to-transparent skew-x-[-35deg] animate-[shimmer_8s_infinite_ease-in-out]" />
      </div>
    </button>
  );
}
