"use client"

import React, { useMemo, useState, useId, useEffect } from 'react';
import { Budget, Currency, Transaction } from '@/hooks/use-finance-store';
import { 
  X, 
  Plus, 
  TrendingUp, 
  Edit3, 
  Repeat, 
  Trash2,
  Check,
  Target,
  ShieldCheck,
  CalendarDays,
  Clock,
  ChevronDown,
  Info,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  AlertCircle,
  History,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const formatMonthYear = (dateStr?: string) => {
  if (!dateStr) return "SIN FECHA";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
};

const formatWithPoints = (val: string) => {
  const nums = val.replace(/\D/g, '');
  return nums.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

interface BudgetDetailsFullScreenProps {
  budget: Budget;
  currency: Currency;
  transactions: Transaction[];
  allBudgets: Budget[];
  onClose: () => void;
  onAddCycle: (cat: string, limit: number, start: string, end: string, type: 'gasto' | 'ingreso') => string;
  onDeleteCycle: (id: string) => void;
  onUpdateLimit: (id: string, limit: number, start: string, end: string, category?: string) => void;
  onUpdateAllocation: (id: string, type: any, val: number) => void;
  onOpenCycle: (id: string) => void;
}

export function BudgetDetailsFullScreen({ 
  budget, 
  currency, 
  transactions, 
  allBudgets,
  onClose, 
  onAddCycle, 
  onDeleteCycle,
  onUpdateLimit,
  onUpdateAllocation,
  onOpenCycle
}: BudgetDetailsFullScreenProps) {
  const [inputCategory, setInputCategory] = useState(budget.category);
  const [inputLimit, setInputLimit] = useState(budget.limit === 0 ? '' : formatWithPoints(budget.limit.toString()));
  const [inputStart, setInputStart] = useState(budget.startDate?.split('T')[0] || '');
  const [inputEnd, setInputEnd] = useState(budget.endDate?.split('T')[0] || '');
  const [inputAllocationValue, setInputAllocationValue] = useState(budget.allocationValue === 0 ? '' : formatWithPoints(budget.allocationValue.toString()));
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const chartId = useId();

  useEffect(() => {
    setInputCategory(budget.category);
    setInputLimit(budget.limit === 0 ? '' : formatWithPoints(budget.limit.toString()));
    setInputAllocationValue(budget.allocationValue === 0 ? '' : formatWithPoints(budget.allocationValue.toString()));
    setInputStart(budget.startDate?.split('T')[0] || '');
    setInputEnd(budget.endDate?.split('T')[0] || '');
  }, [budget]);

  const stats = useMemo(() => {
    const isIncome = budget.type === 'ingreso';
    const currentLimit = parseFloat(inputLimit.replace(/\./g, '')) || 0;
    const overspent = !isIncome ? Math.max(0, budget.spent - currentLimit) : 0;
    const remaining = Math.max(0, currentLimit - budget.spent);

    const dEnd = new Date((budget.endDate || new Date().toISOString()) + "T23:59:59");
    const dNow = new Date();
    const diffTime = dEnd.getTime() - dNow.getTime();
    const calendarDaysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const dailyProjection = remaining / calendarDaysLeft;
    
    const dailyThreshold = budget.allocationType === 'fixed' && budget.allocationValue > 0 
      ? budget.allocationValue 
      : (currentLimit > 0 ? (currentLimit / 30) : 0);

    const dStart = new Date((budget.startDate || new Date().toISOString()) + "T00:00:00");
    
    const realTransactions = transactions.filter(t => {
      const tDay = t.date.split('T')[0];
      const s = budget.startDate || '0000-00-00';
      const e = budget.endDate || '9999-12-31';
      return t.category.toLowerCase() === budget.category.toLowerCase() && t.type === budget.type && tDay >= s && tDay <= e;
    }).map(t => {
      const excess = (!isIncome && dailyThreshold > 0 && t.amount > dailyThreshold) ? (t.amount - dailyThreshold) : 0;
      return { ...t, isSynthetic: false, dailyExcess: excess };
    });

    let historyEntries: any[] = [...realTransactions];
    
    if (budget.type === 'gasto' && budget.allocationType !== 'manual') {
      const s = budget.startDate || '0000-00-00';
      const e = budget.endDate || '9999-12-31';
      const incomeInPeriod = transactions.filter(t => t.type === 'ingreso' && t.date.split('T')[0] >= s && t.date.split('T')[0] <= e);

      if (budget.allocationType === 'fixed') {
        const daysWithIncome = Array.from(new Set(incomeInPeriod.map(t => t.date.split('T')[0])));
        daysWithIncome.forEach(day => {
          historyEntries.push({
            id: `synthetic_${day}_${budget.id}`,
            description: `Aporte Automático IA por jornada laborada`,
            amount: budget.allocationValue,
            date: `${day}T08:00:00`,
            type: 'ingreso',
            isSynthetic: true,
            status: 'FONDEADO CON ÉXITO',
            reason: `Asignación automática fija configurada para ${budget.category}.`
          });
        });
      } else if (budget.allocationType === 'percentage') {
        incomeInPeriod.forEach(income => {
          historyEntries.push({
            id: `synthetic_${income.id}_${budget.id}`,
            description: `Aporte IA del ${budget.allocationValue}% sobre ingreso detectado`,
            amount: income.amount * (budget.allocationValue / 100),
            date: income.date,
            type: 'ingreso',
            isSynthetic: true,
            status: 'PRESUPUESTO ALCANZADO',
            reason: `Retención automática del ${budget.allocationValue}% aplicada al concepto: "${income.description}".`
          });
        });
      }
    }

    historyEntries.sort((a, b) => b.date.localeCompare(a.date));

    const chartData = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(dStart.getTime());
      d.setDate(dStart.getDate() + i);
      if (d > dEnd) return null;
      const dStr = d.toLocaleDateString('sv');
      const val = realTransactions
        .filter(t => t.date.split('T')[0] === dStr)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: d.getDate().toString(), value: val };
    }).filter(d => d !== null);

    const otherCycles = allBudgets
      .filter(b => b.category === budget.category && b.type === budget.type && b.id !== budget.id)
      .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));

    // Lógica de Previsión IA Detallada
    const daysUntilDepletion = budget.daysUntilDepletion;
    const avgDailySpent = budget.avgDailySpent || 0;

    return { 
      remaining, 
      overspent, 
      calendarDaysLeft, 
      dailyProjection, 
      isIncome, 
      chartData, 
      historyEntries, 
      otherCycles, 
      dailyThreshold,
      daysUntilDepletion,
      avgDailySpent
    };
  }, [inputLimit, budget, transactions, allBudgets]);

  const handleUpdate = () => {
    onUpdateLimit(budget.id, parseFloat(inputLimit.replace(/\./g, '')) || 0, inputStart, inputEnd, inputCategory);
  };

  const handleAllocationValueChange = (val: string) => {
    const formatted = formatWithPoints(val);
    setInputAllocationValue(formatted);
    onUpdateAllocation(budget.id, budget.allocationType, parseFloat(formatted.replace(/\./g, '')) || 0);
  };

  const handleAddNewCycle = () => {
    const dStart = budget.endDate ? new Date(budget.endDate + "T12:00:00") : new Date();
    dStart.setDate(dStart.getDate() + 1);
    const startStr = dStart.toISOString().split('T')[0];
    const newId = onAddCycle(budget.category, budget.limit, startStr, '', budget.type);
    onOpenCycle(newId);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
      <div className={cn(
        "relative shrink-0 border-b z-20 transition-colors duration-500",
        stats.overspent > 0 ? "bg-destructive/5 border-destructive/20" : "bg-white"
      )}>
        <div className="flex items-center justify-between px-6 pt-6">
           <Badge variant="outline" className={cn(
              "font-black text-[8px] uppercase px-3 py-1 border-2 tracking-[0.1em]",
              stats.overspent > 0 ? "border-destructive/30 text-destructive bg-destructive/10" : (stats.isIncome ? "border-green-200 text-green-600 bg-green-50" : "border-red-200 text-red-600 bg-red-50")
            )}>
              {stats.isIncome ? 'FUENTE DE INGRESO' : 'CANAL DE GASTO'}
            </Badge>
            <div className="flex items-center gap-2">
              <button title="Nuevo Ciclo" className="h-10 w-10 flex items-center justify-center bg-accent text-white rounded-xl shadow-lg active:scale-95 transition-all border-none" onClick={handleAddNewCycle}><Plus className="w-5 h-5 stroke-[3px]" /></button>
              <button onClick={onClose} className="h-10 w-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-lg active:scale-95 transition-all border-none"><X className="w-5 h-5 stroke-[3px]" /></button>
            </div>
        </div>

        <div className="px-8 pb-10 pt-6">
          <div className="flex gap-6 items-start">
            <div className={cn(
              "w-2.5 self-stretch rounded-full transition-all duration-500",
              stats.overspent > 0 ? "bg-destructive animate-pulse" : (stats.isIncome ? "bg-green-500" : "bg-red-500")
            )} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-2">
                <input 
                  value={inputCategory} 
                  onChange={(e) => setInputCategory(e.target.value)}
                  onBlur={handleUpdate}
                  placeholder="Sin nombre"
                  className={cn(
                    "bg-transparent border-none p-0 text-2xl font-black uppercase tracking-tighter outline-none w-full transition-colors block break-words whitespace-normal leading-[1.1]",
                    stats.overspent > 0 ? "text-destructive" : "text-primary"
                  )}
                />
                <div className="flex items-center gap-2 mt-1">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground/40" />
                  <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.35em] leading-none">
                    {formatMonthYear(budget.startDate)}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {stats.overspent > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mx-8 mb-8 p-5 bg-destructive text-white rounded-[2rem] flex items-center justify-between shadow-2xl shadow-destructive/30 border-2 border-white/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl"><AlertCircle className="w-5 h-5 animate-pulse" /></div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">Alerta de Arquitectura</p>
                  <p className="text-[9px] font-bold opacity-80 uppercase mt-1.5 tracking-widest">Exceso Crítico Detectado</p>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-white/40" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-12 pb-32">
        {/* Radar de Previsión IA */}
        {!stats.isIncome && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Timer className="w-4 h-4 text-accent" /> Radar de Previsión IA
            </h4>
            <div className={cn(
              "p-6 rounded-[2.5rem] border-2 flex flex-col gap-4 shadow-xl transition-all duration-500",
              stats.daysUntilDepletion !== null && stats.daysUntilDepletion < 7 
                ? "bg-red-600 border-red-500 text-white animate-border-spin-red" 
                : "bg-primary text-white border-primary/10"
            )}>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Reserva de Capital</p>
                  <h5 className="text-2xl font-black tracking-tight">
                    {stats.daysUntilDepletion === null ? 'ANALIZANDO FLUJO...' : (stats.daysUntilDepletion === 0 ? 'FONDOS AGOTADOS' : `OXÍGENO PARA ${stats.daysUntilDepletion} DÍAS`)}
                  </h5>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl">
                  {stats.daysUntilDepletion !== null && stats.daysUntilDepletion < 7 ? <AlertCircle className="w-6 h-6 animate-pulse" /> : <Sparkles className="w-6 h-6 text-accent" />}
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] font-medium leading-relaxed italic opacity-90">
                  {stats.daysUntilDepletion !== null && stats.daysUntilDepletion < 7 
                    ? `ALERTA CRÍTICA: Al ritmo actual de ${currency.symbol}${Math.round(stats.avgDailySpent).toLocaleString()}/día, tu meta de "${budget.category}" entrará en quiebra técnica antes de terminar el ciclo. Debes inyectar capital o recortar gastos de inmediato.`
                    : `SITUACIÓN ESTABLE: Tu ritmo de consumo diario de ${currency.symbol}${Math.round(stats.avgDailySpent).toLocaleString()} es compatible con los fondos restantes para este periodo.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {stats.overspent > 0 ? (
            <div className="bg-destructive text-white p-8 rounded-[2rem] shadow-2xl shadow-destructive/20 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">MONTO EXCEDIDO</p>
              <p className="text-5xl font-black tracking-tighter">
                {currency.symbol}{stats.overspent.toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="bg-muted/5 p-8 rounded-[2.5rem] border border-muted/10 flex flex-col items-center text-center shadow-sm">
              <p className="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-[0.2em]">
                {stats.isIncome ? 'FALTANTE PARA OBJETIVO' : 'CUPO DISPONIBLE'}
              </p>
              <p className="text-4xl font-black text-primary tracking-tighter">{currency.symbol}{stats.remaining.toLocaleString()}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/5 p-6 rounded-[2.5rem] border border-primary/10 flex flex-col items-center text-center shadow-sm">
              <p className="text-[8px] font-black text-primary uppercase mb-1 tracking-widest">{stats.isIncome ? 'LOGRADO' : 'FONDEADO'}</p>
              <p className="text-xl font-black text-primary tracking-tighter">{currency.symbol}{(stats.isIncome ? budget.spent : budget.funded).toLocaleString()}</p>
            </div>
            <div className="bg-accent/5 p-6 rounded-[2.5rem] border border-accent/10 flex flex-col items-center text-center shadow-sm">
              <p className="text-[8px] font-black text-accent uppercase mb-1 tracking-widest">CUPO DIARIO</p>
              <p className="text-xl font-black text-primary tracking-tighter">{currency.symbol}{Math.round(stats.dailyProjection).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" /> Evolución del Periodo
          </h4>
          <div className="bg-white rounded-[2.5rem] p-6 border border-muted/20 shadow-sm h-[250px]">
            <ResponsiveContainer width="100%" height="100%" id={chartId}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '900' }} />
                <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stats.chartData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={stats.isIncome ? '#10B981' : (entry.value > stats.dailyThreshold && stats.dailyThreshold > 0 ? '#EF4444' : '#00AFB9')} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {stats.dailyThreshold > 0 && (
            <p className="text-[8px] text-muted-foreground uppercase font-black text-center tracking-widest">
              Límite Diario Detectado: {currency.symbol}{stats.dailyThreshold.toLocaleString()}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" /> Arquitectura del Ciclo
          </h4>
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-primary/10 shadow-xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12" />
            <div className="space-y-2 relative z-10">
              <Label className="text-[9px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Monto Objetivo Total</Label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary/30">{currency.symbol}</span>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={inputLimit} onFocus={(e) => e.target.select()}
                  onChange={(e) => setInputLimit(formatWithPoints(e.target.value))} onBlur={handleUpdate}
                  className="h-20 w-full pl-14 rounded-[2rem] bg-muted/5 border-none text-3xl font-black text-primary text-center focus:ring-4 focus:ring-primary/5 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="space-y-2">
                <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Fecha Inicio</Label>
                <input type="date" value={inputStart} onChange={(e) => setInputStart(e.target.value)} onBlur={handleUpdate} className="h-14 w-full rounded-2xl bg-muted/5 border-none font-black text-xs px-4 focus:ring-2 focus:ring-primary/5" />
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1">Fecha Cierre</Label>
                <input type="date" value={inputEnd} onChange={(e) => setInputEnd(e.target.value)} onBlur={handleUpdate} className="h-14 w-full rounded-2xl bg-muted/5 border-none font-black text-xs px-4 focus:ring-2 focus:ring-primary/5" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Repeat className="w-4 h-4 text-accent" /> Estrategia de Fondeo IA
          </h4>
          <div className="bg-[#293462]/5 p-8 rounded-[3rem] border border-[#293462]/10 space-y-6">
            <Select 
              value={budget.allocationType} 
              onValueChange={(val: any) => onUpdateAllocation(budget.id, val, budget.allocationValue)}
            >
              <SelectTrigger className="h-16 rounded-3xl border-2 border-[#293462] bg-white shadow-xl font-black text-[11px] uppercase px-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-3xl border-none shadow-2xl z-[300]">
                <SelectItem value="manual" className="font-bold py-3">Manual (Llenado Propio)</SelectItem>
                <SelectItem value="fixed" className="font-bold py-3">Inyección Fija Prioritaria</SelectItem>
                <SelectItem value="percentage" className="font-bold py-3">Porcentaje del Ingreso</SelectItem>
              </SelectContent>
            </Select>
            
            {budget.allocationType !== 'manual' && (
              <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                <Label className="text-[10px] font-black text-primary/60 uppercase ml-2">
                  {budget.allocationType === 'fixed' ? 'Monto Exacto a Inyectar' : 'Porcentaje (%)'}
                </Label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-primary/30 text-xl">
                    {budget.allocationType === 'fixed' ? currency.symbol : '%'}
                  </div>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={inputAllocationValue}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    onChange={(e) => handleAllocationValueChange(e.target.value)}
                    className="h-20 w-full pl-14 rounded-3xl bg-white border-none shadow-xl font-black text-2xl text-center focus:ring-4 focus:ring-accent/10 placeholder:text-primary/10"
                  />
                </div>
                <p className="text-[8px] font-bold text-muted-foreground/60 ml-2 italic">Este monto se sumará a tu Meta Límite automáticamente con cada ingreso detectado.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent" /> Libro de Movimientos
          </h4>
          {stats.historyEntries.length === 0 ? (
            <div className="bg-muted/5 p-10 rounded-[2.5rem] border-2 border-dashed border-muted/20 text-center">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sin registros vinculados</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {stats.historyEntries.map((t: any) => (
                <AccordionItem key={t.id} value={t.id} className="border-none">
                  <AccordionTrigger className="hover:no-underline p-0 group">
                    <div className={cn(
                      "w-full bg-white p-5 rounded-3xl border shadow-sm flex items-center justify-between group-data-[state=open]:rounded-b-none transition-all",
                      t.dailyExcess > 0 ? "border-red-500 bg-red-50/30" : "border-muted/20"
                    )}>
                      <div className="flex items-center gap-4 text-left min-w-0 flex-1">
                        <div className={cn(
                          "p-3 rounded-xl shrink-0",
                          t.dailyExcess > 0 ? "bg-red-500 text-white" : (t.isSynthetic ? "bg-accent/10 text-accent" : (t.type === 'ingreso' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"))
                        )}>
                          {t.dailyExcess > 0 ? <AlertCircle className="w-4 h-4" /> : (t.isSynthetic ? <Sparkles className="w-4 h-4" /> : (t.type === 'ingreso' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />))}
                        </div>
                        <div className="flex flex-col min-w-0 pr-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-black uppercase leading-tight break-words">{t.isSynthetic ? t.status : t.description}</span>
                            {t.dailyExcess > 0 && (
                              <Badge className="bg-red-600 text-white font-black text-[7px] uppercase h-4 px-1.5 border-none animate-pulse">EXCESO DIARIO</Badge>
                            )}
                          </div>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase">{new Date(t.date).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn("text-[11px] font-black", (t.type === 'ingreso' || t.isSynthetic) ? "text-green-600" : "text-red-600")}>
                          {t.type === 'ingreso' || t.isSynthetic ? '+' : '-'}{currency.symbol}{t.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    <div className={cn(
                      "border-x border-b rounded-b-3xl p-6 space-y-6",
                      t.dailyExcess > 0 ? "bg-red-50 border-red-500" : "bg-primary/5 border-muted/20"
                    )}>
                      {t.dailyExcess > 0 && (
                        <div className="p-4 bg-white border-2 border-red-600 rounded-2xl mb-2 shadow-xl flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-600">Desvío de Cupo Diario</p>
                            <p className="text-xl font-black text-black">+{currency.symbol}{t.dailyExcess.toLocaleString()}</p>
                          </div>
                          <AlertCircle className="w-6 h-6 text-red-600 animate-pulse" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Concepto Maestro</p>
                          <p className="text-[11px] font-bold text-primary leading-tight break-words uppercase">{t.description}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Precisión Temporal</p>
                          <p className="text-[11px] font-bold text-primary">
                            {new Date(t.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Clasificación</p>
                          <p className="text-[11px] font-bold text-accent uppercase">{t.category}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Cronometría</p>
                          <p className="text-[11px] font-bold text-primary capitalize">
                            {new Date(t.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                          <span className="text-[9px] font-black text-primary uppercase tracking-widest">Análisis de Auditoría IA</span>
                        </div>
                        <p className="text-[10px] text-primary/70 italic leading-relaxed border-l-2 border-accent pl-3">
                          {t.isSynthetic 
                            ? t.reason 
                            : `Este movimiento de "${t.description}" fue detectado y procesado por el motor cognitivo. Representa un impacto del ${((t.amount / budget.limit) * 100).toFixed(2)}% sobre el objetivo total configurado para ${budget.category}.`
                          }
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {stats.otherCycles.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-accent" />
              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Navegación Histórica</h4>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {stats.otherCycles.map((cycle) => (
                <button 
                  key={cycle.id}
                  onClick={() => onOpenCycle(cycle.id)}
                  className="w-full bg-white p-5 rounded-[2rem] border border-muted/20 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all hover:border-accent/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted/10 rounded-xl text-primary/40"><CalendarDays className="w-4 h-4" /></div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-primary uppercase">{formatMonthYear(cycle.startDate)}</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Consultar Información</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-black text-primary">{currency.symbol}{cycle.limit.toLocaleString()}</span>
                    <Badge variant="secondary" className="text-[7px] font-black uppercase py-0 px-1">{cycle.type === 'ingreso' ? 'ING' : 'GST'}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <Button variant="destructive" className="w-full h-20 rounded-[2rem] font-black uppercase text-xs shadow-2xl shadow-destructive/20 gap-3 mt-10" onClick={() => setConfirmDeleteId(budget.id)}><Trash2 className="w-6 h-6" /> Eliminar Ciclo Maestro</Button>
      </div>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent className="rounded-[3rem] border-none shadow-2xl p-10 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase text-primary tracking-tight">¿Confirmar Acción?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium mt-4 text-muted-foreground">Esta acción borrará este ciclo y todo su rastro de inyección diaria de forma permanente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-4 mt-10">
            <AlertDialogAction className="w-full h-16 rounded-3xl bg-destructive text-white font-black uppercase text-xs shadow-xl" onClick={() => { if (confirmDeleteId) { onDeleteCycle(confirmDeleteId); if (confirmDeleteId === budget.id) onClose(); setConfirmDeleteId(null); } }}>Sí, Borrar permanentemente</AlertDialogAction>
            <AlertDialogCancel className="w-full h-16 rounded-3xl border-none bg-muted/50 font-black uppercase text-xs">Mantener registro</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
