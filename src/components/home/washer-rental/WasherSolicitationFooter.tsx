"use client";

import { Wallet, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WasherSolicitationFooterProps {
  formattedPrice: string;
  paymentMethod: 'cash' | 'digital';
  isSending: boolean;
  isAnyStoreOpen: boolean;
  onSubmit: () => void;
}

export function WasherSolicitationFooter({
  formattedPrice, paymentMethod, isSending, isAnyStoreOpen, onSubmit
}: WasherSolicitationFooterProps) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="space-y-4 relative z-10">
          <div className="flex flex-col gap-1 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Estimado</p>
            <h4 className="text-5xl font-black italic tracking-tighter leading-none text-white">{formattedPrice}</h4>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <span className="text-[9px] font-black uppercase italic">
                {paymentMethod === 'cash' ? 'Pagas al recibir' : 'Liquidación Digital'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Button 
        onClick={onSubmit} 
        disabled={isSending || !isAnyStoreOpen} 
        className={cn(
          "w-full h-20 rounded-[32px] text-white font-black text-2xl uppercase italic tracking-tighter shadow-2xl transition-all gap-4", 
          isAnyStoreOpen ? "bg-primary active:scale-95" : "bg-slate-300"
        )}
      >
        {isSending ? (
          <Loader2 className="animate-spin" />
        ) : isAnyStoreOpen ? (
          <>
            <span className="hidden sm:inline">CONFIRMAR SOLICITUD</span>
            <span className="sm:hidden">PEDIR</span> 
            <CheckCircle2 className="w-8 h-8" />
          </>
        ) : (
          "NEGOCIO CERRADO"
        )}
      </Button>
      
      <p className="text-[8px] text-center text-slate-300 font-black uppercase tracking-[0.4em] pt-4">
        SISTEMA PROTEGIDO • VITRINIANDO AI KERNEL
      </p>
    </div>
  );
}
