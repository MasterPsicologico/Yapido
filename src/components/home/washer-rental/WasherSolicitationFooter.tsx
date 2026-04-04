
"use client";

import { Wallet, CheckCircle2, Loader2, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderSubmissionStatus } from './WasherSolicitationDialog';

interface WasherSolicitationFooterProps {
  status: OrderSubmissionStatus;
  formattedPrice: string;
  paymentMethod: 'cash' | 'digital';
  isAnyStoreOpen: boolean;
  onSubmit: () => void;
}

export function WasherSolicitationFooter({
  status, formattedPrice, paymentMethod, isAnyStoreOpen, onSubmit
}: WasherSolicitationFooterProps) {
  
  // RENDERIZADO SEGÚN ESTADO DE LA SOLICITUD
  if (status === 'success' || status === 'timeout') {
    return (
      <div className="space-y-6 mt-4 animate-in zoom-in fade-in duration-500">
        <div className={cn(
          "relative p-8 rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-2 transition-all duration-1000",
          status === 'success' ? "bg-slate-900 border-primary/20" : "bg-orange-50 border-orange-200"
        )}>
          {status === 'success' && (
            <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-primary/5 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
          )}
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className={cn(
              "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-xl",
              status === 'success' ? "bg-primary/20 text-primary animate-pulse" : "bg-orange-500 text-white animate-bounce"
            )}>
              {status === 'success' ? <Clock className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>

            <div className="space-y-2">
              <h4 className={cn(
                "text-2xl font-black italic uppercase tracking-tighter leading-none",
                status === 'success' ? "text-white" : "text-orange-700"
              )}>
                {status === 'success' ? "¡Solicitud Enviada!" : "Búsqueda Extendida"}
              </h4>
              <p className={cn(
                "text-sm font-bold leading-relaxed",
                status === 'success' ? "text-slate-400" : "text-orange-600"
              )}>
                {status === 'success' 
                  ? "Dentro de unos minutos recibirás la confirmación. Recuerda estar atento para recibir la lavadora y que no haya ningún inconveniente."
                  : "Aún nos encontramos en el proceso para asignarle una lavadora. Gracias por tu paciencia, seguimos trabajando en tu ruta."
                }
              </p>
            </div>

            <div className={cn(
              "px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em]",
              status === 'success' ? "bg-white/5 text-primary border border-white/10" : "bg-orange-200 text-orange-800"
            )}>
              {status === 'success' ? "Sincronizando con repartidores..." : "Prioridad alta en el radar"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 opacity-30">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500">Monitor de Operaciones Activo</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-2">
      <div className={cn(
        "relative p-5 rounded-[28px] overflow-hidden shadow-xl bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#a16207] border-2 border-yellow-300/50"
      )}>
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
