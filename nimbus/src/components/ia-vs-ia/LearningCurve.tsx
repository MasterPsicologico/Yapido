'use client';

import { useMemo } from 'react';
import type { IALearningState } from '@/lib/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface LearningCurveProps {
  learningStates: IALearningState[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 bg-[hsl(220,15%,12%)] border border-[hsl(220,15%,20%)] text-xs shadow-lg">
        <p className="font-bold text-[hsl(220,10%,90%)]">Turno {label}</p>
        <p style={{ color: 'hsl(190,80%,50%)' }}>
          Coherencia: {(data.coherenceScore * 100).toFixed(0)}%
        </p>
        <p className="text-[hsl(220,10%,45%)]">Agente: {data.agentName}</p>
      </div>
    );
  }
  return null;
};


export default function LearningCurve({ learningStates }: LearningCurveProps) {

  const chartData = useMemo(() => {
    return learningStates?.map(state => ({
      turn: state.turn,
      coherenceScore: state.coherenceScore,
      agentName: state.agentId === 'dr-sharma' ? 'Dra. Sharma' : 'Dr. Tanaka'
    })) || [];
  }, [learningStates]);

  if (!learningStates || learningStates.length === 0) {
      return (
         <div className="ia-metrics">
            <div className="ia-metrics-empty">
                <div className="ia-metrics-empty-text">
                    <p className="ia-metrics-empty-title">Sin Datos</p>
                    <p className="ia-metrics-empty-desc">Inicia una simulación para ver la curva de coherencia en tiempo real.</p>
                </div>
            </div>
         </div>
      )
  }

  return (
    <div className="ia-metrics">
        <Card className="ia-metrics-card">
            <CardHeader className="ia-metrics-header">
                <CardTitle className="ia-metrics-title">Curva de Aprendizaje y Coherencia</CardTitle>
                <CardDescription className="ia-metrics-desc">Visualización de la coherencia en la conversación de la IA a lo largo del tiempo.</CardDescription>
            </CardHeader>
            <CardContent className="ia-metrics-body">
                <div className="ia-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: -10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,15%)" />
                            <XAxis
                              dataKey="turn"
                              name="Turno"
                              tick={{ fill: 'hsl(220,10%,45%)', fontSize: 11 }}
                              axisLine={{ stroke: 'hsl(220,15%,18%)' }}
                              tickLine={{ stroke: 'hsl(220,15%,18%)' }}
                            />
                            <YAxis
                              domain={[0, 1]}
                              tickFormatter={(value) => `${value * 100}%`}
                              tick={{ fill: 'hsl(220,10%,45%)', fontSize: 11 }}
                              axisLine={{ stroke: 'hsl(220,15%,18%)' }}
                              tickLine={{ stroke: 'hsl(220,15%,18%)' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <defs>
                                <linearGradient id="coherenceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(190,80%,50%)" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="hsl(190,80%,50%)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="coherenceScore"
                              stroke="hsl(190,80%,50%)"
                              fill="url(#coherenceGradient)"
                              strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}