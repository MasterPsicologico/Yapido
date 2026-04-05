
"use client";

import { Wallet, Globe, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PaymentStrategySelectorProps {
  method: 'cash' | 'digital';
  onChange: (method: 'cash' | 'digital') => void;
}

export function PaymentStrategySelector({ method, onChange }: PaymentStrategySelectorProps) {
  return (
    <div className="space-y-4 pt-6">
      <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.3em]">Estrategia de Liquidación</Label>
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onChange('cash')} 
          className={cn(
            "relative flex flex-col items-center gap-3 p-6 rounded-[32px] border-2 transition-all duration-500 overflow-hidden", 
            method === 'cash' 
              ? "border-slate-900 bg-slate-900 text-white shadow-2xl scale-[1.02]" 
              : "border-slate-100 bg-slate-50 text-slate-400 hover:border-yellow-500/30"
          )}
        >
          {method === 'cash' && (
            <div className="absolute top-2 right-2"><CheckCircle2 className="w-4 h-4 text-yellow-500" /></div>
          )}
          <Wallet className={cn("w-7 h-7", method === 'cash' ? "text-yellow-500 animate-pulse" : "text-slate-300")} />
          <span className="text-[10px] font-black uppercase tracking-widest italic">CONTRA ENTREGA</span>
        </button>

        <button 
          onClick={() => onChange('digital')} 
          className={cn(
            "relative flex flex-col items-center gap-3 p-6 rounded-[32px] border-2 transition-all duration-500 overflow-hidden", 
            method === 'digital' 
              ? "border-yellow-500 bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#a16207] text-slate-950 shadow-2xl scale-[1.02]" 
              : "border-slate-100 bg-slate-50 text-slate-400 hover:border-yellow-500/30"
          )}
        >
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shimmer pointer-events-none opacity-50" />
          {method === 'digital' && (
            <div className="absolute top-2 right-2"><CheckCircle2 className="w-4 h-4 text-slate-900" /></div>
          )}
          <Globe className={cn("w-7 h-7", method === 'digital' ? "text-slate-900" : "text-slate-300")} />
          <span className="text-[10px] font-black uppercase tracking-widest italic">PAGO ONLINE</span>
        </button>
      </div>
    </div>
  );
}
