
"use client";

import { Waves, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WasherSolicitationHeaderProps {
  isAdmin: boolean;
  onOpenAdminSettings: () => void;
  onClose: () => void;
}

/**
 * Función Aislada: Cabecera de Solicitud Élite
 * Mandamiento #1: Diseño dinámico, interactivo y con tipografía dorada de alta gama.
 * REVISIÓN: Ajuste quirúrgico de posición vertical para evitar desbordes superiores (Push down).
 */
export function WasherSolicitationHeader({ isAdmin, onOpenAdminSettings, onClose }: WasherSolicitationHeaderProps) {
  return (
    <div className="h-24 sm:h-28 bg-[#050505] flex items-center justify-between px-6 shrink-0 relative overflow-hidden border-b border-yellow-500/10 z-10">
      
      {/* CAPA 1: FONDO DINÁMICO (Gradiente de Pulso) */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse [animation-duration:4s]" />
      
      {/* CAPA 2: EFECTO SHIMMER (Ráfaga de Luz) */}
      <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer pointer-events-none opacity-30" />

      {/* SECCIÓN IZQUIERDA: MANDO DE ADMINISTRADOR (ONDAS) */}
      <div className="relative z-10 shrink-0">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (isAdmin) onOpenAdminSettings();
          }}
          className={cn(
            "w-12 h-12 rounded-[18px] flex items-center justify-center border transition-all duration-500 shadow-[0_0_30px_rgba(234,179,8,0.1)] group",
            isAdmin 
              ? "bg-gradient-to-br from-yellow-400 to-yellow-700 border-yellow-500/50 text-white hover:scale-110 active:scale-95 shadow-yellow-500/20" 
              : "bg-white/5 border-white/10 text-white/20 cursor-default"
          )}
        >
          <Waves className={cn("w-6 h-6", isAdmin ? "text-white animate-pulse" : "text-white/20")} />
          {isAdmin && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#050505] animate-bounce" />
          )}
        </button>
      </div>

      {/* SECCIÓN CENTRAL: TIPOGRAFÍA DORADA MAESTRA - OBLIGADA HACIA ABAJO */}
      <div className="flex-1 px-4 text-center relative z-10 flex flex-col justify-center items-center pt-6">
        <h3 className={cn(
          "font-black italic uppercase tracking-tighter leading-[0.85] text-base sm:text-xl",
          "text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207]",
          "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-in slide-in-from-top-4 duration-1000"
        )}>
          SOLICITUD DE <br />
          <span className="text-lg sm:text-2xl">ALQUILER DE LAVADORA</span>
        </h3>
        
        <div className="flex items-center gap-2 mt-1 opacity-60">
          <div className="h-[1px] w-3 bg-yellow-500/50" />
          <p className="text-yellow-500 font-black text-[6px] sm:text-[7px] uppercase tracking-[0.4em] whitespace-nowrap">
            SISTEMA ÉLITE • SINCRONIZADO
          </p>
          <div className="h-[1px] w-3 bg-yellow-500/50" />
        </div>
      </div>
      
      {/* SECCIÓN DERECHA: BOTÓN DE CIERRE (X) QUIRÚRGICO */}
      <div className="flex items-center gap-3 relative z-10 shrink-0">
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-2xl flex items-center justify-center text-white border border-white/20 hover:bg-red-500 hover:text-white hover:border-red-600 transition-all active:scale-90 shadow-2xl group"
        >
          <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
        </button>
      </div>

      {/* PARTÍCULAS DECORATIVAS */}
      <Sparkles className="absolute top-2 right-1/4 w-4 h-4 text-yellow-500/20 animate-pulse" />
      <Sparkles className="absolute bottom-2 left-1/4 w-3 h-3 text-yellow-500/10 animate-pulse [animation-delay:1s]" />
    </div>
  );
}
