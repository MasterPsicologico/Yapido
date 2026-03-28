
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Timer, Star, TrendingUp } from 'lucide-react';
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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Reto de la Semana</p>
            <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
              <TrendingUp className="text-primary w-7 h-7" /> Rendimiento
            </CardTitle>
          </div>
          <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex flex-col items-end">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cierre de Ciclo</p>
            <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
              <Timer className="w-3 h-3 text-orange-500" /> Domingo 23:59
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-4">
        <div className="h-[200px] w-full">
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
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Promedio</p>
              <p className="text-xl font-black italic text-slate-900 tracking-tighter">5.0 Estrellas</p>
            </div>
          </div>
          <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10 flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Timer className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
              <p className="text-xl font-black italic text-primary tracking-tighter">EN CURSO</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
