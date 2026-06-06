
"use client";

import { CalendarCheck, Clock } from 'lucide-react';

interface TimerHistoryProps {
  dropOffTime?: string;
  originalExpiry?: string;
}

/**
 * TimerHistory - Componente Atómico: Registro de metadatos temporales.
 * Ajustado para fondo blanco.
 */
export function TimerHistory({ dropOffTime, originalExpiry }: TimerHistoryProps) {
  return (
    <div className="w-full grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
      <div className="text-center space-y-1">
        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Hora de Entrega</p>
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <CalendarCheck className="w-3 h-3 text-primary" />
          <span className="text-[11px] font-black italic">{dropOffTime || '--:--'}</span>
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Recogida Programada</p>
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <Clock className="w-3 h-3 text-orange-500" />
          <span className="text-[11px] font-black italic">{originalExpiry || '--:--'}</span>
        </div>
      </div>
    </div>
  );
}
