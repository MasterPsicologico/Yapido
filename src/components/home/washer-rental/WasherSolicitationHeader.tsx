"use client";

import { Waves, X } from 'lucide-react';

interface WasherSolicitationHeaderProps {
  isAdmin: boolean;
  onOpenAdminSettings: () => void;
  onClose: () => void;
}

function Settings2Icon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
    </svg>
  );
}

export function WasherSolicitationHeader({ isAdmin, onOpenAdminSettings, onClose }: WasherSolicitationHeaderProps) {
  return (
    <div className="h-20 bg-slate-950 flex items-center justify-between px-6 shrink-0 border-b border-white/5">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
          <Waves className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-white font-black uppercase italic tracking-tighter text-2xl leading-none">NUEVA SOLICITUD</h3>
          <p className="text-primary/60 text-[9px] font-black uppercase tracking-[0.3em] mt-1">SISTEMA INTELIGENTE</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <button 
            onClick={onOpenAdminSettings} 
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-primary transition-all"
          >
            <Settings2Icon className="w-5 h-5" />
          </button>
        )}
        <button 
          onClick={onClose} 
          className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
