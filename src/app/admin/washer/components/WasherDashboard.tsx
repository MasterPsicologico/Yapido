
"use client";

import { Card } from '@/components/ui/card';
import { TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface WasherDashboardProps {
  stats: any;
}

export function WasherDashboard({ stats }: WasherDashboardProps) {
  const currencyFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* GRID DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none rounded-[40px] bg-slate-950 text-white p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-4">Ingresos Netos (95%)</p>
          <h3 className="text-4xl font-black italic tracking-tighter leading-none">{currencyFormatter.format(stats.totalNet)}</h3>
          <div className="mt-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Flujo Real</span>
          </div>
        </Card>

        <Card className="border-none rounded-[40px] bg-white p-8 shadow-xl ring-1 ring-black/[0.03]">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Tasa Plataforma (5%)</p>
          <h3 className="text-4xl font-black italic tracking-tighter leading-none text-red-500">-{currencyFormatter.format(stats.totalPlatform)}</h3>
          <div className="mt-6 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Servicio Activo</span>
          </div>
        </Card>

        <Card className="border-none rounded-[40px] bg-primary text-white p-8 shadow-2xl">
          <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em] mb-4">Total Bruto</p>
          <h3 className="text-4xl font-black italic tracking-tighter leading-none">{currencyFormatter.format(stats.totalGross)}</h3>
          <div className="mt-6 flex items-center gap-2">
            <Zap className="w-4 h-4 text-white" />
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">Volumen Total</span>
          </div>
        </Card>
      </div>

      {/* GRÁFICO DE RENDIMIENTO */}
      <Card className="border-none rounded-[48px] shadow-2xl bg-white p-10 ring-1 ring-black/[0.03]">
        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-10">Rendimiento Semanal</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.dailyEarnings}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="monto" radius={[8, 8, 0, 0]}>
                {stats.dailyEarnings.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.monto > 0 ? '#3b82f6' : '#f1f5f9'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
