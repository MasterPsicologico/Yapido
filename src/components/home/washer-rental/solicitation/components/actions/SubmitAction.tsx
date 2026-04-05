
"use client";

import { CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmitActionProps {
  isSending: boolean;
  isAnyStoreOpen: boolean;
  formattedPrice: string;
  paymentMethod: 'cash' | 'digital';
  onSubmit: () => void;
}

export function SubmitAction({
  isSending, isAnyStoreOpen, formattedPrice, paymentMethod, onSubmit
}: SubmitActionProps) {
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
        disabled={isSending || !isAnyStoreOpen} 
        className={cn(
          "relative w-full h-16 rounded-[24px] font-black text-lg uppercase italic tracking-tighter transition-all gap-3 overflow-hidden flex items-center justify-center outline-none",
          isAnyStoreOpen 
            ? "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-slate-950 shadow-xl border-b-[8px] border-yellow-800 active:border-b-0 active:translate-y-1" 
            : "bg-slate-200 text-slate-400 grayscale cursor-not-allowed"
        )}
      >
        {isSending ? (
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
