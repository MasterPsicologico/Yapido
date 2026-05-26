
"use client"

import React, { useState } from 'react';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { TransactionTable } from './components/transaction-table';
import { TransactionDetailsFullScreen } from './components/transaction-details-full-screen';
import { TransactionInputFixed } from './components/transaction-input-fixed';
import { TransactionEditDialog } from './components/transaction-edit-dialog';
import { TransactionDeleteAlert } from './components/transaction-delete-alert';
import { CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TransactionsFeature() {
  const { 
    transactions, 
    currency, 
    deleteTransaction, 
    updateTransaction, 
    addTransaction, 
    addCalendarEvent 
  } = useFinanceStore();

  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const viewingTransaction = transactions.find(t => t.id === viewingId);
  const editingTransaction = transactions.find(t => t.id === editingId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white">
      <div className="shrink-0 bg-primary text-white p-4 flex items-center justify-between">
        <CardTitle className="text-base font-black uppercase tracking-widest">Historial Financiero</CardTitle>
        <Badge variant="outline" className="border-accent/30 text-accent text-[9px] font-black">
          {transactions.length} MOVIMIENTOS
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <TransactionTable 
          transactions={transactions}
          currency={currency}
          onRowClick={setViewingId}
          onEditClick={setEditingId}
          onDeleteClick={setDeletingId}
        />
      </div>

      <TransactionInputFixed 
        onAdd={addTransaction}
        onEventAdd={addCalendarEvent}
        onUpdate={updateTransaction}
        onDelete={deleteTransaction}
        transactions={transactions}
      />

      {viewingTransaction && (
        <TransactionDetailsFullScreen 
          transaction={viewingTransaction}
          currency={currency}
          onClose={() => setViewingId(null)}
          onEdit={() => {
            setEditingId(viewingId);
            setViewingId(null);
          }}
          onDelete={() => {
            setDeletingId(viewingId);
            setViewingId(null);
          }}
        />
      )}

      {editingTransaction && (
        <TransactionEditDialog 
          transaction={editingTransaction}
          onClose={() => setEditingId(null)}
          onUpdate={updateTransaction}
        />
      )}

      {deletingId && (
        <TransactionDeleteAlert 
          onClose={() => setDeletingId(null)}
          onConfirm={() => {
            deleteTransaction(deletingId);
            setDeletingId(null);
          }}
        />
      )}
    </div>
  );
}
