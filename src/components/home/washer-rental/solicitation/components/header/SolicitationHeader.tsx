
"use client";

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminQuickSettings } from './AdminQuickSettings';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface SolicitationHeaderProps {
  isAdmin: boolean;
  onOpenAdminSettings: () => void;
  onClose: () => void;
}

/**
 * SolicitationHeader - Cabecera Flexible para evitar desbordamientos.
 * Ajuste: Estructura de min-height y padding dinámico.
 */
export function SolicitationHeader({ isAdmin, onOpenAdminSettings, onClose }: SolicitationHeaderProps) {
  return (
    <div className="min-h-[120px] bg-[#050505] flex items-center justify-between px-6 shrink-0 relative overflow-hidden border-b border-yellow-500/10 z-10 py-4">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse [animation-duration:4s]" />
      <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer pointer-events-none opacity-30" />

      {/* Mando de Administrador (Ondas) */}
      <div className="relative z-10 shrink-0">
        <AdminQuickSettings isAdmin={isAdmin} onOpen={onOpenAdminSettings} />
      </div>

      {/* Título Dorado Maestro - Ajustado para evitar desbordamiento superior */}
      <div className="flex-1 px-2 text-center relative z-10 flex flex-col justify-center items-center">
        <DialogHeader className="p-0 space-y-0 text-center items-center">
          <DialogTitle className={cn(
            "font-black italic uppercase tracking-tighter leading-[0.9] text-lg sm:text-2xl",
            "text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207]",
            "drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          )}>
            SOLICITUD DE <br />
            <span className="text-xl sm:text-2xl md:text-3xl">ALQUILER DE LAVADORA</span>
          </DialogTitle>
          <DialogDescription className="text-yellow-500 font-black text-[7px] uppercase tracking-[0.4em] mt-1 opacity-60">
            SISTEMA ÉLITE • SINCRONIZADO
          </DialogDescription>
        </DialogHeader>
      </div>
      
      {/* Botón de Cierre X */}
      <div className="relative z-10 shrink-0">
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
