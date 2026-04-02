
"use client";

import { Waves, X, GitBranch } from 'lucide-react';

interface WasherSolicitationHeaderProps {
  isAdmin: boolean;
  onOpenAdminSettings: () => void;
  onClose: () => void;
}

/**
 * Función Aislada: Encabezado de Solicitud con Mando Admin
 * Mandamiento #1: Iconografía y estilos sincronizados con la interfaz del usuario.
 */
export function WasherSolicitationHeader({ isAdmin, onOpenAdminSettings, onClose }: WasherSolicitationHeaderProps) {
  return (
    <div className="h-24 bg-slate-950 flex items-center justify-between px-6 shrink-0 border-b border-white/5 relative z-10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary shadow-inner">
          <Waves className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-white font-black uppercase italic tracking-tighter text-3xl leading-none">NUEVA SOLICITUD</h3>
          <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.4em] mt-1">SISTEMA INTELIGENTE</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isAdmin && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onOpenAdminSettings();
            }} 
            className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30 hover:bg-primary/30 transition-all shadow-lg active:scale-90"
            title="Ajustes de Administrador"
          >
            <GitBranch className="w-6 h-6" />
          </button>
        )}
        <button 
          onClick={onClose} 
          className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all active:scale-90"
        >
          <X className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
