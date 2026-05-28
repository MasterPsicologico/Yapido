'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { ChatbotState } from '@/lib/types';
import { useMemo } from 'react';

type StrategyRadarChartProps = {
  history: ChatbotState[];
  onPointClick: (state: ChatbotState) => void;
};

const STRATEGY_CATEGORIES = [
  'Validación Empática', 'Pregunta Socrática', 'Reencuadre Cognitivo',
  'Sugerencia de Acción', 'Metáfora/Analogía', 'Psicoeducación'
];

export default function StrategyRadarChart({ history, onPointClick }: StrategyRadarChartProps) {
  const chartData = useMemo(() => {
    // AÑADIDO: Filtro de seguridad para asegurar que el historial y el primer estado existan.
    if (!history || history.length === 0 || !history[0]) return [];

    const latestState = history[0];
    const latestClassification = latestState.blueprint.strategy_classification || {};

    return STRATEGY_CATEGORIES.map(category => ({
      strategy: category,
      value: latestClassification[category] || 0,
      fullMark: 1,
    }));
  }, [history]);

  if (!chartData || chartData.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No hay datos de estrategia para mostrar.</div>;
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData} onClick={(data) => data && onPointClick(history[data.activeTooltipIndex || 0])}>
        <PolarGrid stroke="hsl(var(--border) / 0.5)" />
        <PolarAngleAxis dataKey="strategy" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
        <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
        <Radar name="Estrategia" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
         <Tooltip 
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                fontSize: '12px'
            }}
         />
      </RadarChart>
    </ResponsiveContainer>
  );
}
