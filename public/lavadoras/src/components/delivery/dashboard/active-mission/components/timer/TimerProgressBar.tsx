
"use client";

import { cn } from '@/lib/utils';

interface TimerProgressBarProps {
  percentage: number;
  isExpired: boolean;
  pulseColor: 'none' | 'green' | 'red';
}

/**
 * TimerProgressBar - Componente Atómico: Barra de consumo de energía.
 * Ajustado para fondo blanco.
 */
export function TimerProgressBar({ percentage, isExpired, pulseColor }: TimerProgressBarProps) {
  return (
    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
      <div 
        className={cn(
          "h-full transition-all duration-1000",
          pulseColor === 'green' ? "bg-green-500" :
          pulseColor === 'red' ? "bg-red-500" :
          isExpired ? "bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]" : "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
        )} 
        style={{ width: `${percentage}%` }} 
      />
    </div>
  );
}
