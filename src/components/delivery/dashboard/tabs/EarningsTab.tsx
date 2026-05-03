
"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, TrendingUp, Wallet } from 'lucide-react';

interface EarningsTabProps {
  balance: number;
  commissionRate?: number;
  revenueToday?: number;
}

export function EarningsTab({ balance, commissionRate = 0.20, revenueToday = 0 }: EarningsTabProps) {
  const driverEarningsToday = Math.round(revenueToday * commissionRate);

  const formatCOP = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-4">
      {/* Balance Principal */}
      <Card className="border-none rounded-[48px] bg-slate-900 text-white p-10 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-10">
          <Badge className="bg-green-500 text-white border-none rounded-full px-5 font-black h-8 text-[10px] uppercase">COBRO ACTIVO</Badge>
          <div className="space-y-2">
            <span className="text-7xl font-black tracking-tighter leading-none">
              {formatCOP(balance)}
            </span>
            <p className="text-slate-400 text-xs font-bold uppercase italic ml-2">Saldo neto actual</p>
          </div>
          <Button className="w-full h-20 rounded-full bg-white text-slate-900 font-black text-xl uppercase tracking-widest transition-transform active:scale-95">Solicitar Pago</Button>
        </div>
      </Card>

      {/* Desglose de Hoy */}
      <Card className="border-none rounded-[32px] bg-white p-6 shadow-sm border border-slate-100">
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Desglose de Hoy</h3>
        <div className="space-y-3">
          {/* Ingreso total del negocio */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-xs font-bold text-slate-500">Ingreso del Negocio</span>
            </div>
            <span className="text-sm font-black text-slate-900">{formatCOP(revenueToday)}</span>
          </div>

          {/* Comisión del repartidor */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-xs font-bold text-emerald-600">Tu Comisión ({Math.round(commissionRate * 100)}%)</span>
            </div>
            <span className="text-sm font-black text-emerald-600">{formatCOP(driverEarningsToday)}</span>
          </div>

          {/* Separador */}
          <div className="border-t border-dashed border-slate-200 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-slate-500" />
              </div>
              <span className="text-xs font-bold text-slate-400">Parte del Negocio</span>
            </div>
            <span className="text-sm font-black text-slate-400">{formatCOP(revenueToday - driverEarningsToday)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
