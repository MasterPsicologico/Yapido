
"use client";

import { Waves, X, GitBranch, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WasherSolicitationHeaderProps {
  isAdmin: boolean;
  onOpenAdminSettings: () => void;
  onClose: () => void;
}

/**
 * Función Aislada: Cabecera de Solicitud Élite
 * Mandamiento #1: Diseño dinámico, interactivo y con tipografía dorada de alta gama.
 * Aislamiento total en archivo único para evitar alteraciones por error.
 */
export function WasherSolicitationHeader({ isAdmin, onOpenAdminSettings, onClose }: WasherSolicitationHeaderProps) {
  return (
    <div className="h-24 sm:h-28 bg-[#050505] flex items-center justify-between px-6 shrink-0 relative overflow-hidden border-b border-yellow-500/10 z-10">
      
      {/* CAPA 1: FONDO DINÁMICO (Gradiente de Pulso) */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse [animation-duration:4s]" />
      
      {/* CAPA 2: EFECTO SHIMMER (Ráfaga de Luz) */}
      <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer pointer-events-none opacity-30" />

      {/* SECCIÓN IZQUIERDA: ICONO DE IDENTIDAD */}
      <div className="relative z-10 shrink-0">
        <div className="w-12 h-12 rounded-[20px] bg-gradient-to-br from-yellow-400/20 to-yellow-700/20 flex items-center justify-center border border-yellow-500/30 shadow-[0_0_25px_rgba(234,179,8,0.15)] group hover:scale-110 transition-transform duration-500">
          <Waves className="w-6 h-6 text-yellow-500 animate-pulse" />
        </div>
      </div>

      {/* SECCIÓN CENTRAL: TIPOGRAFÍA DORADA MAESTRA (Ocupa todo el espacio) */}
      <div className="flex-1 px-4 text-center relative z-10 flex flex-col justify-center items-center">
        <h3 className={cn(
          "font-black italic uppercase tracking-tighter leading-[0.85] text-lg sm:text-2xl",
          "text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207]",
          "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-in slide-in-from-top-4 duration-1000"
        )}>
          SOLICITUD DE <br />
          <span className="text-xl sm:text-3xl">ALQUILER DE LAVADORA</span>
        </h3>
        
        <div className="flex items-center gap-2 mt-1.5 opacity-60">
          <div className="h-[1px] w-4 bg-yellow-500/50" />
          <p className="text-yellow-500 font-black text-[7px] sm:text-[8px] uppercase tracking-[0.4em] whitespace-nowrap">
            SISTEMA ÉLITE • SINCRONIZADO
          </p>
          <div className="h-[1px] w-4 bg-yellow-500/50" />
        </div>
      </div>
      
      {/* SECCIÓN DERECHA: MANDOS DE CONTROL (Estilo Cristal) */}
      <div className="flex items-center gap-3 relative z-10">
        {isAdmin && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onOpenAdminSettings();
            }} 
            className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all active:scale-90 shadow-xl"
            title="Ajustes de Administrador"
          >
            <GitBranch className="w-5 h-5" />
          </button>
        )}
        
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center text-white/30 border border-white/10 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 transition-all active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* PARTÍCULAS DECORATIVAS */}
      <Sparkles className="absolute top-2 right-1/4 w-4 h-4 text-yellow-500/20 animate-pulse" />
      <Sparkles className="absolute bottom-2 left-1/4 w-3 h-3 text-yellow-500/10 animate-pulse [animation-delay:1s]" />
    </div>
  );
}
