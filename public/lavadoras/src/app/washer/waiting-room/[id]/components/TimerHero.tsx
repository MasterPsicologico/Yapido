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
 * TimerHero — Cronómetro elegante y liviano para la sala de espera.
 * Reemplazado el slab oscuro por una superficie clara con acentos suaves.
 */
export function TimerHero({ isAssigned, timeLeft, minutes, seconds }: TimerHeroProps) {
  const isUrgent = !isAssigned && timeLeft !== null && timeLeft < 60;

  const accentText = isAssigned
    ? 'text-emerald-600'
    : isUrgent
      ? 'text-red-600'
      : 'text-primary';

  const accentRing = isAssigned
    ? 'ring-emerald-200/60'
    : isUrgent
      ? 'ring-red-200/60'
      : 'ring-primary/20';

  return (
    <header className="text-center">
      <div className="mx-auto max-w-sm">
        <div
          className={cn(
            "relative rounded-3xl bg-white/90 backdrop-blur px-6 py-7 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1",
            accentRing
          )}
        >
          {/* Pill superior */}
          <div className="flex justify-center mb-4">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em]",
                isAssigned
                  ? "bg-emerald-50 text-emerald-700"
                  : isUrgent
                    ? "bg-red-50 text-red-700"
                    : "bg-primary/10 text-primary"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isAssigned ? "bg-emerald-500" : isUrgent ? "bg-red-500" : "bg-primary"
                )}
              />
              {isAssigned ? "Sistema vinculado" : "Tiempo de respuesta"}
            </span>
          </div>

          {/* Cronómetro */}
          <div className="flex items-center justify-center gap-3">
            <Clock
              className={cn(
                "h-6 w-6",
                accentText,
                !isAssigned && "animate-pulse"
              )}
            />
            <span
              className={cn(
                "text-5xl font-black italic tabular-nums tracking-tight leading-none",
                accentText
              )}
            >
              {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </span>
          </div>

          {/* Subtítulo */}
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {isAssigned
              ? "Repartidor en camino"
              : "Recibirás una confirmación al finalizar"}
          </p>
        </div>
      </div>
    </header>
  );
}
