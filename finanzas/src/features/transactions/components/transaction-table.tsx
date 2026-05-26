
"use client"

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Transaction, Currency } from '@/hooks/use-finance-store';
import { Edit3, Trash2, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TransactionTableProps {
  transactions: Transaction[];
  currency: Currency;
  onRowClick: (id: string) => void;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
}

export function TransactionTable({ transactions, currency, onRowClick, onEditClick, onDeleteClick }: TransactionTableProps) {
  return (
    <Table className="w-full table-fixed">
      <TableHeader className="bg-muted/50 sticky top-0 z-20">
        <TableRow className="border-none">
          <TableHead className="text-[9px] font-black uppercase text-primary">Concepto y Detalle</TableHead>
          <TableHead className="w-[100px] text-right text-[9px] font-black uppercase text-primary">Monto</TableHead>
          <TableHead className="w-[80px] text-center text-[9px] font-black uppercase text-primary">⚙️</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 ? (
          <TableRow className="border-none">
            <TableCell colSpan={3} className="h-64 text-center text-muted-foreground text-[10px] font-bold uppercase italic opacity-40">Sin movimientos registrados.</TableCell>
          </TableRow>
        ) : (
          transactions.map((t) => (
            <TableRow 
              key={t.id} 
              className="hover:bg-primary/5 group border-b border-muted/20 cursor-pointer transition-colors"
              onClick={() => onRowClick(t.id)}
            >
              <TableCell className="px-4 py-3">
                <div className="flex flex-col min-w-0">
                  {/* Título con protagonismo absoluto */}
                  <span className="font-black text-[11px] text-primary break-words uppercase tracking-tight leading-tight mb-1">
                    {t.description}
                  </span>
                  
                  {/* Metadata en la parte inferior con letritas pequeñas */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[8px] text-accent font-black uppercase tracking-wider">
                      {t.category}
                    </span>
                    <div className="flex items-center gap-1 text-[8px] text-muted-foreground font-bold uppercase tracking-widest">
                      <Calendar className="w-2 h-2" />
                      {new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      <span className="mx-1 opacity-30">|</span>
                      <Clock className="w-2 h-2" />
                      {new Date(t.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell className="text-right px-4">
                <div className={cn("font-black text-[11px] tabular-nums", t.type === 'ingreso' ? "text-green-600" : "text-destructive")}>
                  {t.type === 'ingreso' ? '+' : '-'}{currency.symbol}{(t.amount ?? 0).toLocaleString()}
                </div>
              </TableCell>
              
              <TableCell className="px-4">
                <div className="flex justify-center gap-1">
                  <Button 
                    variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" 
                    onClick={(e) => { e.stopPropagation(); onEditClick(t.id); }}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" 
                    onClick={(e) => { e.stopPropagation(); onDeleteClick(t.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
