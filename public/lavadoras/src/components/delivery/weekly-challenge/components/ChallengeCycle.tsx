
"use client";

import { Timer, CalendarClock } from 'lucide-react';

export function ChallengeCycle() {
  return (
    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-4 h-4 text-slate-400" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Cierre de Ciclo</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Timer className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
        <span className="text-[11px] font-black text-slate-700 italic uppercase">Domingo 23:59</span>
      </div>
    </div>
  );
}
