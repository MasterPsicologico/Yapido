
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, XAxis, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Timer, Star, TrendingUp, CalendarClock } from 'lucide-react';
import { es } from 'date-fns/locale';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface WeeklyChallengeProps {
  orders: any[] | null;
}

export function WeeklyChallenge({ orders }: WeeklyChallengeProps) {
  // Generar datos para la semana actual
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start, end }).map(date => {
    const dayName = format(date, 'EEE', { locale: es }).toUpperCase();
    const dayOrders = orders?.filter(o => {
      const orderDate = o.createdAt?.toDate?.() || new Date();
      return format(orderDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    }) || [];

    const avgRating = dayOrders.length > 0 
      ? dayOrders.reduce((acc, curr) => acc + (curr.driverRatingByCustomer || 5), 0) / dayOrders.length 
      : 0;

    return {
      name: dayName,
      entregas: dayOrders.length,
      rating: avgRating,
      fullDate: date
    };
  });

  const chartConfig = {
    entregas: { label: "Entregas", color: "hsl(var(--primary))" },
  };

  return (
    <Card className="border-none rounded-[40px] shadow-2xl bg-white overflow-hidden ring-1 ring-black/[0.03]">
      <CardHeader className="p-8 pb-2">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Reto de la Semana</p>
          <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
            <TrendingUp className="text-primary w-7 h-7" /> Rendimiento
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 pt-4 space-y-6">
        {/* GRÁFICO */}
        <div className="h-[180px] w-full">
          <ChartContainer config={chartConfig}>
            <BarChart data={days}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="entregas" radius={[6, 6, 0, 0]}>
                {days.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.entregas > 0 ? 'hsl(var(--primary))' : '#f1f5f9'} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* INDICADOR DE CIERRE DE CICLO REUBICADO */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Cierre de Ciclo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            <span className="text-[11px] font-black text-slate-700 italic uppercase">Domingo 23:59</span>
          </div>
        </div>
        
        {/* STATS INFERIORES */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center text-center sm:flex-row sm:text-left gap-3 shadow-sm overflow-hidden min-w-0">
            <div className="w-10 h-10 bg-yellow-50 rounded-2xl flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-1">Promedio</p>
              <p className="text-xl font-black italic text-slate-900 tracking-tighter leading-none">5.0</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center text-center sm:flex-row sm:text-left gap-3 shadow-sm overflow-hidden min-w-0">
            <div className="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center shrink-0">
              <Timer className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-1">Estado</p>
              <p className="text-sm font-black italic text-primary tracking-tighter uppercase leading-none">ACTIVO</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
