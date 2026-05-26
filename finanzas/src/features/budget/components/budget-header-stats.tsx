
"use client"

import React, { useMemo } from 'react';
import { Transaction, Budget, Currency, useFinanceStore } from '@/hooks/use-finance-store';
import { ShieldCheck, ArrowUpCircle, ArrowDownCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BudgetHeaderStatsProps {
  transactions: Transaction[];
  budgets: Budget[];
  currency: Currency;
  onAddClick: () => void;
}

export function BudgetHeaderStats({ transactions, budgets, currency, onAddClick }: BudgetHeaderStatsProps) {
  const { totals } = useFinanceStore();

  return (
    <div className="shrink-0 bg-primary text-white p-8 shadow-2xl rounded-b-[2.5rem] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full -mr-16 -mt-16 blur-3xl" />
      <div className="flex justify-between items-start z-10 relative">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Tu Control Maestro</p>
          <h2 className="text-4xl font-black">{currency.symbol}{totals.balance.toLocaleString()}</h2>
          
          <div className={cn(
            "mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md transition-all",
            totals.realAvailable >= 0 ? "bg-accent/20 border-accent/30" : "bg-destructive/20 border-destructive/30"
          )}>
            <ShieldCheck className={cn("w-3 h-3", totals.realAvailable >= 0 ? "text-accent" : "text-destructive")} />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-tight text-white/70">Saldo Disponible Maestro:</span>
              <span className={cn("text-xs font-black", totals.realAvailable >= 0 ? "text-accent" : "text-destructive")}>
                {currency.symbol}{totals.realAvailable.toLocaleString()}
              </span>
            </div>
          </div>
          <p className="text-[7px] text-white/40 italic uppercase mt-1 leading-none">Calculado: Saldo Actual - Obligaciones de Gasto Pendientes</p>
        </div>
        <Button 
          className="bg-accent text-white h-12 w-12 rounded-2xl shadow-lg active:scale-95 transition-all"
          onClick={onAddClick}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
      <div className="flex gap-4 mt-6 z-10 relative">
        <div className="flex-1 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
          <p className="text-[8px] font-black uppercase text-white/50 mb-1">Flujo Entrada</p>
          <div className="flex items-center gap-1.5 text-green-400 font-black text-xs">
            <ArrowUpCircle className="w-3.5 h-3.5" /> {currency.symbol}{totals.income.toLocaleString()}
          </div>
        </div>
        <div className="flex-1 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
          <p className="text-[8px] font-black uppercase text-white/50 mb-1">Flujo Salida</p>
          <div className="flex items-center gap-1.5 text-red-400 font-black text-xs">
            <ArrowDownCircle className="w-3.5 h-3.5" /> {currency.symbol}{totals.expense.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
