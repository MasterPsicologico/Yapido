
"use client";

import { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Loader2, 
  Sparkles, 
  Clock, 
  Zap, 
  MessageCircle, 
  CheckCircle2, 
  Wallet,
  ShieldCheck,
  Package,
  ArrowRight
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
 * WasherOfferDialog - Experiencia de Negociación Full-Screen Premium.
 * Blindado con estilo Oro Morrocoyero.
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-[#050505] p-0 overflow-hidden flex flex-col z-[700] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
        
        {/* HEADER ÉLITE */}
        <div className="h-28 bg-[#050505] flex items-center justify-between px-6 shrink-0 relative overflow-hidden border-b border-yellow-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 animate-pulse" />
          
          <div className="relative z-10 w-12 h-12 rounded-[18px] bg-gradient-to-br from-yellow-400 to-yellow-700 flex items-center justify-center text-white shadow-lg shadow-yellow-500/20">
            <DollarSign className="w-6 h-6 animate-pulse" />
          </div>

          <div className="flex-1 px-4 text-center relative z-10 pt-4">
            <h3 className="font-black italic uppercase tracking-tighter leading-[0.85] text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207] text-2xl drop-shadow-md">
              ENVIAR <br />
              <span className="text-3xl">TRATO MAESTRO</span>
            </h3>
            <p className="text-yellow-500 font-black text-[7px] uppercase tracking-[0.4em] mt-1 opacity-60">SISTEMA DE NEGOCIACIÓN ACTIVO</p>
          </div>
          
          <button 
            onClick={() => onOpenChange(false)} 
            className="relative z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20 hover:bg-red-500 transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO TÉCNICO DORADO */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-t-[40px] mt-2 border-t-4 border-slate-950">
          <div className="max-w-md mx-auto py-10 px-6 space-y-10">
            
            {/* RESUMEN DE MISIÓN (INFO ÚTIL) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 ml-2">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contexto de la Misión</span>
              </div>
              <div className="bg-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12" />
                <div className="relative z-10 grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Equipo</p>
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-black uppercase italic">{order?.washerType || 'Auto'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tiempo</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-black uppercase italic">{order?.requestHours} Horas</span>
                    </div>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[9px] font-black text-slate-400 uppercase italic">Precio Original del Cliente:</p>
                    <span className="text-lg font-black text-primary italic">{formattedOriginalPrice}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* CAMPO DE OFERTA MAESTRA (DISEÑO ORO) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-4">
                <Sparkles className="w-3.5 h-3.5 text-yellow-600 animate-pulse" />
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Tu Propuesta Económica</Label>
              </div>
              <div className="relative overflow-hidden rounded-[32px] shadow-2xl group">
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
                <MessageCircle className="w-3.5 h-3.5 text-primary" />
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Nota de Valor para el Cliente</Label>
              </div>
              <Textarea 
                value={offerComment} 
                onChange={(e) => setOfferComment(e.target.value)} 
                placeholder="Ej: Llego en 10 min, tengo equipo nuevo y mangueras largas..." 
                className="rounded-[28px] bg-slate-50 border-none min-h-[120px] font-medium text-sm p-6 focus:ring-4 focus:ring-primary/5 transition-all" 
              />
              <p className="text-[8px] text-center text-slate-400 font-bold uppercase italic tracking-widest">Un buen mensaje aumenta tu probabilidad de cierre en un 40%</p>
            </div>

            {/* ACCIÓN DE LANZAMIENTO */}
            <div className="pt-4 space-y-4">
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
                  <>LANZAR MI TRATO <ArrowRight className="w-6 h-6" /></>
                )}
              </Button>
              <div className="flex items-center justify-center gap-2 opacity-30">
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em]">Protocolo de Trato Sincronizado</span>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
