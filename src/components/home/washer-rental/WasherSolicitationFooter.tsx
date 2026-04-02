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
 * Función Aislada: Footer de Solicitud Oro Élite
 * Mandamiento #1: Arquitectura de lujo, animaciones dinámicas y sincronización perfecta.
 */
export function WasherSolicitationFooter({
  formattedPrice, paymentMethod, isSending, isAnyStoreOpen, onSubmit
}: WasherSolicitationFooterProps) {
  return (
    <div className="space-y-10 mt-4">
      {/* CONTENEDOR DE PRECIO: TRANSFORMACIÓN ORO ÉLITE */}
      <div className={cn(
        "relative p-10 rounded-[48px] overflow-hidden shadow-[0_20px_50px_-12px_rgba(234,179,8,0.3)] transition-all duration-700",
        "bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#a16207]",
        "border-2 border-yellow-300/50 group"
      )}>
        {/* EFECTO DE LUZ SHIMMER DINÁMICO (Ráfaga de Oro) */}
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-shimmer pointer-events-none z-20" />
        
        {/* DECORACIÓN DE FONDO (Aura Solar) */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse" />
        
        <div className="space-y-4 relative z-10 text-center">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-3 h-3 text-slate-900 fill-slate-900 animate-pulse" />
              <p className="text-[10px] font-black text-slate-900/60 uppercase tracking-[0.4em]">Total Estimado</p>
              <Sparkles className="w-3 h-3 text-slate-900 fill-slate-900 animate-pulse" />
            </div>
            <h4 className="text-6xl font-black italic tracking-tighter leading-none text-slate-950 drop-shadow-sm">
              {formattedPrice}
            </h4>
          </div>
          
          <div className="flex justify-center pt-2">
            <div className="flex items-center gap-2 px-5 py-2 bg-slate-950/10 border border-slate-950/10 rounded-full backdrop-blur-md">
              <Wallet className="w-4 h-4 text-slate-900" />
              <span className="text-[10px] font-black uppercase italic text-slate-900">
                {paymentMethod === 'cash' ? 'Pagas al recibir' : 'Liquidación Digital'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÓN DE COMANDO: TRANSFORMACIÓN ORO ÉLITE */}
      <div className="relative group">
        {/* Resplandor Neón de Fondo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-[40px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        
        <Button 
          onClick={onSubmit} 
          disabled={isSending || !isAnyStoreOpen} 
          className={cn(
            "relative w-full h-24 rounded-[40px] font-black text-2xl uppercase italic tracking-tighter transition-all gap-4 overflow-hidden border-none",
            isAnyStoreOpen 
              ? [
                  "bg-gradient-to-r from-[#facc15] via-[#eab308] to-[#ca8a04] text-slate-950 shadow-2xl",
                  "border-b-[10px] border-[#a16207] hover:border-b-[6px] hover:translate-y-[4px] active:border-b-0 active:translate-y-[10px]",
                  "shadow-[0_15px_35px_-5px_rgba(161,98,7,0.4)]"
                ] 
              : "bg-slate-200 text-slate-400 grayscale cursor-not-allowed"
          )}
        >
          {/* LUZ SHIMMER QUE RECORRE EL BOTÓN */}
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
          
          {isSending ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isAnyStoreOpen ? (
            <>
              <span className="hidden sm:inline">CONFIRMAR SOLICITUD</span>
              <span className="sm:hidden">PEDIR</span> 
              <CheckCircle2 className="w-8 h-8 fill-slate-950/10" />
            </>
          ) : (
            "SISTEMA CERRADO"
          )}
        </Button>
      </div>
      
      {/* SELLO TÉCNICO DE SEGURIDAD */}
      <div className="pt-6 space-y-2">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <p className="text-[9px] text-center text-slate-400 font-black uppercase tracking-[0.5em] animate-pulse">
          SISTEMA BLINDADO • VITRINIANDO AI KERNEL
        </p>
      </div>
    </div>
  );
}
