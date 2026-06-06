
"use client";

import { Clock, Loader2 } from 'lucide-react';

interface SuccessProtocolProps {
  countdown: number;
}

export function SuccessProtocol({ countdown }: SuccessProtocolProps) {
  return (
    <div className="space-y-6 mt-4 animate-in zoom-in fade-in duration-500">
      <div className="relative p-8 rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-2 border-primary/20 bg-slate-900 transition-all duration-1000">
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-primary/5 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-[24px] bg-primary/20 flex items-center justify-center shadow-xl">
            <Clock className="w-8 h-8 text-primary animate-pulse" />
          </div>

          <div className="space-y-3">
            <h4 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
              ¡Pedido Enviado!
            </h4>
            <p className="text-sm font-bold leading-relaxed text-slate-400 px-4">
              Tu solicitud está en el radar de la flota. Recuerda estar atento para recibir el equipo.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="px-6 py-2 rounded-full bg-white/5 text-primary border border-white/10 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> 
              Redirigiendo en {countdown}s
            </div>
            <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.3em]">SERÁS LLEVADO A LA SALA DE ESPERA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
