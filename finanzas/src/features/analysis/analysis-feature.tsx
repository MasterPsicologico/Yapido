
"use client"

import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { generateFinancialAlerts } from '@/ai/flows/alertas-financieras-inteligentes';
import { 
  Loader2, 
  BarChart as BarChartIcon, 
  Sparkles, 
  AlertCircle, 
  Lightbulb, 
  TrendingUp, 
  Zap,
  ArrowRight,
  Wallet,
  Target,
  ArrowDownCircle,
  Bot,
  ShieldAlert,
  ChevronRight,
  Flame,
  ShieldX,
  Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

// Componente Interno: Diagrama de Sankey Dinámico (Flujo Maestro)
function SankeyFlow({ transactions, budgets, currency }: { transactions: any[], budgets: any[], currency: any }) {
  const height = 300;
  
  const data = useMemo(() => {
    const incomes = transactions.filter(t => t.type === 'ingreso');
    const expenses = transactions.filter(t => t.type === 'gasto');
    
    const totalIncome = incomes.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalSpent = expenses.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalLibre = Math.max(0, totalIncome - totalSpent);

    const incomeCats = Array.from(new Set(incomes.map(t => t.category)));
    const leftNodes = incomeCats.map(cat => ({
      name: cat,
      value: incomes.filter(t => t.category === cat).reduce((sum, t) => sum + (t.amount || 0), 0)
    })).filter(n => n.value > 0).sort((a, b) => b.value - a.value);

    const centerNodes = budgets.map(b => ({
      name: b.category,
      value: b.limit || b.spent,
      spent: b.spent
    })).filter(n => n.value > 0).sort((a, b) => b.value - a.value);

    const expenseCats = Array.from(new Set(expenses.map(t => t.category)));
    const rightNodes = expenseCats.map(cat => ({
      name: cat,
      value: expenses.filter(t => t.category === cat).reduce((sum, t) => sum + (t.amount || 0), 0)
    })).filter(n => n.value > 0).sort((a, b) => b.value - a.value);

    if (totalLibre > 0) {
      rightNodes.push({ name: 'CAPITAL LIBRE', value: totalLibre });
    }

    const maxColTotal = Math.max(
      totalIncome,
      centerNodes.reduce((s, n) => s + n.value, 0),
      rightNodes.reduce((s, n) => s + n.value, 0)
    );

    const scale = (height - 40) / (maxColTotal || 1);

    return { leftNodes, centerNodes, rightNodes, scale, totalIncome, totalSpent };
  }, [transactions, budgets]);

  if (data.totalIncome === 0 && data.totalSpent === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground italic text-[10px] uppercase tracking-widest bg-muted/5 rounded-[2rem] border border-dashed">
        <Zap className="w-8 h-8 mb-3 opacity-20" />
        Esperando flujo de datos...
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-[2.5rem] p-6 border shadow-sm overflow-hidden relative">
      <div className="flex justify-between items-center mb-8 px-2">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Mapa de Energía</span>
          <h4 className="text-[11px] font-black text-primary uppercase flex items-center gap-2">
            Diagrama de Flujo Maestro <Sparkles className="w-3 h-3 text-accent" />
          </h4>
        </div>
        <Badge className="bg-accent/10 text-accent border-none text-[8px] font-black px-2 py-0.5">Sankey v2.0</Badge>
      </div>

      <div className="relative h-[320px] w-full flex justify-between">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#00AFB9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>

        <div className="flex flex-col gap-4 z-10 w-[80px]">
          <div className="text-center mb-2">
            <Badge variant="outline" className="text-[7px] font-black border-green-200 text-green-600 bg-green-50">INGRESOS</Badge>
          </div>
          {data.leftNodes.map((n, i) => (
            <div key={i} className="group relative">
              <div 
                style={{ height: Math.max(10, n.value * data.scale) }}
                className="w-full bg-green-500/80 rounded-sm shadow-sm transition-all group-hover:scale-x-110 group-hover:bg-green-600"
              />
              <span className="absolute left-0 -bottom-4 text-[7px] font-black text-primary truncate w-full uppercase">{n.name}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 z-10 w-[80px]">
          <div className="text-center mb-2">
            <Badge variant="outline" className="text-[7px] font-black border-primary/20 text-primary bg-primary/5">METAS IA</Badge>
          </div>
          {data.centerNodes.map((n, i) => (
            <div key={i} className="group relative">
              <div 
                style={{ height: Math.max(10, n.value * data.scale) }}
                className="w-full bg-primary/20 border-l-4 border-primary rounded-sm transition-all group-hover:bg-primary/30"
              />
              <span className="absolute left-0 -bottom-4 text-[7px] font-black text-primary truncate w-full uppercase">{n.name}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 z-10 w-[80px]">
          <div className="text-center mb-2">
            <Badge variant="outline" className="text-[7px] font-black border-red-200 text-red-600 bg-red-50">DESTINO</Badge>
          </div>
          {data.rightNodes.map((n, i) => (
            <div key={i} className="group relative">
              <div 
                style={{ height: Math.max(10, n.value * data.scale) }}
                className={cn(
                  "w-full rounded-sm transition-all group-hover:scale-x-110",
                  n.name === 'CAPITAL LIBRE' ? "bg-accent/80 shadow-[0_0_10px_rgba(0,175,185,0.3)]" : "bg-destructive/60"
                )}
              />
              <span className="absolute left-0 -bottom-4 text-[7px] font-black text-primary truncate w-full uppercase">{n.name}</span>
            </div>
          ))}
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
          <path d="M 80 100 C 120 100, 120 100, 160 100" fill="none" stroke="#10B981" strokeWidth="20" strokeOpacity="0.1" />
          <path d="M 240 100 C 280 100, 280 150, 320 150" fill="none" stroke="#F43F5E" strokeWidth="15" strokeOpacity="0.1" />
          <path d="M 240 100 C 280 100, 280 250, 320 250" fill="none" stroke="#00AFB9" strokeWidth="10" strokeOpacity="0.1" />
        </svg>
      </div>

      <div className="mt-12 pt-6 border-t border-dashed flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">IA analizando fugas de capital...</p>
        </div>
        <p className="text-[10px] font-black text-primary">
          {currency.symbol}{data.totalSpent.toLocaleString()} <span className="opacity-30">/</span> {currency.symbol}{data.totalIncome.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export function AnalysisFeature() {
  const { transactions, budgets, lastAnalysis, updateLastAnalysis, currency, totals } = useFinanceStore();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isSurvivalMode = totals.libre <= 0;

  const projectionData = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    
    let currentBalance = totals.balance;
    const history = Array.from({ length: currentDay }, (_, i) => ({
      name: (i + 1).toString(),
      balance: currentBalance - (Math.random() * 5000), 
      type: 'real'
    }));

    const avgDailyExpense = transactions
      .filter(t => t.type === 'gasto')
      .reduce((sum, t) => sum + (t.amount || 0), 0) / Math.max(currentDay, 1);

    const projection = Array.from({ length: daysInMonth - currentDay }, (_, i) => {
      currentBalance -= avgDailyExpense;
      return {
        name: (currentDay + i + 1).toString(),
        balance: Math.max(currentBalance, 0),
        type: 'proyectado'
      };
    });

    return [...history, ...projection];
  }, [transactions, totals.balance]);

  async function fetchAlerts() {
    if (transactions.length === 0) {
      toast({
        title: "DATOS INSUFICIENTES",
        description: "El Cuartel necesita al menos un movimiento para iniciar la auditoría.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await generateFinancialAlerts({
        transactions: transactions.slice(0, 50).map(t => ({
          date: t.date.split('T')[0],
          description: t.description || 'Sin descripción',
          category: t.category || 'Varios',
          amount: t.type === 'ingreso' ? (t.amount || 0) : -(t.amount || 0)
        })),
        budgetLimits: budgets.map(b => ({ category: b.category, limit: b.limit || 0 })),
        timePeriod: 'último mes',
        isSurvivalMode
      });
      
      if (result) {
        updateLastAnalysis(result);
        toast({
          title: isSurvivalMode ? "RUTA DE ESCAPE MAESTRO" : "ANÁLISIS COMPLETADO",
          description: "La IA ha actualizado tu hoja de ruta estratégica.",
        });
      }
    } catch (err) {
      console.error('Error al generar alertas financieras:', err);
      toast({
        title: "ERROR DE CONEXIÓN",
        description: "El motor cognitivo no responde. Reintenta en unos segundos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-white overflow-y-auto m-0 p-0 pb-20">
      <div className={cn(
        "shrink-0 p-4 flex items-center justify-between shadow-md transition-colors duration-500 relative z-50",
        isSurvivalMode ? "bg-red-600 text-white" : "bg-primary text-white"
      )}>
        <div className="flex items-center gap-2">
          {isSurvivalMode ? <ShieldX className="w-5 h-5 animate-pulse" /> : <Sparkles className="w-5 h-5 text-accent" />}
          <h2 className="text-sm font-bold uppercase tracking-widest">
            {isSurvivalMode ? 'PROTOCOLO DE EMERGENCIA' : 'Cuartel de Inteligencia'}
          </h2>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAlerts} 
          disabled={loading}
          className={cn(
            "h-8 text-[10px] font-black uppercase border-white/20 hover:bg-white/10 relative z-[60] flex items-center gap-2",
            isSurvivalMode ? "bg-white text-red-600 border-none hover:bg-red-50" : "bg-white/10 text-white"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>CARGANDO...</span>
            </>
          ) : (
            isSurvivalMode ? 'GENERAR RUTA ESCAPE' : 'Actualizar IA'
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isSurvivalMode && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 border-b border-red-200 p-4 overflow-hidden mb-[5px]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-lg text-white">
                <Flame className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Modo Supervivencia Activo</p>
                <p className="text-[9px] font-bold text-red-500 uppercase mt-0.5">IA enfocada 100% en recortes y ahorro crítico</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-10">
        {/* Sección de Ruta de Escape (Solo en modo supervivencia) */}
        {isSurvivalMode && lastAnalysis?.survivalSteps && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Stethoscope className="w-4 h-4 text-red-600" />
              <h3 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Ruta de Escape Maestro</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {lastAnalysis.survivalSteps.map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 bg-white border-2 border-red-600 rounded-2xl flex gap-4 items-center shadow-lg shadow-red-600/10"
                >
                  <div className="h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-[11px] font-black text-red-600 uppercase tracking-tight">{step}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Entrenador IA: Detección de Patrones Ocultos */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className={cn("p-2 rounded-lg", isSurvivalMode ? "bg-red-100" : "bg-accent/10")}>
              <Bot className={cn("w-5 h-5", isSurvivalMode ? "text-red-600" : "text-accent")} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Entrenador IA</h3>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                {isSurvivalMode ? 'AUDITORÍA DE CRISIS' : 'Detección Conductual'}
              </p>
            </div>
          </div>

          {lastAnalysis?.behavioralPatterns && lastAnalysis.behavioralPatterns.length > 0 ? (
            <div className="space-y-3">
              {lastAnalysis.behavioralPatterns.map((p, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden border-2",
                    isSurvivalMode ? "bg-red-600 text-white border-white/20" : "bg-primary text-white border-accent/20"
                  )}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <Badge className={cn("text-white font-black text-[8px] uppercase tracking-widest border-none", isSurvivalMode ? "bg-black" : "bg-accent")}>
                      {isSurvivalMode ? 'RECORTE OBLIGATORIO' : 'ALERTA CONDUCTUAL'}
                    </Badge>
                    {isSurvivalMode ? <ShieldX className="w-5 h-5 text-white" /> : <ShieldAlert className="w-5 h-5 text-accent animate-pulse" />}
                  </div>
                  <p className="text-xs font-bold leading-relaxed mb-4 relative z-10">
                    "{p.pattern}"
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10">
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-60 mb-1">Impacto</p>
                      <p className="text-[10px] font-black uppercase">{p.impact}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase opacity-60 mb-1">Sugerencia Maestro</p>
                      <p className={cn("text-[10px] font-black uppercase", isSurvivalMode ? "text-white" : "text-accent")}>{p.action}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-muted/5 rounded-[2.5rem] border border-dashed border-muted/20">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Actualiza la IA para detectar tus debilidades financieras</p>
            </div>
          )}
        </section>

        {/* Gráfico de Proyección Predictiva */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" /> Proyección de Flujo
            </h3>
            <Badge variant="outline" className="text-[8px] font-black text-accent border-accent/20">30 DÍAS</Badge>
          </div>
          <div className="h-[200px] w-full bg-muted/5 rounded-[2.5rem] border p-4 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  formatter={(value: any) => [`${currency.symbol}${Math.round(value).toLocaleString()}`, 'Balance']}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke={isSurvivalMode ? "#EF4444" : "#00AFB9"} 
                  strokeWidth={3} 
                  dot={false}
                  strokeDasharray={(props: any) => props.payload?.type === 'proyectado' ? '5 5' : '0'}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[8px] text-muted-foreground italic text-center uppercase tracking-widest">
            Línea continua: Real | Línea punteada: Predicción IA
          </p>
        </section>

        {/* Diagrama de Sankey */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-accent" /> Visualización de Flujo Vital
          </h3>
          <SankeyFlow transactions={transactions} budgets={budgets} currency={currency} />
          <p className="text-[8px] text-muted-foreground italic text-center uppercase tracking-widest px-4">
            Los hilos muestran cómo tu capital fluye desde el ingreso hacia tus metas y se desintegra en gastos reales.
          </p>
        </section>

        {/* Insights Predictivos */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              {isSurvivalMode ? 'ANÁLISIS DE RECORTE' : 'Insights del Copiloto'}
            </h3>
          </div>
          
          {lastAnalysis && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className={cn(
                "p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden",
                isSurvivalMode ? "bg-black text-white" : "bg-primary text-white"
              )}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
                <p className="text-[11px] font-medium leading-relaxed italic opacity-90 relative z-10">"{lastAnalysis.summary}"</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(lastAnalysis.overspendingAreas || []).map((area, i) => (
                  <div key={i} className="p-4 bg-destructive/5 border border-destructive/10 rounded-2xl flex gap-3 items-start">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-destructive uppercase">{area.category}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{area.details}</p>
                    </div>
                  </div>
                ))}
                {(lastAnalysis.savingsOpportunities || []).map((op, i) => (
                  <div key={i} className="p-4 bg-accent/5 border border-accent/10 rounded-2xl flex gap-3 items-start">
                    <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-accent uppercase">{op.opportunity}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{op.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}
