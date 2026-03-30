
"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface EarningsTabProps {
  balance: number;
}

export function EarningsTab({ balance }: EarningsTabProps) {
  return (
    <Card className="border-none rounded-[48px] bg-slate-900 text-white p-10 overflow-hidden relative shadow-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="relative z-10 space-y-10">
        <Badge className="bg-green-500 text-white border-none rounded-full px-5 font-black h-8 text-[10px] uppercase">COBRO ACTIVO</Badge>
        <div className="space-y-2">
          <span className="text-7xl font-black tracking-tighter leading-none">
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(balance)}
          </span>
          <p className="text-slate-400 text-xs font-bold uppercase italic ml-2">Saldo neto actual</p>
        </div>
        <Button className="w-full h-20 rounded-full bg-white text-slate-900 font-black text-xl uppercase tracking-widest transition-transform active:scale-95">Solicitar Pago</Button>
      </div>
    </Card>
  );
}
