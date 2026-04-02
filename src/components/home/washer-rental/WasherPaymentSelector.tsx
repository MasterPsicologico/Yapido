"use client";

import { Wallet, Globe } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface WasherPaymentSelectorProps {
  paymentMethod: 'cash' | 'digital';
  onPaymentMethodChange: (method: 'cash' | 'digital') => void;
}

export function WasherPaymentSelector({ paymentMethod, onPaymentMethodChange }: WasherPaymentSelectorProps) {
  return (
    <div className="space-y-4 pt-4">
      <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">MÉTODO DE PAGO</Label>
      <div className="grid grid-cols-2 gap-3 p-1 rounded-[36px]">
        <button 
          onClick={() => onPaymentMethodChange('cash')} 
          className={cn(
            "flex flex-col items-center gap-3 p-5 rounded-[32px] border-2 transition-all duration-300", 
            paymentMethod === 'cash' ? "border-slate-950 bg-slate-950 text-white shadow-xl" : "border-slate-100 bg-slate-50 text-slate-400"
          )}
        >
          <Wallet className={cn("w-6 h-6", paymentMethod === 'cash' ? "text-primary" : "text-slate-300")} />
          <span className="text-[9px] font-black uppercase tracking-widest italic">CONTRA ENTREGA</span>
        </button>
        <button 
          onClick={() => onPaymentMethodChange('digital')} 
          className={cn(
            "flex flex-col items-center gap-3 p-5 rounded-[32px] border-2 transition-all duration-300", 
            paymentMethod === 'digital' ? "border-primary bg-primary/10 text-primary shadow-xl" : "border-slate-100 bg-slate-50 text-slate-400"
          )}
        >
          <Globe className={cn("w-6 h-6", paymentMethod === 'digital' ? "text-primary" : "text-slate-300")} />
          <span className="text-[9px] font-black uppercase tracking-widest italic">PAGO ONLINE</span>
        </button>
      </div>
    </div>
  );
}
