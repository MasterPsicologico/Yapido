
"use client"

import React, { useState } from 'react';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { BudgetHeaderStats } from './components/budget-header-stats';
import { BudgetCategoryList } from './components/budget-category-list';
import { BudgetDetailsFullScreen } from './components/budget-details-full-screen';
import { BudgetCreationView } from './components/budget-creation-view';

export function BudgetFeature() {
  const { budgets, transactions, currency, addBudget, deleteBudget, updateBudgetLimit, updateBudgetAllocation } = useFinanceStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const selectedBudget = budgets.find(b => b.id === selectedId);

  const handleCreateMeta = (name: string, limit: number, type: 'gasto' | 'ingreso') => {
    const newId = addBudget(name, limit, new Date().toISOString().split('T')[0], '', type);
    if (newId) setSelectedId(newId);
    setIsCreating(false);
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-white overflow-y-auto relative">
      <BudgetHeaderStats 
        transactions={transactions}
        budgets={budgets}
        currency={currency}
        onAddClick={() => setIsCreating(true)}
      />

      <BudgetCategoryList 
        budgets={budgets}
        currency={currency}
        onCategoryClick={setSelectedId}
      />

      {selectedBudget && (
        <BudgetDetailsFullScreen 
          budget={selectedBudget}
          currency={currency}
          transactions={transactions}
          allBudgets={budgets}
          onClose={() => setSelectedId(null)}
          onAddCycle={addBudget}
          onDeleteCycle={deleteBudget}
          onUpdateLimit={updateBudgetLimit}
          onUpdateAllocation={updateBudgetAllocation}
          onOpenCycle={setSelectedId}
        />
      )}

      {isCreating && (
        <BudgetCreationView 
          onClose={() => setIsCreating(false)}
          onConfirm={handleCreateMeta}
          currencySymbol={currency.symbol}
        />
      )}
    </div>
  );
}
