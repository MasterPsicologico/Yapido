
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
 * NavbarModeSwitcher - Terminal de Conmutación Elongada Premium v2.0.
 * Rediseñado con fondo inmersivo y lógica de destino directa.
 */
export function NavbarModeSwitcher({ isDeliveryZone, isTransitioning, progress, onSwitch }: NavbarModeSwitcherProps) {
  // EL DESTINO ES EL PROTAGONISTA: El usuario debe ver a dónde va a ir.
  const targetLabel = isDeliveryZone ? "VITRINAS" : "DELIVERY";
  const iconColor = isDeliveryZone ? "text-secondary" : "text-primary";

  return (
    <button 
      type="button"
      className={cn(
        "relative flex items-center h-10 sm:h-11 rounded-2xl cursor-pointer transition-all duration-500 px-1 overflow-hidden min-w-[150px] sm:min-w-[170px] shadow-2xl border-none outline-none group",
        isDeliveryZone 
          ? "bg-slate-900 border-b-2 border-secondary/30" 
          : "bg-[#050505] border-b-2 border-primary/30",
        isTransitioning && "pointer-events-none"
      )}
      onClick={(e) => {
        e.preventDefault();
        onSwitch();
      }}
    >
      {/* CAPA DE FONDO INMERSIVO (Efecto de Imagen Técnica) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br",
          isDeliveryZone ? "from-secondary/40 to-transparent" : "from-primary/40 to-transparent"
        )} />
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/tech/400/100')] bg-cover opacity-10 mix-blend-overlay" />
      </div>

      {/* CAPA DE PROGRESO DE CRISTAL (DURANTE TRANSICIÓN) */}
      {isTransitioning && (
        <div 
          className={cn(
            "absolute inset-0 transition-all duration-100 ease-linear opacity-40 z-10", 
            isDeliveryZone ? "bg-secondary" : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
      )}

      {/* ICONO IDENTITARIO TÁCTICO */}
      <div className={cn(
        "relative z-20 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xl transition-all duration-500 shrink-0",
        isDeliveryZone ? "bg-slate-800" : "bg-slate-900",
        isTransitioning ? "scale-90 rotate-180" : "group-hover:scale-110 group-hover:rotate-12"
      )}>
        {isTransitioning ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isDeliveryZone ? (
          <Store className="w-4 h-4 text-secondary" />
        ) : (
          <Zap className="w-4 h-4 text-primary fill-current animate-pulse" />
        )}
      </div>
      
      {/* TEXTO ELONGADO DE ALTA GAMA */}
      <div className="relative z-20 flex flex-col items-start ml-3 text-left">
        <span className={cn(
          "text-[7px] font-black uppercase tracking-[0.4em] leading-none opacity-40 mb-0.5",
          isDeliveryZone ? "text-secondary" : "text-primary"
        )}>
          {isTransitioning ? "SINCRONIZANDO" : "IR A SECCIÓN"}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "text-[11px] font-black uppercase tracking-[0.15em] transition-all italic leading-none",
            "text-white",
            isTransitioning && "animate-pulse"
          )}>
            {targetLabel}
          </span>
          {!isTransitioning && (
            <ChevronRight className={cn("w-3 h-3 transition-transform group-hover:translate-x-1", iconColor)} />
          )}
        </div>
      </div>

      {/* Brillo Premium de Barrido Constante */}
      <div className="absolute inset-0 z-30 pointer-events-none opacity-30">
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-35deg] animate-[shimmer_6s_infinite_ease-in-out]" />
      </div>
    </button>
  );
}
