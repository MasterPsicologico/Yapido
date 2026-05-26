
"use client"

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { generateFinancialAlerts } from '@/ai/flows/alertas-financieras-inteligentes';
import { Loader2, TrendingUp, AlertCircle, Lightbulb, BarChart as BarChartIcon, Sparkles, Wand2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';

interface AnalysisViewProps {
  transactions: any[];
  budgets: any[];
}

export function AnalysisView({ transactions, budgets }: AnalysisViewProps) {
  const { lastAnalysis, updateLastAnalysis } = useFinanceStore();
  const [loading, setLoading] = useState(false);

  const hasNewData = lastAnalysis 
    ? transactions.length !== lastAnalysis.transactionCountAtAnalysis 
    : transactions.length > 0;

  async function fetchAlerts() {
    if (transactions.length === 0) return;
    setLoading(true);
    try {
      const result = await generateFinancialAlerts({
        transactions: transactions.map(t => ({
          date: t.date || new Date().toISOString(),
          description: t.description,
          category: t.category,
          amount: t.type === 'ingreso' ? t.amount : -t.amount
        })),
        budgetLimits: budgets.map(b => ({ category: b.category, limit: b.limit })),
        timePeriod: 'último mes'
      });
      updateLastAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const pieData = budgets.map(b => ({
    name: b.category,
    value: b.spent
  })).filter(d => d.value > 0);

  const COLORS = ['#293462', '#00AFB9', '#6366F1', '#F43F5E', '#F59E0B', '#10B981'];

  return (
    <div className="flex-1 flex flex-col w-full bg-white overflow-y-auto m-0 p-0">
      {/* Header Flush Top */}
      <div className="shrink-0 bg-primary text-white p-4 flex flex-row items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <BarChartIcon className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-widest">Análisis Predictivo</h2>
        </div>
        {lastAnalysis && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAlerts}
            disabled={loading}
            className={cn(
              "h-7 text-[10px] bg-white/10 border-white/20 text-white hover:bg-white/20 uppercase font-black",
              hasNewData && "animate-pulse bg-accent border-none"
            )}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : (hasNewData ? 'Actualizar' : 'Re-analizar')}
          </Button>
        )}
      </div>

      <div className="bg-white flex-1">
        {/* Gráfico de Distribución */}
        <div className="p-6 border-b">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Distribución Real</h3>
          <div className="h-[250px] w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground italic text-xs py-10">
                Registra gastos para ver el análisis visual.
              </div>
            )}
          </div>
        </div>

        {/* Sección de Insights e IA */}
        <div className="p-0">
          {!lastAnalysis && !loading && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-6">
              <div className="p-5 bg-accent/10 rounded-full">
                <Sparkles className="w-12 h-12 text-accent" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Generar Informe IA</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Analizaremos tus patrones de gasto para darte consejos de ahorro personalizados.
                </p>
              </div>
              <Button 
                onClick={fetchAlerts} 
                disabled={transactions.length === 0}
                className="bg-accent text-white font-black py-6 px-10 rounded-xl shadow-xl shadow-accent/20 text-xs gap-2 uppercase tracking-widest"
              >
                Generar Análisis con IA
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="w-12 h-12 animate-spin text-accent" />
              <p className="text-[10px] font-black text-primary animate-pulse tracking-widest uppercase">Evolucionando Datos...</p>
            </div>
          )}

          {lastAnalysis && !loading && (
            <div className="divide-y animate-in slide-in-from-bottom-2 duration-500 pb-20">
              <div className="p-5 bg-primary/5 italic border-l-4 border-accent">
                <p className="text-[11px] text-primary font-medium leading-relaxed">
                  "{lastAnalysis.summary}"
                </p>
              </div>

              <div className="p-5 space-y-4">
                <h5 className="text-[10px] font-black uppercase text-destructive flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Áreas de Gasto Excesivo
                </h5>
                <div className="space-y-2">
                  {lastAnalysis.overspendingAreas?.length > 0 ? lastAnalysis.overspendingAreas.map((area: any, i: number) => (
                    <div key={i} className="p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                      <p className="text-[11px] font-bold text-destructive uppercase">{area.category}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{area.details}</p>
                    </div>
                  )) : <p className="text-[10px] text-muted-foreground italic">Presupuestos saludables.</p>}
                </div>
              </div>

              <div className="p-5 space-y-4">
                <h5 className="text-[10px] font-black uppercase text-accent flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> Hoja de Ruta de Ahorro
                </h5>
                <div className="space-y-2">
                  {lastAnalysis.savingsOpportunities?.map((op: any, i: number) => (
                    <div key={i} className="p-3 bg-accent/5 rounded-lg border border-accent/10">
                      <p className="text-[11px] font-bold text-accent uppercase">{op.opportunity}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{op.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {lastAnalysis.insights?.length > 0 && (
                <div className="p-5">
                  <h5 className="text-[10px] font-black uppercase text-muted-foreground mb-3">Patrones Detectados</h5>
                  <div className="flex flex-wrap gap-2">
                    {lastAnalysis.insights.map((insight: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[8px] font-black bg-muted py-1 px-3 border-none">
                        {insight}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
