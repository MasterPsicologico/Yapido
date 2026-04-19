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
 * SolicitationHeader - Terminal de Identidad y Mando de Solicitudes.
 * ACTUALIZACIÓN: Textos de seguridad y estética de mando industrial con forma especial.
 */
export function SolicitationHeader({ isAdmin, onOpenAdminSettings, onClose }: SolicitationHeaderProps) {
  return (
    <div className="min-h-[140px] bg-[#050505] flex items-center justify-between px-6 shrink-0 relative overflow-hidden border-b border-yellow-500/20 z-10 py-6">
      {/* CAPA ATMOSFÉRICA DORADA */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse [animation-duration:6s]" />
      
      {/* DETALLES GEOMÉTRICOS "FORMA ESPECIAL" */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50 shadow-[0_0_20px_rgba(234,179,8,0.8)]" />
      <div className="absolute top-0 left-1/4 w-px h-full bg-white/5 -skew-x-12" />
      <div className="absolute top-0 right-1/4 w-px h-full bg-white/5 skew-x-12" />

      {/* Mando de Administrador (Ondas) */}
      <div className="relative z-10 shrink-0">
        <AdminQuickSettings isAdmin={isAdmin} onOpen={onOpenAdminSettings} />
      </div>

      {/* Título Dorado Actualizado: FORMULARIO DE SOLICITUD */}
      <div className="flex-1 px-2 text-center relative z-10 flex flex-col items-center">
        <DialogHeader className="p-0 space-y-0 text-center items-center">
          <DialogTitle className={cn(
            "font-black italic uppercase tracking-tighter leading-[0.9] text-base sm:text-lg",
            "text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207]",
            "drop-shadow-[0_4px_12px_rgba(0,0,0,1)]"
          )}>
            FORMULARIO DE <br />
            <span className="text-2xl sm:text-3xl md:text-4xl block mt-0.5">SOLICITUD</span>
          </DialogTitle>
          <DialogDescription className="text-yellow-500/80 font-black text-[7px] sm:text-[8px] uppercase tracking-[0.3em] sm:tracking-[0.4em] mt-3 italic flex items-center justify-center gap-2 sm:gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,1)] shrink-0" />
            <span className="whitespace-nowrap">SERVICIO SEGURO Y CONFIABLE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,1)] shrink-0" />
          </DialogDescription>
        </DialogHeader>
      </div>
      
      {/* Botón de Cierre X */}
      <div className="relative z-10 shrink-0">
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-3xl flex items-center justify-center text-white/40 border border-white/10 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/40 transition-all active:scale-90 shadow-2xl group"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        </button>
      </div>
    </div>
  );
}