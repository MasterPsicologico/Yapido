
"use client";

import { Waves, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WasherSolicitationHeaderProps {
  isAdmin: boolean;
  onOpenAdminSettings: () => void;
  onClose: () => void;
}

export function WasherSolicitationHeader({ isAdmin, onOpenAdminSettings, onClose }: WasherSolicitationHeaderProps) {
  return (
    <div className="h-28 bg-[#050505] flex items-center justify-between px-6 shrink-0 relative overflow-hidden border-b border-yellow-500/10 z-10">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse [animation-duration:4s]" />
      <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer pointer-events-none opacity-30" />

      {/* Mando de Administrador (Ondas) */}
      <div className="relative z-10">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (isAdmin) onOpenAdminSettings();
          }}
          className={cn(
            "w-12 h-12 rounded-[18px] flex items-center justify-center border transition-all duration-500 shadow-lg group",
            isAdmin 
              ? "bg-gradient-to-br from-yellow-400 to-yellow-700 border-yellow-500/50 text-white hover:scale-110 active:scale-95" 
              : "bg-white/5 border-white/10 text-white/20 cursor-default"
          )}
        >
          <Waves className={cn("w-6 h-6", isAdmin ? "text-white animate-pulse" : "text-white/20")} />
        </button>
      </div>

      {/* Título Dorado Maestra - Bajado con pt-6 */}
      <div className="flex-1 px-4 text-center relative z-10 flex flex-col justify-center items-center pt-6">
        <h3 className={cn(
          "font-black italic uppercase tracking-tighter leading-[0.85] text-lg sm:text-2xl",
          "text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207]",
          "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
        )}>
          SOLICITUD DE <br />
          <span className="text-xl sm:text-3xl">ALQUILER DE LAVADORA</span>
        </h3>
        <p className="text-yellow-500 font-black text-[7px] uppercase tracking-[0.4em] mt-1 opacity-60">SISTEMA ÉLITE • SINCRONIZADO</p>
      </div>
      
      {/* Botón de Cierre X */}
      <div className="relative z-10">
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-2xl flex items-center justify-center text-white border border-white/20 hover:bg-red-500 transition-all active:scale-90 shadow-2xl group"
        >
          <X className="w-5 h-5 group-hover:rotate-90" />
        </button>
      </div>
    </div>
  );
}
