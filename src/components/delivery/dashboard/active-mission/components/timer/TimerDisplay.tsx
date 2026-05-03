
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
 * AJUSTE CRÍTICO: Reducción de escala para evitar desbordamiento en tiempos largos.
 */
export function TimerDisplay({ hours, minutes, seconds, isExpired, pulseColor }: TimerDisplayProps) {
  // Ajuste dinámico de tamaño según la cantidad de dígitos en las horas
  const isLargeTimer = hours >= 100;

  return (
    <div className="flex items-baseline justify-center gap-1 sm:gap-2 w-full px-2 overflow-hidden">
      <span className={cn(
        "font-black italic tracking-tighter tabular-nums leading-none transition-colors duration-500",
        isLargeTimer ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl",
        pulseColor === 'green' ? "text-green-600" : 
        pulseColor === 'red' ? "text-red-600" : 
        isExpired ? "text-red-600" : "text-slate-900"
      )}>
        {isExpired && "-"}{hours}:{minutes < 10 ? `0${minutes}` : minutes}
      </span>
      <span className={cn(
        "text-[10px] sm:text-sm font-black uppercase tracking-widest self-end mb-1 shrink-0",
        isExpired ? "text-red-600" : "text-amber-600"
      )}>
        {seconds < 10 ? `0${seconds}` : seconds}s
      </span>
    </div>
  );
}
