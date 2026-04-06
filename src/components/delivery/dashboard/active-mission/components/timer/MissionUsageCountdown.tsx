
"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wallet, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionUsageCountdownProps {
  progress: {
    hours: number;
    minutes: number;
    seconds: number;
    percentage: number;
    expiryLabel: string;
    isExpired: boolean;
  };
  onAddHours: (hours: number) => void;
}

export function MissionUsageCountdown({ progress, onAddHours }: MissionUsageCountdownProps) {
  return (
    <section className="animate-in zoom-in duration-500">
      <Card className={cn(
        "border-none rounded-[48px] p-8 shadow-2xl relative overflow-hidden ring-8 transition-colors duration-1000",
        progress.isExpired 
          ? "bg-red-950 text-white ring-red-500/30" 
          : "bg-slate-950 text-white ring-amber-500/20"
      )}>
        <div className={cn(
          "absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -mr-24 -mt-24 transition-colors",
          progress.isExpired ? "bg-red-500/20" : "bg-amber-500/10"
        )} />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="flex flex-col items-center gap-2">
            {progress.isExpired ? (
              <div className="flex items-center gap-2 bg-red-600 px-4 py-1.5 rounded-full animate-pulse">
                <AlertCircle className="w-4 h-4 text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">TIEMPO AGOTADO</span>
              </div>
            ) : (
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic">
                TIEMPO DE USO ACTIVO
              </p>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-7xl font-black italic tracking-tighter tabular-nums leading-none",
              progress.isExpired && "text-red-500"
            )}>
              {progress.hours}:{progress.minutes < 10 ? `0${progress.minutes}` : progress.minutes}
            </span>
            <span className={cn(
              "text-sm font-black uppercase tracking-widest",
              progress.isExpired ? "text-red-500" : "text-amber-500"
            )}>
              {progress.seconds < 10 ? `0${progress.seconds}` : progress.seconds}s
            </span>
          </div>

          {/* BARRA DE PROGRESO */}
          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
            <div 
              className={cn(
                "h-full transition-all duration-1000",
                progress.isExpired ? "bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]" : "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              )} 
              style={{ width: `${progress.percentage}%` }} 
            />
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" /> Termina: <span className="text-white">{progress.expiryLabel}</span>
            </div>
          </div>

          {/* BOTÓN DE ADICIÓN DE HORAS */}
          <div className="pt-2 w-full">
            <Button 
              onClick={() => onAddHours(1)}
              variant="outline"
              className="w-full h-14 rounded-3xl border-white/10 bg-white/5 text-white font-black uppercase text-xs tracking-widest gap-3 hover:bg-white/10 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5 text-primary" /> AÑADIR HORA ADICIONAL
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
