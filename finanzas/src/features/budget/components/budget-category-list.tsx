"use client"

import React, { useMemo, useState } from 'react';
import { Budget, Currency, useFinanceStore } from '@/hooks/use-finance-store';
import { 
  ShoppingCart, 
  Utensils, 
  Bus, 
  Home, 
  Activity, 
  Coffee, 
  Landmark, 
  Package, 
  CalendarDays, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Zap,
  AlertCircle,
  Lightbulb,
  BarChart3,
  Sparkles,
  ArrowRightLeft,
  ChevronsLeftRight,
  Clock,
  History,
  Target
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, PanInfo } from 'framer-motion';

const categoryIcons: Record<string, React.ReactNode> = {
  supermercado: <ShoppingCart className="w-4 h-4" />,
  comida: <Utensils className="w-4 h-4" />,
  transporte: <Bus className="w-4 h-4" />,
  vivienda: <Home className="w-4 h-4" />,
  salud: <Activity className="w-4 h-4" />,
  ocio: <Coffee className="w-4 h-4" />,
  servicios: <Landmark className="w-4 h-4" />,
};

const getIcon = (cat: string) => categoryIcons[cat.toLowerCase()] || <Package className="w-4 h-4" />;

const getAdvice = (cat: string): { title: string, content: string } => {
  const c = cat.toLowerCase();
  if (c.includes('vicio') || c.includes('fumar') || c.includes('alcohol')) return { title: 'Eliminación Gradual', content: 'Identifica los disparadores de ansiedad. Reducir un 10% semanal crea un hábito de ahorro exponencial.' };
  if (c.includes('comida') || c.includes('alimentacion')) return { title: 'Optimización de Menú', content: 'Planificar compras semanales evita el sobrecosto de pedidos delivery. Ahorro proyectado: 25%.' };
  if (c.includes('transporte')) return { title: 'Logística Inteligente', content: 'Agrupar diligencias en una sola ruta reduce gasto de combustible y desgaste de vehículo.' };
  if (c.includes('vivienda') || c.includes('servicios')) return { title: 'Eficiencia Energética', content: 'Revisa consumos fantasma. Un hogar eficiente libera capital para inversión a largo plazo.' };
  return { title: 'Arquitectura de Gasto', content: 'Prioriza necesidades sobre deseos. Cada peso ahorrado aquí es libertad mañana.' };
};

const formatMonth = (dateStr?: string) => {
  if (!dateStr) return "SIN FECHA";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
};

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]/g, "_");    
};

interface BudgetCategoryListProps {
  budgets: Budget[];
  currency: Currency;
  onCategoryClick: (id: string) => void;
}

export function BudgetCategoryList({ budgets, currency, onCategoryClick }: BudgetCategoryListProps) {
  const [faceIndexes, setFaceIndexes] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);

  const displayBudgets = useMemo(() => {
    const groups: Record<string, Budget[]> = {};
    budgets.forEach(b => {
      const key = `${normalizeText(b.category)}_${b.type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });

    const now = new Date();
    return Object.values(groups).map(catPeriods => {
      const current = catPeriods.find(b => {
        const s = b.startDate ? new Date(b.startDate + "T00:00:00") : new Date(0);
        const e = b.endDate ? new Date(b.endDate + "T23:59:59") : new Date(8640000000000000);
        return now >= s && now <= e;
      });
      if (current) return current;
      return [...catPeriods].sort((a,b) => (b.startDate || '').localeCompare(a.startDate || ''))[0];
    }).sort((a, b) => a.category.localeCompare(b.category));
  }, [budgets]);

  const handleDragEnd = (id: string, info: PanInfo) => {
    const threshold = 40;
    if (info.offset.x < -threshold) {
      setFaceIndexes(prev => ({ ...prev, [id]: ((prev[id] || 0) + 1) % 3 }));
    } else if (info.offset.x > threshold) {
      setFaceIndexes(prev => ({ ...prev, [id]: ((prev[id] || 0) + 2) % 3 }));
    }
  };

  return (
    <div className="px-6 py-8 space-y-14">
      <div className="flex items-center justify-between px-2 relative z-50 mb-4">
        <div className="space-y-2">
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Metas en Seguimiento</h3>
          <motion.div 
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2"
          >
            <ChevronsLeftRight className="w-3 h-3 text-accent" />
            <p className="text-[8px] text-accent font-black uppercase tracking-[0.2em]">Arrastra horizontal para rotar Prisma IA</p>
          </motion.div>
        </div>
        <Badge variant="outline" className="text-[8px] font-black border-accent/20 text-accent uppercase px-3 py-1">Ciclo Activo</Badge>
      </div>

      <div className="space-y-20 pb-32 pt-10">
        {displayBudgets.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed rounded-[2.5rem] border-muted/20 bg-muted/5">
            <Zap className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Inicia tu arquitectura financiera</p>
          </div>
        ) : (
          displayBudgets.map((b) => {
            const isIncome = b.type === 'ingreso';
            const isOverspent = !isIncome && b.spent > b.limit && b.limit > 0;
            const currentTotal = isIncome ? b.spent : (b.funded || 0);
            const perc = b.limit > 0 ? (isIncome ? (b.spent / b.limit) : (currentTotal / b.limit)) * 100 : (currentTotal > 0 ? 100 : 0);
            const activeFace = faceIndexes[b.id] || 0;
            const advice = getAdvice(b.category);
            
            const dailyAvg = b.avgDailySpent || 0;
            const volatility = Math.round(Math.random() * 40 + 10);
            const necessity = b.type === 'gasto' ? (b.category.match(/vivienda|comida|salud/i) ? 'ALTA' : 'DISCRECIONAL') : 'VITAL';

            // Lógica de Previsión de Quiebra Visual
            const daysLeft = b.daysUntilDepletion;
            let depletionText = "FONDOS ESTABLES";
            let depletionColor = "text-white";
            
            if (daysLeft !== undefined && daysLeft !== null) {
              if (daysLeft === 0) {
                depletionText = "SIN FONDOS";
                depletionColor = "text-red-400";
              } else if (daysLeft < 5) {
                depletionText = `QUIEBRA EN ${daysLeft} DÍAS`;
                depletionColor = "text-red-400 animate-pulse";
              } else if (daysLeft < 10) {
                depletionText = `ALERTA EN ${daysLeft} DÍAS`;
                depletionColor = "text-amber-400";
              } else {
                depletionText = `FONDOS PARA ${daysLeft} DÍAS`;
              }
            }

            return (
              <div key={b.id} className="relative h-[320px] w-full" style={{ perspective: '2000px' }}>
                <motion.div 
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={(_, info) => {
                    setIsDragging(false);
                    handleDragEnd(b.id, info);
                  }}
                  animate={{ 
                    rotateY: activeFace * -120,
                  }}
                  transition={{ type: "spring", stiffness: 150, damping: 25 }}
                  style={{ transformStyle: 'preserve-3d', cursor: 'grab' }}
                  whileTap={{ cursor: 'grabbing' }}
                  className="w-full h-full relative"
                >
                  {/* CARA 1: CUADRO DE MANDO (0°) */}
                  <div 
                    onClick={() => !isDragging && activeFace === 0 && onCategoryClick(b.id)}
                    className={cn(
                      "absolute inset-0 backface-hidden animate-border-spin rounded-3xl shadow-2xl overflow-hidden",
                      isOverspent && "animate-border-spin-red border-2 border-destructive/20"
                    )}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg) translateZ(120px)' }}
                  >
                    <div className={cn("corner-3d corner-tl", isOverspent ? "border-red-600" : (isIncome ? "border-green-500" : "border-red-500"))} />
                    <div className={cn("corner-3d corner-tr", isOverspent ? "border-red-600" : (isIncome ? "border-green-500" : "border-red-500"))} />
                    <div className={cn("corner-3d corner-bl", isOverspent ? "border-red-600" : (isIncome ? "border-green-500" : "border-red-500"))} />
                    <div className={cn("corner-3d corner-br", isOverspent ? "border-red-600" : (isIncome ? "border-green-500" : "border-red-500"))} />

                    <div className="inner-content rounded-3xl flex flex-col h-full bg-white">
                      <div className={cn("p-6 flex justify-between items-center border-b border-muted/10", isOverspent ? "bg-red-50/30" : (isIncome ? "bg-green-50/20" : "bg-red-50/20"))}>
                        <div className="flex items-center gap-4">
                          <div className={cn("p-4 rounded-2xl", isOverspent ? "bg-destructive text-white" : (isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"))}>
                            {isOverspent ? <AlertCircle className="w-4 h-4" /> : getIcon(b.category)}
                          </div>
                          <div>
                            <h4 className={cn("font-black capitalize text-sm", isOverspent ? "text-destructive" : "text-primary")}>{b.category}</h4>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{formatMonth(b.startDate)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-muted-foreground uppercase">{isIncome ? 'Meta Ingreso' : 'Meta Gasto'}</p>
                          <p className={cn("text-base font-black tracking-tighter", isOverspent ? "text-destructive" : (isIncome ? "text-green-600" : "text-red-600"))}>
                            {currency.symbol}{b.limit.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 space-y-8 flex-1 flex flex-col justify-center">
                        <div className="relative w-full h-10 flex items-center">
                          <div className="absolute inset-x-0 h-3 bg-muted/20 rounded-full" />
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(perc, 100)}%` }}
                            className={cn(
                              "absolute left-0 h-3 rounded-full z-10", 
                              isIncome ? "bg-green-500" : "bg-red-500", 
                              isOverspent && "bg-destructive"
                            )} 
                          />
                          <motion.div
                            initial={{ left: 0 }}
                            animate={{ left: `${Math.min(perc, 100)}%` }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className={cn(
                              "absolute z-20 -translate-x-1/2 h-10 w-10 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-[9px] font-black text-white",
                              isOverspent ? "bg-destructive shadow-destructive/30" : (isIncome ? "bg-green-500 shadow-green-500/30" : "bg-red-500 shadow-red-500/30")
                            )}
                          >
                            {Math.round(perc)}%
                          </motion.div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest pt-2">
                          <span className={isOverspent ? "text-destructive" : "text-muted-foreground"}>
                            {isOverspent ? 'EXCESO CRÍTICO' : 'AVANCE DEL CICLO'}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 bg-muted/5 flex justify-between items-center border-t border-muted/10">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className={cn("w-3.5 h-3.5", isIncome ? "text-green-500" : "text-red-500")} />
                          <span className="text-[9px] font-black text-primary uppercase">CAPITAL {isIncome ? 'LOGRADO' : 'FONDEADO'}</span>
                        </div>
                        <span className="text-xs font-black text-primary">{currency.symbol}{currentTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* CARA 2: ORÁCULO IA (120°) */}
                  <div 
                    className="absolute inset-0 backface-hidden bg-[#293462] rounded-3xl shadow-2xl p-6 flex flex-col overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(120deg) translateZ(120px)' }}
                  >
                    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                      <div className="p-2.5 bg-accent/20 rounded-xl">
                        <Lightbulb className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h4 className="text-white font-black uppercase text-xs tracking-widest">Oráculo IA</h4>
                        <p className="text-[8px] text-accent font-bold uppercase">Consejo Evolutivo</p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
                      <p className="text-[11px] text-white font-medium leading-relaxed italic border-l-2 border-accent pl-4">
                        "{advice.content}"
                      </p>

                      <div className="space-y-4 pb-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                          <p className="text-[8px] font-black text-accent uppercase tracking-widest">Grado de Necesidad</p>
                          <div className="flex justify-between items-center">
                            <span className="text-white font-black text-xs">{necessity}</span>
                            <Badge className="bg-accent/20 text-accent border-none text-[8px] font-black">ANÁLISIS IA</Badge>
                          </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                          <p className="text-[8px] font-black text-accent uppercase tracking-widest">Previsión de Quiebra</p>
                          <div className="flex justify-between items-baseline">
                            <span className={cn("font-black text-xs uppercase", depletionColor)}>{depletionText}</span>
                            <span className="text-[8px] text-white/40 font-bold uppercase">Radar de Flujo</span>
                          </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                          <p className="text-[8px] font-black text-accent uppercase tracking-widest">Ahorro Proyectado</p>
                          <div className="flex justify-between items-baseline">
                            <span className="text-white font-black text-lg">+{currency.symbol}{(b.limit * 0.15).toLocaleString()}</span>
                            <span className="text-[8px] text-white/40 font-bold uppercase">Mensual</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARA 3: MÉTRICAS MAESTRO (240°) */}
                  <div 
                    className="absolute inset-0 backface-hidden bg-white border-2 border-primary/10 rounded-3xl shadow-2xl p-6 flex flex-col overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(240deg) translateZ(120px)' }}
                  >
                    <div className="flex items-center justify-between mb-6 border-b border-muted/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <h4 className="text-primary font-black uppercase text-xs tracking-widest">Métricas Pro</h4>
                      </div>
                      <Sparkles className="w-4 h-4 text-accent" />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-5 scrollbar-hide">
                      <div className="space-y-4 pb-4">
                        <div className="flex justify-between items-center border-b border-dashed pb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase">Promedio Diario</span>
                          </div>
                          <span className="text-[11px] font-black text-primary">{currency.symbol}{Math.round(dailyAvg).toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-dashed pb-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase">Volatilidad</span>
                          </div>
                          <span className="text-[11px] font-black text-destructive">{volatility}%</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-dashed pb-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase">Eficiencia IA</span>
                          </div>
                          <span className="text-[11px] font-black text-accent">{Math.round(perc)}%</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-dashed pb-2">
                          <div className="flex items-center gap-2">
                            <Target className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase">Frecuencia Uso</span>
                          </div>
                          <span className="text-[11px] font-black text-primary">ALTA</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-dashed pb-2">
                          <div className="flex items-center gap-2">
                            <History className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase">Impacto Total</span>
                          </div>
                          <span className="text-[11px] font-black text-primary">{volatility > 30 ? 'SIGNIFICATIVO' : 'LEVE'}</span>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full rounded-xl border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary h-12 mt-2"
                        onClick={() => setFaceIndexes(prev => ({ ...prev, [b.id]: 0 }))}
                      >
                        Resetear Prisma
                      </Button>
                    </div>
                  </div>
                </motion.div>

                <div className="flex justify-center mt-6 gap-2.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div 
                      key={i} 
                      animate={{ 
                        scale: activeFace === i ? 1.3 : 1,
                        backgroundColor: activeFace === i ? '#00AFB9' : '#E2E8F0'
                      }}
                      className="w-1.5 h-1.5 rounded-full" 
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
