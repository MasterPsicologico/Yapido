
"use client";

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerHeroProps {
  isAssigned: boolean;
  timeLeft: number | null;
  minutes: number;
  seconds: number;
}

/**
 * TimerHero - El Cronómetro Maestro de la Sala de Espera.
 * Representa la urgencia y el estado de la búsqueda.
 */
export function TimerHero({ isAssigned, timeLeft, minutes, seconds }: TimerHeroProps) {
  return (
    <header className="text-center space-y-6">
      <div className="flex justify-center">
        <div className={cn(
          "relative p-8 rounded-[48px] bg-slate-900 text-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-b-8 border-slate-950 transition-all duration-500",
          isAssigned ? "bg-green-600 border-green-800" : (timeLeft !== null && timeLeft < 60) ? "bg-red-600 border-red-800" : ""
        )}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full font-black text-[8px] uppercase tracking-[0.3em]">
            {isAssigned ? "SISTEMA VINCULADO" : "TIEMPO DE RESPUESTA"}
          </div>
          <div className="flex items-center gap-6">
            <Clock className={cn("w-10 h-10", isAssigned ? "text-white" : "text-primary animate-pulse")} />
            <span className="text-6xl font-black italic tracking-tighter tabular-nums">
              {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </span>
          </div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-4">
            {isAssigned ? "REPARTIDOR EN CAMINO" : "RECIBIRÁS UNA CONFIRMACIÓN AL FINALIZAR"}
          </p>
        </div>
      </div>
    </header>
  );
}
