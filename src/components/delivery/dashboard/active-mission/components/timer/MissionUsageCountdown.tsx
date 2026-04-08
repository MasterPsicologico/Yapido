
"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Wallet, AlertCircle, Clock, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionUsageCountdownProps {
  progress: {
    hours: number;
    minutes: number;
    seconds: number;
    percentage: number;
    expiryLabel: string;
    isExpired: boolean;
    dropOffTime?: string;
    originalExpiry?: string;
  };
  onAddHours: (hours: number) => void;
  onRemoveHour?: () => void;
}

/**
 * MissionUsageCountdown - Cronómetro Maestro con Historial y Respuesta Háptica Visual.
 */
export function MissionUsageCountdown({ progress, onAddHours, onRemoveHour }: MissionUsageCountdownProps) {
  const [pulseColor, setPulseColor] = useState<'none' | 'green' | 'red'>('none');

  const handleAction = (isAdd: boolean) => {
    setPulseColor(isAdd ? 'green' : 'red');
    if (isAdd) onAddHours(1);
    else onRemoveHour?.();
    
    setTimeout(() => setPulseColor('none'), 1500);
  };

  return (
    <section className="animate-in zoom-in duration-500">
      <Card className={cn(
        "border-none rounded-[48px] p-8 shadow-2xl relative overflow-hidden ring-8 transition-all duration-700",
        pulseColor === 'green' ? "ring-green-500/40 bg-green-950" : 
        pulseColor === 'red' ? "ring-red-500/40 bg-red-950" :
        progress.isExpired ? "bg-red-950 text-white ring-red-500/30" : "bg-slate-950 text-white ring-amber-500/20"
      )}>
        <div className={cn(
          "absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -mr-24 -mt-24 transition-colors",
          pulseColor === 'green' ? "bg-green-500/20" :
          pulseColor === 'red' ? "bg-red-500/20" :
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
              "text-7xl font-black italic tracking-tighter tabular-nums leading-none transition-colors",
              pulseColor === 'green' ? "text-green-400" : pulseColor === 'red' ? "text-red-400" : progress.isExpired ? "text-red-500" : "text-white"
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

          {/* HISTORIAL DE TIEMPOS MAESTRO */}
          <div className="w-full grid grid-cols-2 gap-4 py-4 border-y border-white/5">
            <div className="text-center space-y-1">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Hora de Entrega</p>
              <div className="flex items-center justify-center gap-2 text-slate-300">
                <CalendarCheck className="w-3 h-3 text-primary" />
                <span className="text-[11px] font-black italic">{progress.dropOffTime || '--:--'}</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Recogida Programada</p>
              <div className="flex items-center justify-center gap-2 text-slate-300">
                <Clock className="w-3 h-3 text-orange-500" />
                <span className="text-[11px] font-black italic">{progress.originalExpiry || '--:--'}</span>
              </div>
            </div>
          </div>

          {/* BARRA DE PROGRESO */}
          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
            <div 
              className={cn(
                "h-full transition-all duration-1000",
                pulseColor === 'green' ? "bg-green-500" :
                pulseColor === 'red' ? "bg-red-500" :
                progress.isExpired ? "bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]" : "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              )} 
              style={{ width: `${progress.percentage}%` }} 
            />
          </div>

          {/* CONTROLES DE AJUSTE TEMPORAL */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button 
              onClick={() => handleAction(false)}
              variant="outline"
              className="h-14 rounded-2xl border-white/5 bg-white/5 text-white/40 font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95"
            >
              <Minus className="w-4 h-4" /> QUITAR HORA
            </Button>
            <Button 
              onClick={() => handleAction(true)}
              variant="outline"
              className="h-14 rounded-2xl border-white/10 bg-white/5 text-white font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-green-500/10 hover:text-green-500 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> AÑADIR HORA
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
