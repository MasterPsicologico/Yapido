
"use client";

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, ShieldCheck, Zap, Clock, AlertCircle, ArrowRight, Calendar, BarChart3 } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { checkIsBusinessOpen } from '@/components/home/HomeActions';

interface WasherDashboardProps {
  stats: any;
  store?: any;
  onOpenSettings: () => void;
}

/**
 * CustomTooltip - Terminal de Información Financiera.
 * Diseñado para entregar datos críticos de forma instantánea y profesional.
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formattedMonto = new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(data.monto);

    return (
      <div className="bg-slate-900 text-white p-5 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 animate-in zoom-in duration-200 min-w-[180px]">
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">{label}</p>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
        
        <div className="space-y-3">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Ingresos Brutos</p>
            <p className="text-2xl font-black italic tracking-tighter text-white leading-none">
              {formattedMonto}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5">
            <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <div>
              <p className="text-[7px] font-black text-slate-400 uppercase leading-none">Equipos en uso</p>
              <p className="text-sm font-black text-white italic">{data.cantidad} Lavadoras</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex items-start gap-2">
            <TrendingUp className={cn("w-3 h-3 mt-0.5", data.monto > 200000 ? "text-green-400" : "text-primary")} />
            <p className="text-[9px] font-bold text-slate-400 leading-tight uppercase italic tracking-tight">
              {data.monto > 250000 ? "¡Día de Alta Demanda! Flota al límite." : data.monto > 150000 ? "Rendimiento óptimo del sistema." : "Flujo estable de operaciones."}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function WasherDashboard({ stats, store, onOpenSettings }: WasherDashboardProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const currencyFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const hasHours = store?.openTime && store?.closeTime;
  const isOpen = checkIsBusinessOpen(store?.openTime, store?.closeTime);

  const chartData = useMemo(() => {
    if (period === 'daily') return [
      { name: '08:00', monto: 15000, cantidad: 1 }, 
      { name: '12:00', monto: 45000, cantidad: 3 }, 
      { name: '16:00', monto: 30000, cantidad: 2 }, 
      { name: '20:00', monto: 60000, cantidad: 4 }
    ];
    if (period === 'monthly') return [
      { name: 'Sem 1', monto: 450000, cantidad: 22 }, 
      { name: 'Sem 2', monto: 620000, cantidad: 31 }, 
      { name: 'Sem 3', monto: 510000, cantidad: 25 }, 
      { name: 'Sem 4', monto: 800000, cantidad: 40 }
    ];
    if (period === 'yearly') return [
      { name: 'Ene', monto: 2500000, cantidad: 125 }, 
      { name: 'Feb', monto: 3100000, cantidad: 155 }, 
      { name: 'Mar', monto: 2800000, cantidad: 140 }, 
      { name: 'Abr', monto: 4200000, cantidad: 210 }
    ];
    return stats.dailyEarnings?.length > 0 ? stats.dailyEarnings : [
      { name: 'LUN', monto: 85000, cantidad: 4 }, 
      { name: 'MAR', monto: 120000, cantidad: 6 }, 
      { name: 'MIE', monto: 95000, cantidad: 5 }, 
      { name: 'JUE', monto: 150000, cantidad: 7 }, 
      { name: 'VIE', monto: 210000, cantidad: 10 }, 
      { name: 'SAB', monto: 320000, cantidad: 16 }, 
      { name: 'DOM', monto: 280000, cantidad: 14 }
    ];
  }, [period, stats.dailyEarnings]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* CUADERNO DIGITAL: SELECTORES DE PERIODO */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'daily', label: 'Diario' },
          { id: 'weekly', label: 'Semanal' },
          { id: 'monthly', label: 'Mensual' },
          { id: 'yearly', label: 'Anual' }
        ].map(p => (
          <Button 
            key={p.id}
            onClick={() => setPeriod(p.id as any)}
            variant={period === p.id ? 'default' : 'outline'}
            className={cn(
              "rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest border-none transition-all",
              period === p.id ? "bg-primary text-white shadow-lg" : "bg-white text-slate-400 hover:bg-slate-50 shadow-sm"
            )}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* GRID DE MÉTRICAS ANALÍTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none rounded-[40px] bg-slate-950 text-white p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-4">Ingresos Netos ({period})</p>
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
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Kernel Activo</span>
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

      {/* GRÁFICO DE ANÁLISIS DE INGRESOS */}
      <Card className="border-none rounded-[48px] shadow-2xl bg-white p-10 ring-1 ring-black/[0.03]">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Análisis de Flujo</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">REPORTE {period.toUpperCase()} EN VIVO</p>
          </div>
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                tickFormatter={(val) => `$${val/1000}k`}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: '#f8fafc', radius: 10 }}
              />
              <Bar dataKey="monto" radius={[10, 10, 0, 0]}>
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.monto > 0 ? 'hsl(var(--primary))' : '#f1f5f9'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* CONTROL DE HORARIO MAESTRO */}
      <Card className="border-none rounded-[48px] bg-white p-10 shadow-xl ring-1 ring-black/[0.03] overflow-hidden relative group">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-20 h-20 rounded-[32px] flex items-center justify-center shadow-inner transition-all duration-500",
              !hasHours ? "bg-red-50 text-red-500" : isOpen ? "bg-green-50 text-green-500" : "bg-slate-50 text-slate-400"
            )}>
              {!hasHours ? <AlertCircle className="w-10 h-10 animate-pulse" /> : <Clock className="w-10 h-10" />}
            </div>
            <div className="space-y-1.5">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Gestión Horaria</h3>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                  !hasHours ? "bg-red-500 text-white" : isOpen ? "bg-green-500 text-white" : "bg-slate-800 text-white"
                )}>
                  {!hasHours ? "HORARIO NO DEFINIDO" : isOpen ? "VITRINA ABIERTA" : "VITRINA CERRADA"}
                </span>
                <div className="h-1 w-1 rounded-full bg-slate-200" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {hasHours ? `${store.openTime} — ${store.closeTime}` : "Establece tu jornada laboral"}
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={onOpenSettings}
            className="rounded-full h-16 px-10 bg-slate-900 text-white font-black uppercase text-xs tracking-widest gap-3 shadow-2xl active:scale-95 transition-all"
          >
            {hasHours ? "EDITAR HORARIO" : "CONFIGURAR AHORA"} <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
