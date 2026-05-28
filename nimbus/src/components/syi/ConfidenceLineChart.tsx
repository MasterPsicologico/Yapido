'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { ChatbotState } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type ConfidenceLineChartProps = {
  history: ChatbotState[];
  onPointClick: (state: ChatbotState) => void;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background/80 border rounded-lg shadow-xl text-xs">
        <p className="font-bold">{format(new Date(label), "d MMM, HH:mm", { locale: es })}</p>
        <p style={{ color: payload[0].color }}>
          Confianza: {(payload[0].value * 100).toFixed(0)}%
        </p>
      </div>
    );
  }
  return null;
};

export default function ConfidenceLineChart({ history, onPointClick }: ConfidenceLineChartProps) {
  const chartData = history
    .filter(state => state.updatedAt) // <-- AÑADIDO: Filtro de seguridad
    .map(state => ({
      date: state.updatedAt.toDate(),
      confidence: state.blueprint.model_confidence || 0.5,
      fullState: state,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

   if (!chartData || chartData.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No hay historial de confianza para mostrar.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: -10,
          bottom: 5,
        }}
        onClick={(data) => data && onPointClick(data.activePayload?.[0].payload.fullState)}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
        <XAxis
          dataKey="date"
          tickFormatter={(time) => format(time, 'd MMM')}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          minTickGap={25}
        />
        <YAxis 
          domain={[0, 1]} 
          tickFormatter={(value) => `${value * 100}%`}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <defs>
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
        </defs>
        <Area type="monotone" dataKey="confidence" stroke="hsl(var(--primary))" fill="url(#confidenceGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
