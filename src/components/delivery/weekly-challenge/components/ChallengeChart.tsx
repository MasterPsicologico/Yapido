
"use client";

import { Bar, BarChart, XAxis, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChallengeChartProps {
  orders: any[] | null;
}

export function ChallengeChart({ orders }: ChallengeChartProps) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start, end }).map(date => {
    const dayName = format(date, 'EEE', { locale: es }).toUpperCase();
    const dayOrders = orders?.filter(o => {
      const orderDate = o.createdAt?.toDate?.() || new Date();
      return format(orderDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    }) || [];

    return {
      name: dayName,
      entregas: dayOrders.length,
    };
  });

  const chartConfig = {
    entregas: { label: "Entregas", color: "hsl(var(--primary))" },
  };

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
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="entregas" radius={[6, 6, 0, 0]}>
            {days.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.entregas > 0 ? 'hsl(var(--primary))' : '#f1f5f9'} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
