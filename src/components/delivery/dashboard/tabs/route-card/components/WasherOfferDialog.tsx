
"use client";

import { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Loader2, 
  Sparkles, 
  Zap, 
  Wallet,
  ShieldCheck,
  ArrowRight,
  ArrowRightLeft,
  TrendingUp,
  Banknote,
  Coins
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface WasherOfferDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onSendOffer: (price: number, comment: string) => Promise<void>;
  isSending: boolean;
}

/**
 * WasherOfferDialog - Experiencia de Contraoferta Full-Screen Premium.
 * Rediseñado con visual de flujo de dinero y blindaje de accesibilidad.
 */
export function WasherOfferDialog({ 
  isOpen, 
  onOpenChange, 
  order, 
  onSendOffer, 
  isSending 
}: WasherOfferDialogProps) {
  const [offerPrice, setOfferPrice] = useState(order?.totalPrice?.toString() || "");
  const [offerComment, setOfferComment] = useState("");

  useEffect(() => {
    if (order?.totalPrice) setOfferPrice(order.totalPrice.toString());
  }, [order?.totalPrice, isOpen]);

  const formattedOriginalPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(order?.totalPrice || 0);

  const currentOfferFormatted = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(Number(offerPrice) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-[#050505] p-0 overflow-hidden flex flex-col z-[700] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
        
        {/* ELEMENTOS DE ACCESIBILIDAD OBLIGATORIOS (SR-ONLY) */}
        <div className="sr-only">
          <DialogTitle>Protocolo de Contraoferta</DialogTitle>
          <DialogDescription>Ajuste de precio maestro para la misión logística.</DialogDescription>
        </div>

        {/* HEADER ÉLITE VISUAL */}
        <div className="h-28 bg-[#050505] flex flex-row items-center justify-between px-6 shrink-0 relative overflow-hidden border-b border-yellow-500/10 z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 animate-pulse" />
          
          <div className="relative z-10 w-12 h-12 rounded-[18px] bg-gradient-to-br from-yellow-400 to-yellow-700 flex items-center justify-center text-white shadow-lg shadow-yellow-500/20">
            <DollarSign className="w-6 h-6 animate-pulse" />
          </div>

          <div className="flex-1 px-4 text-center relative z-10 pt-4">
            <h3 className={cn(
              "font-black italic uppercase tracking-tighter leading-[0.85] text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207] text-3xl drop-shadow-md"
            )}>
              CONTRAOFERTA
            </h3>
            <p className="text-yellow-500 font-black text-[7px] uppercase tracking-[0.4em] mt-1 opacity-60">
              SISTEMA DE NEGOCIACIÓN MAESTRO
            </p>
          </div>
          
          <button 
            onClick={() => onOpenChange(false)} 
            className="relative z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 hover:bg-red-500 transition-all active:scale-90 shadow-2xl group"
          >
            <X className="w-5 h-5 group-hover:rotate-90" />
          </button>
        </div>

        {/* CUERPO TÉCNICO DORADO */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-t-[40px] mt-2 border-t-4 border-slate-950">
          <div className="max-w-md mx-auto py-10 px-6 space-y-10 pb-32">
            
            {/* SECCIÓN SORPRESA: VISUALIZACIÓN DE FLUJO MONETARIO */}
            <section className="relative p-8 rounded-[40px] bg-slate-900 overflow-hidden shadow-2xl border-b-8 border-slate-950 group/flow">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />
              <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-yellow-200/5 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
              
              {/* Iconos Flotantes de Dinero */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-12 opacity-20 group-hover/flow:opacity-40 transition-opacity">
                <Coins className="w-8 h-8 text-yellow-500 animate-bounce [animation-duration:3s]" />
                <Banknote className="w-8 h-8 text-primary animate-bounce [animation-duration:4s]" />
                <Coins className="w-8 h-8 text-yellow-500 animate-bounce [animation-duration:2.5s]" />
              </div>

              <div className="relative z-10 flex items-center justify-between gap-4 mt-4">
                <div className="text-center space-y-2 flex-1">
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">OFERTA CLIENTE</p>
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/5 backdrop-blur-sm">
                    <span className="text-sm font-black text-slate-400 italic line-through opacity-50">{formattedOriginalPrice}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                    <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
                  </div>
                  <ArrowRightLeft className="w-4 h-4 text-slate-700 mt-1" />
                </div>

                <div className="text-center space-y-2 flex-1">
                  <p className="text-[7px] font-black text-yellow-500 uppercase tracking-widest">TU PROPUESTA</p>
                  <div className="bg-yellow-500/10 rounded-2xl p-3 border border-yellow-500/20 animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                    <span className="text-lg font-black text-yellow-500 italic tracking-tighter">{currentOfferFormatted}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center"><Coins className="w-3 h-3 text-yellow-500" /></div>
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center"><Wallet className="w-3 h-3 text-primary" /></div>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Negociación de Alta Velocidad</p>
              </div>
            </section>

            {/* CAMPO DE OFERTA MAESTRA (DISEÑO ORO) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-4">
                <TrendingUp className="w-3.5 h-3.5 text-yellow-600 animate-pulse" />
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Nuevo Valor Sugerido</Label>
              </div>
              <div className="relative overflow-hidden rounded-[32px] shadow-2xl group/input">
                <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-3xl text-yellow-600 z-10">$</div>
                <Input 
                  type="number" 
                  value={offerPrice} 
                  onChange={(e) => setOfferPrice(e.target.value)} 
                  className={cn(
                    "h-24 rounded-[32px] border-4 border-yellow-500/20 pl-14 pr-8 font-black text-slate-900 text-5xl tracking-tighter transition-all duration-500",
                    "bg-gradient-to-r from-yellow-50/50 to-white focus:bg-white focus:border-yellow-500 focus:shadow-[0_0_40px_rgba(234,179,8,0.2)]"
                  )}
                />
              </div>
            </div>

            {/* MENSAJE PERSUASIVO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-4">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Justificación del Trato</Label>
              </div>
              <div className="relative rounded-[28px] bg-slate-50 border-2 border-transparent focus-within:border-primary/20 transition-all overflow-hidden">
                <Textarea 
                  value={offerComment} 
                  onChange={(e) => setOfferComment(e.target.value)} 
                  placeholder="Ej: Llego en 10 min, tengo equipo nuevo y mangueras largas..." 
                  className="rounded-[28px] bg-transparent border-none min-h-[140px] font-medium text-sm p-6 resize-none outline-none" 
                />
              </div>
              <p className="text-[8px] text-center text-slate-400 font-bold uppercase italic tracking-widest">
                Argumentar tu precio aumenta la aceptación en un 40%
              </p>
            </div>

            {/* ACCIÓN DE LANZAMIENTO */}
            <div className="pt-4 space-y-6">
              <Button 
                onClick={() => onSendOffer(Number(offerPrice), offerComment)} 
                disabled={isSending || !offerPrice} 
                className={cn(
                  "w-full h-20 rounded-[32px] font-black text-xl uppercase italic tracking-widest transition-all gap-4 shadow-2xl active:scale-95 border-b-[10px] border-yellow-800",
                  "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-slate-950"
                )}
              >
                {isSending ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>ENVIAR CONTRAOFERTA <ArrowRight className="w-6 h-6" /></>
                )}
              </Button>
              <div className="flex flex-col items-center gap-2 opacity-30">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em]">Protocolo de Trato Sincronizado</span>
                </div>
                <div className="h-0.5 w-16 bg-slate-300 rounded-full" />
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
