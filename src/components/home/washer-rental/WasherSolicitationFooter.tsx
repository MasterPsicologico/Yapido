"use client";

import { Wallet, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WasherSolicitationFooterProps {
  formattedPrice: string;
  paymentMethod: 'cash' | 'digital';
  isSending: boolean;
  isAnyStoreOpen: boolean;
  onSubmit: () => void;
}

/**
 * Función Aislada: Footer de Solicitud Oro Élite Compactado
 * Mandamiento #1: Arquitectura de lujo con escala optimizada al 50% para evitar desbordes.
 */
export function WasherSolicitationFooter({
  formattedPrice, paymentMethod, isSending, isAnyStoreOpen, onSubmit
}: WasherSolicitationFooterProps) {
  return (
    <div className="space-y-4 mt-2">
      {/* CONTENEDOR DE PRECIO: ESCALA REDUCIDA AL 50% */}
      <div className={cn(
        "relative p-4 rounded-[24px] overflow-hidden shadow-xl transition-all duration-700",
        "bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#a16207]",
        "border-2 border-yellow-300/50 group"
      )}>
        {/* EFECTO DE LUZ SHIMMER DINÁMICO */}
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-shimmer pointer-events-none z-20" />
        
        <div className="space-y-1.5 relative z-10 text-center">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-[7px] font-black text-slate-900/60 uppercase tracking-[0.3em]">Total Estimado</p>
            </div>
            <h4 className="text-3xl font-black italic tracking-tighter leading-none text-slate-950 drop-shadow-sm">
              {formattedPrice}
            </h4>
          </div>
          
          <div className="flex justify-center pt-0.5">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-950/10 border border-slate-950/10 rounded-full backdrop-blur-md">
              <Wallet className="w-2.5 h-2.5 text-slate-900" />
              <span className="text-[7px] font-black uppercase italic text-slate-900">
                {paymentMethod === 'cash' ? 'Pagas al recibir' : 'Billetera Digital'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÓN DE COMANDO: ESCALA REDUCIDA AL 50% */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-[20px] blur opacity-20 transition duration-1000"></div>
        
        <button 
          onClick={onSubmit} 
          disabled={isSending || !isAnyStoreOpen} 
          className={cn(
            "relative w-full h-14 rounded-[20px] font-black text-base uppercase italic tracking-tighter transition-all gap-3 overflow-hidden border-none flex items-center justify-center",
            isAnyStoreOpen 
              ? [
                  "bg-gradient-to-r from-[#facc15] via-[#eab308] to-[#ca8a04] text-slate-950 shadow-lg",
                  "border-b-[6px] border-[#a16207] hover:border-b-[3px] hover:translate-y-0.5 active:border-b-0 active:translate-y-1",
                  "shadow-[0_6px_15px_-5px_rgba(161,98,7,0.3)]"
                ] 
              : "bg-slate-200 text-slate-400 grayscale cursor-not-allowed"
          )}
        >
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
          
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isAnyStoreOpen ? (
            <>
              <span>CONFIRMAR PEDIDO</span>
              <CheckCircle2 className="w-5 h-5 fill-slate-950/10" />
            </>
          ) : (
            "SISTEMA CERRADO"
          )}
        </button>
      </div>
      
      {/* SELLO TÉCNICO DE SEGURIDAD */}
      <div className="pt-2 space-y-1">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <p className="text-[6px] text-center text-slate-400 font-black uppercase tracking-[0.4em] animate-pulse">
          SISTEMA BLINDADO • VITRINIANDO AI KERNEL
        </p>
      </div>
    </div>
  );
}
