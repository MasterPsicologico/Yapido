
"use client";

import { Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RoutePriceProps {
  formattedPrice: string;
  requestHours: number;
  washerType: string;
}

export function RoutePrice({ formattedPrice, requestHours, washerType }: RoutePriceProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-red-600">
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">GANANCIA BRUTA</span>
        </div>
        <h2 className="text-6xl sm:text-7xl font-black italic tracking-tighter text-red-600 leading-none drop-shadow-sm">
          {formattedPrice}
        </h2>
      </div>
      
      <div className="text-right flex flex-col items-end gap-2">
        <div className="bg-slate-900 text-white p-3 rounded-[20px] shadow-2xl flex flex-col items-center justify-center min-w-[80px] border-b-4 border-slate-950 group-hover:scale-105 transition-transform duration-500">
          <span className="text-xl font-black italic tracking-tighter leading-none text-primary">{requestHours}H</span>
          <span className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-60">MISIÓN</span>
        </div>
        <Badge className="bg-primary/10 text-primary border-none text-[7px] font-black uppercase px-2 italic">
          {washerType === 'automatica' ? 'Auto' : 'Semi'}
        </Badge>
      </div>
    </div>
  );
}
