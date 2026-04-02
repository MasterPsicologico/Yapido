
"use client";

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Waves, X, User as UserIcon, MapPin, Zap, Minus, Plus, Wallet, Globe, CreditCard, ArrowRight, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WasherSolicitationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  profile: any;
  pricingConfig: any;
  isAnyStoreOpen: boolean;
  onOpenAdminSettings: () => void;
  onSubmitRequest: (data: any) => Promise<void>;
}

export function WasherSolicitationDialog({
  isOpen,
  onOpenChange,
  isAdmin,
  profile,
  pricingConfig,
  isAnyStoreOpen,
  onOpenAdminSettings,
  onSubmitRequest
}: WasherSolicitationDialogProps) {
  const [tempName, setTempName] = useState(profile?.displayName || "");
  const [tempAddress, setTempAddress] = useState(profile?.address || "");
  const [tempPhone, setTempPhone] = useState(profile?.phoneNumber || "");
  const [requestHours, setRequestHours] = useState(Number(pricingConfig?.minHours || 5));
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'digital'>('cash');
  const [isSending, setIsSending] = useState(false);
  const [flashEffect, setFlashEffect] = useState<'none' | 'red' | 'green'>('none');

  const minHours = Number(pricingConfig?.minHours || 5);
  const valHoraBase = Number(pricingConfig?.basePrice || 3000);
  const totalPrice = requestHours * valHoraBase;

  const formattedPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(totalPrice);

  const handleAdjustHours = (delta: number) => {
    const newHours = requestHours + delta;
    if (newHours < minHours) {
      setFlashEffect('red');
      setTimeout(() => setFlashEffect('none'), 600);
      return;
    }
    setFlashEffect('green');
    setRequestHours(newHours);
    setTimeout(() => setFlashEffect('none'), 600);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    await onSubmitRequest({
      customerName: tempName,
      customerAddress: tempAddress,
      customerPhone: tempPhone,
      requestHours,
      totalPrice,
      paymentMethod
    });
    setIsSending(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-[#0a0a0a] p-0 overflow-hidden flex flex-col z-[600] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Nueva Solicitud Alquiler</DialogTitle>
          <DialogDescription>Formulario de solicitud express para alquiler de lavadoras.</DialogDescription>
        </DialogHeader>
        
        <div className="h-20 bg-slate-950 flex items-center justify-between px-6 shrink-0 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary"><Waves className="w-6 h-6" /></div>
            <div><h3 className="text-white font-black uppercase italic tracking-tighter text-2xl leading-none">NUEVA SOLICITUD</h3><p className="text-primary/60 text-[9px] font-black uppercase tracking-[0.3em] mt-1">SISTEMA INTELIGENTE</p></div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <button onClick={onOpenAdminSettings} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-primary transition-all"><Settings2 className="w-5 h-5" /></button>}
            <button onClick={() => onOpenChange(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-t-[40px] mt-2 border-t-4 border-slate-950">
          <div className="max-w-md mx-auto py-8 px-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">NOMBRE COMPLETO</Label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors"><UserIcon className="w-4 h-4" /></div>
                  <Input value={tempName} onChange={(e) => setTempName(e.target.value)} className="h-12 rounded-2xl border-none shadow-sm pl-16 font-black text-slate-800 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-950 transition-all" placeholder="Escribe tu nombre..." />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">DIRECCIÓN DE ENTREGA</Label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors"><MapPin className="w-4 h-4" /></div>
                  <Input value={tempAddress} onChange={(e) => setTempAddress(e.target.value)} className="h-12 rounded-2xl border-none shadow-sm pl-16 font-black text-slate-800 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-950 transition-all" placeholder="Calle, Barrio, Casa..." />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">WHATSAPP</Label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-green-500 transition-colors"><Zap className="w-4 h-4" /></div>
                  <Input value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} className="h-12 rounded-2xl border-none shadow-sm pl-16 font-black text-slate-800 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-950 transition-all" placeholder="300 000 0000" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between px-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">TIEMPO DE ALQUILER</Label>
                <Badge className="bg-slate-900 text-white border-none text-[9px] font-black px-3 py-1">MIN. {minHours} HORAS</Badge>
              </div>
              
              <div className={cn(
                "flex flex-col items-center gap-2 bg-slate-50 p-6 rounded-[40px] shadow-inner relative overflow-hidden border-2 transition-all duration-300",
                flashEffect === 'red' ? "border-red-500 animate-vibrate" : flashEffect === 'green' ? "border-green-500" : "border-transparent"
              )}>
                <div className="flex items-center gap-8 w-full justify-between px-4">
                  <button type="button" onClick={() => handleAdjustHours(-1)} className="w-14 h-14 rounded-2xl bg-white shadow-md text-slate-400 hover:text-red-500 transition-all active:scale-90 flex items-center justify-center"><Minus className="w-6 h-6" /></button>
                  <div className="text-center flex flex-col">
                    <div className="flex items-baseline gap-2 justify-center">
                      <span className={cn("text-6xl font-black italic tracking-tighter transition-colors", flashEffect === 'red' ? "text-red-600" : flashEffect === 'green' ? "text-green-600" : "text-slate-950")}>{requestHours}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Horas</span>
                    </div>
                    <div className="mt-1 text-2xl font-black text-primary italic tracking-tighter">{formattedPrice}</div>
                  </div>
                  <button type="button" onClick={() => handleAdjustHours(1)} className="w-14 h-14 rounded-2xl bg-white shadow-md text-slate-400 hover:text-green-500 transition-all active:scale-90 flex items-center justify-center"><Plus className="w-6 h-6" /></button>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">MÉTODO DE PAGO</Label>
              <div className="grid grid-cols-2 gap-3 p-1 rounded-[36px]">
                <button onClick={() => setPaymentMethod('cash')} className={cn("flex flex-col items-center gap-3 p-5 rounded-[32px] border-2 transition-all duration-300", paymentMethod === 'cash' ? "border-slate-950 bg-slate-950 text-white shadow-xl" : "border-slate-100 bg-slate-50 text-slate-400")}>
                  <Wallet className={cn("w-6 h-6", paymentMethod === 'cash' ? "text-primary" : "text-slate-300")} />
                  <span className="text-[9px] font-black uppercase tracking-widest italic">CONTRA ENTREGA</span>
                </button>
                <button onClick={() => setPaymentMethod('digital')} className={cn("flex flex-col items-center gap-3 p-5 rounded-[32px] border-2 transition-all duration-300", paymentMethod === 'digital' ? "border-primary bg-primary/10 text-primary shadow-xl" : "border-slate-100 bg-slate-50 text-slate-400")}>
                  <Globe className={cn("w-6 h-6", paymentMethod === 'digital' ? "text-primary" : "text-slate-300")} />
                  <span className="text-[9px] font-black uppercase tracking-widest italic">PAGO ONLINE</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="space-y-4 relative z-10">
                <div className="flex flex-col gap-1 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Estimado</p>
                  <h4 className="text-5xl font-black italic tracking-tighter leading-none text-white">{formattedPrice}</h4>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                    <Wallet className="w-3.5 h-3.5 text-primary" /><span className="text-[9px] font-black uppercase italic">{paymentMethod === 'cash' ? 'Pagas al recibir' : 'Liquidación Digital'}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleFormSubmit} disabled={isSending || !isAnyStoreOpen} className={cn("w-full h-20 rounded-[32px] text-white font-black text-2xl uppercase italic tracking-tighter shadow-2xl transition-all gap-4", isAnyStoreOpen ? "bg-primary active:scale-95" : "bg-slate-300")}>
              {isSending ? <Loader2 className="animate-spin" /> : isAnyStoreOpen ? <><span className="hidden sm:inline">CONFIRMAR SOLICITUD</span><span className="sm:hidden">PEDIR</span> <CheckCircle2 className="w-8 h-8" /></> : "NEGOCIO CERRADO"}
            </Button>
            
            <p className="text-[8px] text-center text-slate-300 font-black uppercase tracking-[0.4em] pt-4">SISTEMA PROTEGIDO • VITRINIANDO AI KERNEL</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Settings2({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
    </svg>
  );
}
