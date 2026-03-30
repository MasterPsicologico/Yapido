
"use client";

import { Star, Timer } from 'lucide-react';

export function ChallengeStats() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* CUADRANTE PROMEDIO */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center text-center sm:flex-row sm:text-left gap-3 shadow-sm overflow-hidden min-w-0">
        <div className="w-10 h-10 bg-yellow-50 rounded-2xl flex items-center justify-center shrink-0">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-1">Promedio</p>
          <p className="text-xl font-black italic text-slate-900 tracking-tighter leading-none">5.0</p>
        </div>
      </div>

      {/* CUADRANTE ESTADO */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center text-center sm:flex-row sm:text-left gap-3 shadow-sm overflow-hidden min-w-0">
        <div className="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center shrink-0">
          <Timer className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-1">Estado</p>
          <p className="text-sm font-black italic text-primary tracking-tighter uppercase leading-none break-words">ACTIVO</p>
        </div>
      </div>
    </div>
  );
}
