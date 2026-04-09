
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
 * NavbarModeSwitcher - Terminal de Conmutación Elongada Premium v2.1.
 * Corregido: Fondo Blanco Élite, ancho optimizado para evitar desbordamientos.
 */
export function NavbarModeSwitcher({ isDeliveryZone, isTransitioning, progress, onSwitch }: NavbarModeSwitcherProps) {
  // EL DESTINO ES EL PROTAGONISTA: El usuario debe ver a dónde va a ir.
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
      style={{ width: 'fit-content', minWidth: '120px' }}
      onClick={(e) => {
        e.preventDefault();
        onSwitch();
      }}
    >
      {/* CAPA DE PROGRESO DE CRISTAL (DURANTE TRANSICIÓN) */}
      {isTransitioning && (
        <div 
          className={cn(
            "absolute inset-0 transition-all duration-100 ease-linear opacity-10 z-10", 
            accentBg
          )}
          style={{ width: `${progress}%` }}
        />
      )}

      {/* ICONO IDENTITARIO TÁCTICO */}
      <div className={cn(
        "relative z-20 w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md transition-all duration-500 shrink-0",
        isDeliveryZone ? "bg-slate-800" : "bg-[#050505]",
        isTransitioning ? "scale-90 rotate-180" : "group-hover:scale-105 group-hover:rotate-6"
      )}>
        {isTransitioning ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : isDeliveryZone ? (
          <Store className="w-4 h-4 text-secondary" />
        ) : (
          <Zap className="w-4 h-4 text-primary fill-current animate-pulse" />
        )}
      </div>
      
      {/* TEXTO ELONGADO DE ALTA GAMA - AHORA SOBRE BLANCO */}
      <div className="relative z-20 flex flex-col items-start ml-2.5 text-left pr-2">
        <span className={cn(
          "text-[6px] font-black uppercase tracking-[0.3em] leading-none mb-0.5",
          isDeliveryZone ? "text-slate-400" : "text-slate-400"
        )}>
          {isTransitioning ? "SINCRONIZANDO" : "IR A SECCIÓN"}
        </span>
        <div className="flex items-center gap-1">
          <span className={cn(
            "text-[10px] font-black uppercase tracking-[0.1em] transition-all italic leading-none",
            "text-slate-900",
            isTransitioning && "animate-pulse"
          )}>
            {targetLabel}
          </span>
          {!isTransitioning && (
            <ChevronRight className={cn("w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5", accentColor)} />
          )}
        </div>
      </div>

      {/* Brillo Premium de Barrido Sutil */}
      <div className="absolute inset-0 z-30 pointer-events-none opacity-10">
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-slate-400 to-transparent skew-x-[-35deg] animate-[shimmer_8s_infinite_ease-in-out]" />
      </div>
    </button>
  );
}
