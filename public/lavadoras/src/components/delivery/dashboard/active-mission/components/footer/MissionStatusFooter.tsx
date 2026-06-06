
"use client";

import { ShieldCheck } from 'lucide-react';

export function MissionStatusFooter() {
  return (
    <div className="shrink-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Protocolo Operativo Activo
          </span>
        </div>
        <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-green-500 animate-progress-loading" />
        </div>
      </div>
    </div>
  );
}
