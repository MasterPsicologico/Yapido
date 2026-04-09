
"use client";

import { Bar, BarChart, XAxis, Cell, Tooltip } from 'recharts';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChallengeChartProps {
  orders: any[] | null;
}

/**
 * ChallengeChart - Motor de Visualización de Transacciones Reales.
 * Refleja el flujo de caja diario en pesos colombianos.
 */
export function ChallengeChart({ orders }: ChallengeChartProps) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start, end }).map(date => {
    const dayName = format(date, 'EEE', { locale: es }).toUpperCase();
    
    // Filtrado de órdenes con validación estricta de fecha
    const dayOrders = orders?.filter(o => {
      const ts = o.completedAt || o.deliveredAt || o.createdAt;
      const orderDate = ts?.toDate?.() || (ts?.seconds ? new Date(ts.seconds * 1000) : null);
      if (!orderDate) return false;
      return isSameDay(orderDate, date);
    }) || [];

    // SUMA DE VALORES DE TRANSACCIÓN REALES
    const monto = dayOrders.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    return {
      name: dayName,
      monto: monto,
    };
  });

  const chartConfig: ChartConfig = {
    monto: { label: "Ingresos", color: "hsl(var(--primary))" },
  };

  const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  return (
    <div className="h-[180px] w-full">
      <ChartContainer config={chartConfig}>
        <BarChart data={days}>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border-none font-black italic text-[10px] animate-in zoom-in duration-200">
                    {currencyFormatter.format(payload[0].value as number)}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="monto" radius={[6, 6, 0, 0]}>
            {days.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.monto > 0 ? 'hsl(var(--primary))' : '#f1f5f9'} 
                className="transition-all duration-500 hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
