
"use client";

import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  pulseColor: 'none' | 'green' | 'red';
}

/**
 * TimerDisplay - Componente Atómico: El núcleo visual del tiempo.
 * Ajustado para fondo blanco con tipografía Slate-900.
 */
export function TimerDisplay({ hours, minutes, seconds, isExpired, pulseColor }: TimerDisplayProps) {
  return (
    <div className="flex flex-baseline gap-2">
      <span className={cn(
        "text-7xl font-black italic tracking-tighter tabular-nums leading-none transition-colors duration-500",
        pulseColor === 'green' ? "text-green-600" : 
        pulseColor === 'red' ? "text-red-600" : 
        isExpired ? "text-red-600" : "text-slate-900"
      )}>
        {isExpired && "-"}{hours}:{minutes < 10 ? `0${minutes}` : minutes}
      </span>
      <span className={cn(
        "text-sm font-black uppercase tracking-widest self-end mb-1",
        isExpired ? "text-red-600" : "text-amber-600"
      )}>
        {seconds < 10 ? `0${seconds}` : seconds}s
      </span>
    </div>
  );
}
