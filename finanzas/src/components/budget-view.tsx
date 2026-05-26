
"use client"

import React, { useState, useMemo, useId } from 'react';
import { Progress } from '@/components/ui/progress';
import { Budget, useFinanceStore } from '@/hooks/use-finance-store';
import { 
  Plus,
  ShoppingCart, 
  Bus, 
  Home, 
  Activity, 
  Package, 
  Utensils,
  Coffee,
  Trash2,
  Edit3,
  Repeat,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  History,
  Info,
  TrendingUp,
  Landmark,
  ShieldCheck
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

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

export function BudgetView({ budgets }: { budgets: Budget[] }) {
  const { 
    transactions,
    currency, 
    updateBudgetLimit, 
    updateBudgetAllocation, 
    addBudget, 
    deleteBudget 
  } = useFinanceStore();
  
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [inputLimit, setInputLimit] = useState('');
  const [inputStart, setInputStart] = useState('');
  const [inputEnd, setInputEnd] = useState('');
  const [inputAllocationValue, setInputAllocationValue] = useState('');

  const chartId = useId();

  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'ingreso').reduce((acc, t) => acc + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'gasto').reduce((acc, t) => acc + t.amount, 0), [transactions]);
  const currentBalance = totalIncome - totalExpense;

  const realAvailableBalance = useMemo(() => {
    const now = new Date();
    const activeAllocations = budgets
      .filter(b => {
        const s = b.startDate ? new Date(b.startDate) : new Date(0);
        s.setHours(0,0,0,0);
        const e = b.endDate ? new Date(b.endDate) : new Date(8640000000000000);
        e.setHours(23,59,59,999);
        return now >= s && now <= e;
      })
      .reduce((acc, b) => acc + Math.max(0, b.limit - b.spent), 0);
    return currentBalance - activeAllocations;
  }, [currentBalance, budgets]);

  const categoriesMap = useMemo(() => {
    const groups: Record<string, Budget[]> = {};
    budgets.forEach(b => {
      if (!groups[b.category]) groups[b.category] = [];
      groups[b.category].push(b);
    });
    return groups;
  }, [budgets]);

  const activeBudgets = useMemo(() => {
    const now = new Date();
    return Object.keys(categoriesMap).map(catName => {
      const catPeriods = categoriesMap[catName];
      const current = catPeriods.find(b => {
        const s = b.startDate ? new Date(b.startDate) : new Date(0);
        s.setHours(0,0,0,0);
        const e = b.endDate ? new Date(b.endDate) : new Date(8640000000000000);
        e.setHours(23,59,59,999);
        return now >= s && now <= e;
      });
      if (current) return current;
      return [...catPeriods].sort((a,b) => (b.startDate || '').localeCompare(a.startDate || ''))[0];
    });
  }, [categoriesMap]);

  const handleOpenDetail = (b: Budget) => {
    setSelectedBudgetId(b.id);
    setInputLimit(b.limit === 0 ? '' : b.limit.toString());
    setInputStart(b.startDate?.split('T')[0] || '');
    setInputEnd(b.endDate?.split('T')[0] || '');
    setInputAllocationValue(b.allocationValue === 0 ? '' : b.allocationValue.toString());
    setIsDetailOpen(true);
  };

  const selectedBudget = useMemo(() => budgets.find(b => b.id === selectedBudgetId), [selectedBudgetId, budgets]);

  const stats = useMemo(() => {
    if (!selectedBudget) return null;
    const remaining = Math.max(0, selectedBudget.limit - selectedBudget.spent);
    const start = new Date(selectedBudget.startDate || Date.now());
    const end = new Date(selectedBudget.endDate || Date.now());
    const now = new Date();
    
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dailyBudget = daysLeft > 0 ? remaining / daysLeft : 0;
    
    const percentage = selectedBudget.limit > 0 
      ? Math.min((selectedBudget.spent / selectedBudget.limit) * 100, 100) 
      : (selectedBudget.spent > 0 ? 100 : 0);
    
    let status = 'healthy';
    if (percentage > 80) status = 'warning';
    if (percentage >= 100) status = 'critical';

    const cycleTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      const s = new Date(start); s.setHours(0,0,0,0);
      const e = new Date(end); e.setHours(23,59,59,999);
      return t.category === selectedBudget.category && t.type === 'gasto' && tDate >= s && tDate <= e;
    });

    const chartData = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d > end) return null;
      const dayStr = d.toLocaleDateString('es-ES', { day: '2-digit' });
      const dailyTotal = cycleTransactions
        .filter(t => new Date(t.date).toDateString() === d.toDateString())
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: dayStr, value: dailyTotal, fullDate: d.toDateString() };
    }).filter(d => d !== null);

    return {
      remaining,
      daysLeft: Math.max(0, daysLeft),
      dailyBudget,
      status,
      percentage,
      chartData,
      cycleTransactions: cycleTransactions.sort((a,b) => b.date.localeCompare(a.date))
    };
  }, [selectedBudget, transactions]);

  const updateSelected = () => {
    if (selectedBudget) {
      updateBudgetLimit(selectedBudget.id, parseFloat(inputLimit) || 0, inputStart, inputEnd);
    }
  };

  const handleAllocationValueChange = (val: string) => {
    const numericVal = parseFloat(val) || 0;
    setInputAllocationValue(val);
    if (selectedBudget) {
      updateBudgetAllocation(selectedBudget.id, selectedBudget.allocationType, numericVal);
    }
  };

  const formatMonth = (dateStr?: string) => {
    if (!dateStr) return "SIN FECHA";
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-white overflow-y-auto">
      <div className="shrink-0 bg-primary text-white p-8 shadow-2xl rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="flex justify-between items-start z-10 relative">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Tu Control Maestro</p>
            <h2 className="text-4xl font-black">{currency.symbol}{currentBalance.toLocaleString()}</h2>
            <div className="mt-2 flex items-center gap-2 bg-accent/20 w-fit px-3 py-1 rounded-lg border border-accent/30">
              <ShieldCheck className="w-3 h-3 text-accent" />
              <span className="text-[9px] font-black uppercase tracking-tight text-white/90">Saldo Disponible Real:</span>
              <span className="text-xs font-black text-accent">{currency.symbol}{realAvailableBalance.toLocaleString()}</span>
            </div>
          </div>
          <Button 
            className="bg-accent text-white h-12 w-12 rounded-2xl shadow-lg active:scale-95 transition-all"
            onClick={() => addBudget('Nueva Meta', 0, new Date().toISOString().split('T')[0], '')}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
        <div className="flex gap-4 mt-6 z-10 relative">
          <div className="flex-1 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
            <p className="text-[8px] font-black uppercase text-white/50 mb-1">Flujo Entrada</p>
            <div className="flex items-center gap-1.5 text-green-400 font-black text-xs">
              <ArrowUpCircle className="w-3.5 h-3.5" /> {currency.symbol}{totalIncome.toLocaleString()}
            </div>
          </div>
          <div className="flex-1 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
            <p className="text-[8px] font-black uppercase text-white/50 mb-1">Flujo Salida</p>
            <div className="flex items-center gap-1.5 text-red-400 font-black text-xs">
              <ArrowDownCircle className="w-3.5 h-3.5" /> {currency.symbol}{totalExpense.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Metas en Seguimiento</h3>
          <Badge variant="outline" className="text-[8px] font-black border-accent/20 text-accent uppercase">Hoy</Badge>
        </div>

        {activeBudgets.map(b => {
           const isPast = b.endDate && new Date(b.endDate) < new Date();
           const perc = b.limit > 0 ? (b.spent / b.limit) * 100 : (b.spent > 0 ? 100 : 0);
           
           return (
            <div key={b.id} onClick={() => handleOpenDetail(b)} className="bg-white p-6 rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-muted/20 active:scale-[0.98] transition-all group cursor-pointer">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary/5 text-primary rounded-[1.5rem] group-hover:bg-primary group-hover:text-white transition-colors">{getIcon(b.category)}</div>
                  <div>
                    <h4 className="font-black text-primary capitalize text-sm">{b.category}</h4>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <CalendarDays className="w-2.5 h-2.5" /> {formatMonth(b.startDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-0.5">{isPast ? 'Finalizado' : 'Meta Límite'}</p>
                  <p className="text-sm font-black text-primary">{currency.symbol}{b.limit.toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-3">
                <Progress 
                  value={Math.min(perc, 100)} 
                  className="h-2.5 bg-muted/30 rounded-full [&>div]:bg-green-500" 
                />
                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                  <span className="text-muted-foreground">Consumo: {currency.symbol}{b.spent.toLocaleString()}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-md",
                    perc > 100 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                  )}>
                    {Math.round(perc)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isDetailOpen && selectedBudget && stats && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="bg-[#293462] text-white p-8 pt-12 relative shrink-0">
            <button onClick={() => setIsDetailOpen(false)} className="absolute top-6 right-6 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all">
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-5 mb-8">
              <div className="p-5 bg-white/10 rounded-[2rem] backdrop-blur-xl border border-white/10">
                {getIcon(selectedBudget.category)}
              </div>
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black capitalize tracking-tight">{selectedBudget.category}</h2>
                <button 
                  className="bg-green-500 text-white rounded-full p-2 shadow-[0_0_20px_rgba(34,197,94,0.4)] active:scale-90 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newStart = selectedBudget.endDate ? new Date(selectedBudget.endDate) : new Date();
                    newStart.setDate(newStart.getDate() + 1);
                    addBudget(selectedBudget.category, selectedBudget.limit, newStart.toISOString().split('T')[0], '');
                  }}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Control de Periodo</p>
                <h3 className="text-xl font-black text-accent">{formatMonth(selectedBudget.startDate)}</h3>
              </div>
              <Badge className={cn(
                "h-8 px-4 rounded-xl text-[10px] font-black uppercase border-none",
                stats.status === 'healthy' ? "bg-green-500 text-white" : 
                stats.status === 'warning' ? "bg-amber-500 text-white" : "bg-red-500 text-white"
              )}>
                {stats.status === 'healthy' ? 'Saludable' : stats.status === 'warning' ? 'Alerta' : 'Crítico'}
              </Badge>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-10 space-y-12 pb-32">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5 p-6 rounded-[2.5rem] border border-primary/10">
                <p className="text-[9px] font-black text-muted-foreground uppercase mb-2">Restante Real</p>
                <p className="text-2xl font-black text-primary">{currency.symbol}{stats.remaining.toLocaleString()}</p>
              </div>
              <div className="bg-accent/5 p-6 rounded-[2.5rem] border border-accent/10 relative">
                <p className="text-[9px] font-black text-accent uppercase mb-2">Cupo Diario Disponible</p>
                <p className="text-2xl font-black text-primary">{currency.symbol}{Math.round(stats.dailyBudget).toLocaleString()}</p>
                <span className="text-[7px] font-bold text-muted-foreground/60 absolute bottom-3 left-6">Calculado: Remanente / {stats.daysLeft} días</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" /> Flujo de Gasto Diario
              </h4>
              <div className="h-[200px] w-full bg-muted/10 rounded-[2.5rem] p-6 border">
                <ResponsiveContainer width="100%" height="100%" id={chartId}>
                  <BarChart data={stats.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {stats.chartData.map((entry, index) => (
                        <Cell key={`cell-${selectedBudget.id}-${index}`} fill={entry.value > stats.dailyBudget ? '#F43F5E' : '#00AFB9'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-accent" /> Ajustes del Ciclo
              </h4>
              <div className="bg-white p-6 rounded-[2.5rem] border border-muted/30 shadow-sm space-y-6">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Meta Límite Mensual</Label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary/30">{currency.symbol}</span>
                    <input 
                      type="text" 
                      value={inputLimit}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setInputLimit(e.target.value.replace(/[^0-9.]/g, ''))}
                      onBlur={updateSelected}
                      placeholder="0"
                      className="h-20 w-full pl-14 rounded-3xl bg-muted/20 border-none text-2xl font-black text-primary focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-primary/10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase">Desde</Label>
                    <input type="date" value={inputStart} onChange={(e) => setInputStart(e.target.value)} onBlur={updateSelected} className="h-14 w-full rounded-2xl bg-muted/10 border-none font-bold text-xs px-6 focus:ring-0" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase">Hasta</Label>
                    <input type="date" value={inputEnd} onChange={(e) => setInputEnd(e.target.value)} onBlur={updateSelected} className="h-14 w-full rounded-2xl bg-muted/10 border-none font-bold text-xs px-6 focus:ring-0" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <Repeat className="w-4 h-4 text-accent" /> Estrategia de Fondeo IA
              </h4>
              <div className="bg-[#293462]/5 p-8 rounded-[3rem] border border-[#293462]/10 space-y-6">
                <Select 
                  value={selectedBudget.allocationType} 
                  onValueChange={(val: any) => updateBudgetAllocation(selectedBudget.id, val, selectedBudget.allocationValue)}
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
                
                {selectedBudget.allocationType !== 'manual' && (
                  <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                    <Label className="text-[10px] font-black text-primary/60 uppercase ml-2">
                      {selectedBudget.allocationType === 'fixed' ? 'Monto Exacto a Inyectar' : 'Porcentaje (%)'}
                    </Label>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-primary/30 text-xl">
                        {selectedBudget.allocationType === 'fixed' ? currency.symbol : '%'}
                      </div>
                      <input 
                        type="text" 
                        value={inputAllocationValue}
                        onFocus={(e) => e.target.select()}
                        placeholder="0"
                        onChange={(e) => handleAllocationValueChange(e.target.value.replace(/[^0-9.]/g, ''))}
                        className="h-20 w-full pl-14 rounded-3xl bg-white border-none shadow-xl font-black text-2xl focus:ring-4 focus:ring-accent/10 placeholder:text-primary/10"
                      />
                    </div>
                    <p className="text-[8px] font-bold text-muted-foreground/60 ml-2 italic">Este monto se sumará a tu Meta Límite automáticamente con cada ingreso.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-accent" /> Movimientos del Periodo
              </h4>
              <div className="space-y-3">
                {stats.cycleTransactions.length > 0 ? stats.cycleTransactions.map(t => (
                  <div key={t.id} className="p-5 bg-white rounded-3xl border border-muted/20 shadow-sm flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-primary">{t.description}</span>
                      <span className="text-[8px] font-bold text-muted-foreground uppercase">{new Date(t.date).toLocaleDateString()}</span>
                    </div>
                    <span className="font-black text-destructive text-xs">-{currency.symbol}{t.amount.toLocaleString()}</span>
                  </div>
                )) : (
                  <div className="p-8 text-center bg-muted/5 rounded-[2.5rem] border border-dashed border-muted/30">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Sin gastos registrados en este ciclo</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" /> Historial de Otros Ciclos
              </h4>
              <div className="space-y-3">
                {categoriesMap[selectedBudget.category].map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => handleOpenDetail(p)}
                    className={cn(
                      "p-6 rounded-[2rem] border flex justify-between items-center active:scale-[0.98] transition-all shadow-sm",
                      p.id === selectedBudget.id ? "bg-[#293462] text-white border-transparent" : "bg-white border-muted/30"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase">{formatMonth(p.startDate)}</span>
                      <span className="text-xs font-black">{currency.symbol}{p.limit.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="text-right mr-4">
                        <p className="text-[8px] font-bold opacity-60 uppercase">Gastado</p>
                        <p className="text-[10px] font-black">{currency.symbol}{p.spent.toLocaleString()}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                          "h-10 w-10 rounded-2xl",
                          p.id === selectedBudget.id ? "hover:bg-white/10 text-white/50 hover:text-red-400" : "hover:bg-red-50 text-muted-foreground hover:text-red-500"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(p.id);
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              variant="destructive" 
              className="w-full h-20 rounded-3xl font-black uppercase text-xs mt-10 shadow-2xl shadow-destructive/20 gap-3"
              onClick={() => { setConfirmDeleteId(selectedBudget.id); }}
            >
              <Trash2 className="w-6 h-6" /> Eliminar Ciclo Definitivamente
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent className="rounded-[3rem] border-none shadow-2xl p-10 max-w-[90%] sm:max-w-md bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase text-primary tracking-tight">¿Confirmar Acción?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed mt-4">
              Estás a punto de borrar este registro histórico. Esta acción no se puede deshacer y perderás el análisis de gasto de este periodo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-4 mt-10">
            <AlertDialogAction 
              className="w-full h-16 rounded-3xl bg-destructive text-white font-black uppercase text-xs shadow-xl shadow-destructive/20"
              onClick={() => {
                if (confirmDeleteId) {
                  deleteBudget(confirmDeleteId);
                  if (confirmDeleteId === selectedBudgetId) setIsDetailOpen(false);
                  setConfirmDeleteId(null);
                }
              }}
            >
              Borrar permanentemente
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-16 rounded-3xl border-none bg-muted/50 font-black uppercase text-xs hover:bg-muted transition-colors">
              Mantener registro
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
