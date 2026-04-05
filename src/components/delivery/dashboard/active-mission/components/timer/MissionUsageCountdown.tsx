
"use client";

import { Card } from '@/components/ui/card';

interface MissionUsageCountdownProps {
  progress: {
    hours: number;
    minutes: number;
    seconds: number;
    percentage: number;
    expiryLabel: string;
  };
}

export function MissionUsageCountdown({ progress }: MissionUsageCountdownProps) {
  return (
    <section className="animate-in zoom-in duration-500">
      <Card className="border-none rounded-[40px] bg-slate-950 text-white p-8 shadow-2xl relative overflow-hidden ring-4 ring-amber-500/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic animate-pulse">
            TIEMPO RESTANTE
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-7xl font-black italic tracking-tighter tabular-nums leading-none">
              {progress.hours}:{progress.minutes < 10 ? `0${progress.minutes}` : progress.minutes}
            </span>
            <span className="text-sm font-black text-amber-500 uppercase tracking-widest">
              {progress.seconds < 10 ? `0${progress.seconds}` : progress.seconds}s
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-amber-500 transition-all duration-1000 shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
              style={{ width: `${progress.percentage}%` }} 
            />
          </div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Recoger a las <span className="text-white">{progress.expiryLabel}</span>
          </p>
        </div>
      </Card>
    </section>
  );
}
