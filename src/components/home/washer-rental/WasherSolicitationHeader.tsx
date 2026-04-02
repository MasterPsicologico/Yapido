
"use client";

import { Waves, X, GitBranch } from 'lucide-react';

interface WasherSolicitationHeaderProps {
  isAdmin: boolean;
  onOpenAdminSettings: () => void;
  onClose: () => void;
}

/**
 * Función Aislada: Cabecera de Solicitud Remodelada
 * Mandamiento #1: Diseño ultra-limpio con tipografía pequeña para evitar desbordes.
 */
export function WasherSolicitationHeader({ isAdmin, onOpenAdminSettings, onClose }: WasherSolicitationHeaderProps) {
  return (
    <div className="h-20 bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 border-b border-white/5 relative z-10">
      {/* Sección Izquierda: Identidad Visual */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <Waves className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-white font-black uppercase italic tracking-tight text-lg leading-tight">
            NUEVA SOLICITUD
          </h3>
          <p className="text-primary/70 font-black text-[8px] uppercase tracking-[0.3em] mt-0.5">
            SISTEMA INTELIGENTE
          </p>
        </div>
      </div>
      
      {/* Sección Derecha: Mandos de Control */}
      <div className="flex items-center gap-3">
        {isAdmin && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onOpenAdminSettings();
            }} 
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 hover:bg-primary/20 transition-all active:scale-95 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            title="Ajustes de Administrador"
          >
            <GitBranch className="w-5 h-5" />
          </button>
        )}
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 border border-white/10 hover:text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
