
"use client";

import { ArrowUpCircle, Activity, Clock } from 'lucide-react';

interface RouteStatsProps {
  floor: string;
}

export function RouteStats({ floor }: RouteStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 border-t border-slate-200/50 pt-5">
      <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/50 border border-slate-100">
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
          <ArrowUpCircle className="w-4 h-4" />
        </div>
        <div className="text-center">
          <p className="text-[7px] font-black text-slate-400 uppercase">Piso</p>
          <p className="text-xs font-black text-slate-700 leading-none">{floor || '1'}</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/50 border border-slate-100">
        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
          <Activity className="w-4 h-4" />
        </div>
        <div className="text-center">
          <p className="text-[7px] font-black text-slate-400 uppercase">Distancia</p>
          <p className="text-xs font-black text-slate-700 leading-none">2.4 KM</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/50 border border-slate-100">
        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
          <Clock className="w-4 h-4" />
        </div>
        <div className="text-center">
          <p className="text-[7px] font-black text-slate-400 uppercase">Tiempo</p>
          <p className="text-xs font-black text-slate-700 leading-none">~15 min</p>
        </div>
      </div>
    </div>
  );
}
