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
      <div className="p-2 bg-background/80 border rounded-lg shadow-xl text-xs">
        <p className="font-bold">Turno {label}</p>
        <p style={{ color: payload[0].color }}>
          Coherencia: {(data.coherenceScore * 100).toFixed(0)}%
        </p>
        <p className="text-muted-foreground">Agente: {data.agentName}</p>
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
         <div className="flex h-full items-center justify-center p-8">
            <Card className="text-center">
                 <CardHeader>
                    <CardTitle>Sin Datos de Aprendizaje</CardTitle>
                    <CardDescription>Inicia una simulación para ver la curva de coherencia en tiempo real.</CardDescription>
                </CardHeader>
            </Card>
         </div>
      )
  }

  return (
    <div className="p-4 md:p-8">
        <Card>
            <CardHeader>
                <CardTitle>Curva de Aprendizaje y Coherencia</CardTitle>
                <CardDescription>Visualización de la coherencia en la conversación de la IA a lo largo del tiempo.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: -10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                            <XAxis dataKey="turn" name="Turno" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <YAxis domain={[0, 1]} tickFormatter={(value) => `${value * 100}%`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <defs>
                                <linearGradient id="coherenceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="coherenceScore" stroke="hsl(var(--primary))" fill="url(#coherenceGradient)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
    