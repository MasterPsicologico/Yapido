
"use client";

import { CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export function ChallengeHeader() {
  return (
    <CardHeader className="p-8 pb-2">
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Reto de la Semana</p>
        <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
          <TrendingUp className="text-primary w-7 h-7" /> Rendimiento
        </CardTitle>
      </div>
    </CardHeader>
  );
}
