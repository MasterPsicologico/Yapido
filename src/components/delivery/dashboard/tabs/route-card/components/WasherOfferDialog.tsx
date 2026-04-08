
"use client";

import { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Loader2, 
  Zap, 
  Plus,
  Minus,
  Coins,
  Banknote,
  ShieldCheck,
  ArrowRightLeft
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

interface WasherOfferDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onSendOffer: (price: number, comment: string) => Promise<void>;
  isSending: boolean;
}

/**
 * WasherOfferDialog - Protocolo de Negociación Instantánea Full-Screen.
 * LÓGICA: Los botones (+) y (-) disparan instantáneamente la oferta a la nube.
 * Se añade animación persistente al rayo central para feedback visual garantizado.
 */
export function WasherOfferDialog({ 
  isOpen, 
  onOpenChange, 
  order, 
  onSendOffer, 
  isSending 
}: WasherOfferDialogProps) {
  const [offerPrice, setOfferPrice] = useState(order?.totalPrice || 0);
  const [isFlashActive, setIsFlashActive] = useState(false);

  useEffect(() => {
    if (order?.totalPrice) setOfferPrice(order.totalPrice);
  }, [order?.totalPrice, isOpen]);

  const formattedOriginalPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(order?.totalPrice || 0);

  const currentOfferFormatted = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(offerPrice);

  const handleAdjustPrice = (increment: boolean) => {
    const delta = increment ? 500 : -500;
    const newPrice = Math.max(0, offerPrice + delta);
    setOfferPrice(newPrice);
    
    // ACTIVACIÓN DE ANIMACIÓN SENSORIAL (Feedback de envío)
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 800);

    // DISPARO MAESTRO A LA NUBE
    onSendOffer(newPrice, `Contraoferta instantánea (${increment ? '+500' : '-500'})`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-[#050505] p-0 overflow-hidden flex flex-col z-[700] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
        
        {/* HEADER ÉLITE (Corregido para evitar errores de accesibilidad) */}
        <div className="h-28 bg-[#050505] flex flex-row items-center justify-between px-6 shrink-0 relative overflow-hidden border-b border-yellow-500/10 z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 animate-pulse" />
          
          <div className="relative z-10 w-12 h-12 rounded-[18px] bg-gradient-to-br from-yellow-400 to-yellow-700 flex items-center justify-center text-white shadow-lg shadow-yellow-500/20">
            <DollarSign className={cn("w-6 h-6", (isSending || isFlashActive) ? "animate-spin" : "animate-pulse")} />
          </div>

          <DialogHeader className="flex-1 px-4 text-center relative z-10 pt-4">
            <DialogTitle className="font-black italic uppercase tracking-tighter leading-[0.85] text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207] text-3xl drop-shadow-md">
              CONTRAOFERTA
            </DialogTitle>
            <DialogDescription className="text-yellow-500 font-black text-[7px] uppercase tracking-[0.4em] mt-1 opacity-60">
              SISTEMA DE NEGOCIACIÓN MAESTRO
            </DialogDescription>
          </DialogHeader>
          
          <button 
            onClick={() => onOpenChange(false)} 
            className="relative z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 hover:bg-red-500 transition-all active:scale-90 shadow-2xl group"
          >
            <X className="w-5 h-5 group-hover:rotate-90" />
          </button>
        </div>

        {/* CUERPO ÚNICO: EL CONTENEDOR DE NEGOCIACIÓN */}
        <div className="flex-1 flex flex-col justify-center items-center bg-white rounded-t-[40px] mt-2 border-t-4 border-slate-950 px-4 sm:px-6">
          <div className="w-full max-w-md space-y-12">
            
            {/* CONTENEDOR MAESTRO DE COMPARACIÓN */}
            <section className="relative px-4 py-10 sm:p-8 rounded-[40px] bg-slate-900 overflow-hidden shadow-2xl border-b-8 border-slate-950 group/flow">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />
              <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-yellow-200/5 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
              
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-12 opacity-20">
                <Coins className="w-8 h-8 text-yellow-500 animate-bounce [animation-duration:3s]" />
                <Banknote className="w-8 h-8 text-primary animate-bounce [animation-duration:4s]" />
              </div>

              <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-4 mt-4">
                {/* LADO IZQUIERDO: CLIENTE */}
                <div className="text-center space-y-2 flex-1">
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">OFERTA CLIENTE</p>
                  <div className="bg-white/5 rounded-2xl p-2.5 sm:p-3 border border-white/5 backdrop-blur-sm">
                    <span className="text-xs sm:text-sm font-black text-slate-400 italic line-through opacity-50">{formattedOriginalPrice}</span>
                  </div>
                </div>

                {/* RAYO CENTRAL: EL CORAZÓN DE LA NEGOCIACIÓN */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={cn(
                    "w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border transition-all duration-300",
                    (isSending || isFlashActive) 
                      ? "bg-yellow-500 border-white shadow-[0_0_30px_rgba(234,179,8,0.8)] scale-110" 
                      : "bg-yellow-500/20 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                  )}>
                    {(isSending && !isFlashActive) ? (
                      <Loader2 className="w-5 h-5 sm:w-7 sm:h-7 text-slate-900 animate-spin" />
                    ) : (
                      <Zap className={cn(
                        "w-5 h-5 sm:w-7 sm:h-7 transition-all duration-300",
                        (isSending || isFlashActive) ? "text-slate-950 scale-125 fill-current" : "text-yellow-500 animate-pulse"
                      )} />
                    )}
                  </div>
                  <ArrowRightLeft className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700 mt-1" />
                </div>

                {/* LADO DERECHO: TU PROPUESTA + CONTROLES DUALES */}
                <div className="text-center space-y-2 flex-[1.4] min-w-0">
                  <p className="text-[7px] font-black text-yellow-500 uppercase tracking-widest leading-none">TU PROPUESTA</p>
                  <div className="flex items-center gap-1.5">
                    {/* BOTÓN DISMINUIR (-) */}
                    <button 
                      onClick={() => handleAdjustPrice(false)}
                      disabled={isSending || isFlashActive}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all shrink-0 border border-white/10 hover:bg-red-500/20 disabled:opacity-30"
                    >
                      <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    <div className={cn(
                      "flex-1 rounded-2xl p-2 sm:p-3 border transition-all duration-300 min-w-0",
                      (isSending || isFlashActive) ? "bg-yellow-500/30 border-yellow-400 scale-105" : "bg-yellow-500/10 border-yellow-500/20"
                    )}>
                      <span className="text-xs sm:text-lg font-black text-yellow-500 italic tracking-tighter truncate block">{currentOfferFormatted}</span>
                    </div>

                    {/* BOTÓN AUMENTAR (+) */}
                    <button 
                      onClick={() => handleAdjustPrice(true)}
                      disabled={isSending || isFlashActive}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-950 flex items-center justify-center shadow-lg active:scale-90 transition-all shrink-0 border-b-2 border-yellow-800 disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex flex-col items-center gap-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                  {(isSending || isFlashActive) ? "ENVIANDO OFERTA AL RADAR..." : "TOCA + O - PARA NEGOCIAR AL INSTANTE"}
                </p>
                <div className="h-0.5 w-16 bg-yellow-500/20 rounded-full overflow-hidden">
                  {(isSending || isFlashActive) && <div className="h-full bg-yellow-500 animate-progress-loading" />}
                </div>
              </div>
            </section>

            <div className="flex flex-col items-center gap-3 opacity-30 animate-in fade-in duration-1000 delay-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em]">Protocolo de Trato Sincronizado</span>
              </div>
              <div className="h-0.5 w-16 bg-slate-200 rounded-full" />
            </div>

          </div>
        </div>

        <div className="h-12 bg-white flex items-center justify-center shrink-0 border-t border-slate-50">
          <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.5em]">VITRINIANDO AI KERNEL v1.0.4</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
