
"use client";

import { Wallet, CheckCircle2, Loader2, Sparkles, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderSubmissionStatus } from './WasherSolicitationDialog';

interface WasherSolicitationFooterProps {
  status: OrderSubmissionStatus;
  formattedPrice: string;
  paymentMethod: 'cash' | 'digital';
  isAnyStoreOpen: boolean;
  redirectCountdown: number;
  onSubmit: () => void;
}

export function WasherSolicitationFooter({
  status, formattedPrice, paymentMethod, isAnyStoreOpen, redirectCountdown, onSubmit
}: WasherSolicitationFooterProps) {
  
  if (status === 'success') {
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
                Redirigiendo en {redirectCountdown}s
              </div>
              <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.3em]">SERÁS LLEVADO A LA SALA DE ESPERA</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-2">
      <div className="relative p-5 rounded-[28px] overflow-hidden shadow-xl bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#a16207] border-2 border-yellow-300/50">
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
        <div className="space-y-1 relative z-10 text-center">
          <p className="text-[8px] font-black text-slate-900/60 uppercase tracking-[0.3em] mb-4">Total Estimado</p>
          <h4 className="text-4xl font-black italic tracking-tighter text-slate-950 leading-none">{formattedPrice}</h4>
          <div className="flex justify-center pt-1">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/10 rounded-full mt-2">
              <Wallet className="w-3 h-3 text-slate-900" />
              <span className="text-[8px] font-black uppercase italic text-slate-900">
                {paymentMethod === 'cash' ? 'Pagas al recibir' : 'Billetera Digital'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={onSubmit} 
        disabled={status === 'sending' || !isAnyStoreOpen} 
        className={cn(
          "relative w-full h-16 rounded-[24px] font-black text-lg uppercase italic tracking-tighter transition-all gap-3 overflow-hidden flex items-center justify-center outline-none",
          isAnyStoreOpen 
            ? "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-slate-950 shadow-xl border-b-[8px] border-yellow-800 active:border-b-0 active:translate-y-1" 
            : "bg-slate-200 text-slate-400 grayscale cursor-not-allowed"
        )}
      >
        {status === 'sending' ? (
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>SINCRONIZANDO...</span>
          </div>
        ) : (
          <><CheckCircle2 className="w-6 h-6" /> CONFIRMAR PEDIDO</>
        )}
      </button>
      <p className="text-[7px] text-center text-slate-400 font-black uppercase tracking-[0.4em]">SISTEMA BLINDADO • VITRINIANDO AI KERNEL</p>
    </div>
  );
}
