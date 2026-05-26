
"use client"

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Transaction } from '@/hooks/use-finance-store';

const formatWithPoints = (val: string) => {
  const nums = val.replace(/\D/g, '');
  return nums.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

interface TransactionEditDialogProps {
  transaction: Transaction;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Transaction>) => void;
}

export function TransactionEditDialog({ transaction, onClose, onUpdate }: TransactionEditDialogProps) {
  const [form, setForm] = useState<Partial<Transaction> & { amountStr: string, dateOnly: string }>({
    ...transaction,
    amountStr: formatWithPoints(transaction.amount?.toString() || '0'),
    dateOnly: transaction.date?.split('T')[0] || new Date().toISOString().split('T')[0]
  });

  const handleAmountChange = (val: string) => {
    const formatted = formatWithPoints(val);
    setForm({
      ...form,
      amountStr: formatted,
      amount: parseFloat(formatted.replace(/\./g, '')) || 0
    });
  };

  const handleUpdateClick = () => {
    const { amountStr, dateOnly, ...finalData } = form;
    
    // Reconstruir la fecha manteniendo la hora original si existe
    const timePart = transaction.date.split('T')[1] || '12:00:00';
    finalData.date = `${dateOnly}T${timePart}`;
    
    onUpdate(transaction.id, finalData);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-none p-8 bg-white border-none shadow-2xl">
        <DialogHeader><DialogTitle className="font-black text-primary uppercase tracking-widest border-b pb-4">Edición de Registro</DialogTitle></DialogHeader>
        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-primary/60">Descripción de Operación</Label>
            <Input 
              value={form.description || ''} 
              onChange={(e) => setForm({...form, description: e.target.value})} 
              className="rounded-none h-14 bg-muted/5 font-bold" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-primary/60">Fecha de Operación</Label>
            <Input 
              type="date"
              value={form.dateOnly} 
              onChange={(e) => setForm({...form, dateOnly: e.target.value})} 
              className="rounded-none h-14 bg-muted/5 font-bold" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary/60">Monto Directo</Label>
              <Input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                onFocus={(e) => e.target.select()} 
                value={form.amountStr || ''} 
                onChange={(e) => handleAmountChange(e.target.value)} 
                className="rounded-none h-14 font-black" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary/60">Tipo Flujo</Label>
              <Select value={form.type} onValueChange={(val: any) => setForm({...form, type: val})}>
                <SelectTrigger className="rounded-none h-14 uppercase text-[10px] font-black"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-none shadow-2xl z-[300]">
                  <SelectItem value="gasto" className="font-bold">Gasto</SelectItem>
                  <SelectItem value="ingreso" className="font-bold">Ingreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-4 pt-6">
            <Button variant="ghost" className="flex-1 font-bold rounded-none uppercase text-xs" onClick={onClose}>Descartar</Button>
            <Button className="flex-1 bg-accent font-black text-white rounded-none uppercase text-xs" onClick={handleUpdateClick}>Actualizar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
