
"use client";

import { Navigation, Sparkles } from 'lucide-react';

export function LogisticsEmpty() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-20">
      <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6 relative">
        <Navigation className="w-12 h-12 text-slate-200" />
        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary/30 animate-pulse" />
      </div>
      <h3 className="text-2xl font-black text-slate-300 italic uppercase tracking-tighter text-center">
        Sin Operaciones
      </h3>
      <p className="text-slate-300 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 text-center max-w-xs">
        El orquestador logístico está listo. Las órdenes aparecerán aquí en tiempo real.
      </p>
    </div>
  );
}
