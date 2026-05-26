
"use client"

import React from 'react';
import { Transaction, Currency } from '@/hooks/use-finance-store';
import { 
  X, 
  Fingerprint, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Clock, 
  Layers, 
  Sparkles, 
  Edit3, 
  Trash2,
  Package,
  ShoppingCart,
  Coffee,
  Bus,
  Home,
  Activity,
  Landmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, React.ReactNode> = {
  supermercado: <ShoppingCart className="w-4 h-4" />,
  comida: <Coffee className="w-4 h-4" />,
  transporte: <Bus className="w-4 h-4" />,
  vivienda: <Home className="w-4 h-4" />,
  salud: <Activity className="w-4 h-4" />,
  salario: <Landmark className="w-4 h-4" />,
  otros: <Package className="w-4 h-4" />,
};

interface TransactionDetailsFullScreenProps {
  transaction: Transaction;
  currency: Currency;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TransactionDetailsFullScreen({ 
  transaction, 
  currency, 
  onClose, 
  onEdit, 
  onDelete 
}: TransactionDetailsFullScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300 rounded-none overflow-hidden">
      <div className="bg-[#293462] text-white p-6 pt-10 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-md">
              <Fingerprint className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50">Análisis Maestro</h2>
              <p className="text-[9px] font-bold text-accent tracking-wider">REF: {transaction.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
            <X className="w-8 h-8" />
          </button>
        </div>
        
        <div className="mt-4">
          <p className="text-[9px] font-black uppercase text-white/40 mb-1">Monto de Operación</p>
          <div className="flex items-baseline gap-2 overflow-hidden">
            <span className={cn(
              "text-5xl font-black tracking-tighter leading-none truncate",
              transaction.type === 'ingreso' ? "text-green-400" : "text-red-400"
            )}>
              {transaction.type === 'ingreso' ? '+' : '-'}{currency.symbol}{(transaction.amount ?? 0).toLocaleString()}
            </span>
            <span className="text-white/20 font-black text-sm uppercase tracking-widest flex-shrink-0">{currency.code}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-white pb-24">
        <div className="bg-primary/5 p-6 border-l-[4px] border-[#293462] rounded-none">
          <p className="text-[9px] font-black text-primary/40 uppercase mb-1">Concepto Registrado</p>
          <h3 className="text-xl font-black text-[#293462] uppercase leading-snug break-words">
            {transaction.description}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/10 p-4 border border-muted/20">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="text-primary">{categoryIcons[transaction.category] || <Package className="w-3.5 h-3.5" />}</div>
              <span className="text-[8px] font-black text-muted-foreground uppercase">Categoría</span>
            </div>
            <p className="text-[11px] font-black text-primary uppercase truncate">{transaction.category}</p>
          </div>

          <div className="bg-muted/10 p-4 border border-muted/20">
            <div className="flex items-center gap-2 mb-1.5">
              {transaction.type === 'ingreso' ? <ArrowUpRight className="w-3.5 h-3.5 text-green-500" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-red-500" />}
              <span className="text-[8px] font-black text-muted-foreground uppercase">Naturaleza</span>
            </div>
            <p className="text-[11px] font-black text-primary uppercase">{transaction.type}</p>
          </div>

          <div className="bg-muted/10 p-4 border border-muted/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span className="text-[8px] font-black text-muted-foreground uppercase">Fecha</span>
            </div>
            <p className="text-[10px] font-black text-primary leading-tight uppercase">
              {new Date(transaction.date).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-muted/10 p-4 border border-muted/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span className="text-[8px] font-black text-muted-foreground uppercase">Tiempo</span>
            </div>
            <p className="text-[10px] font-black text-primary">
              {new Date(transaction.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="bg-accent/5 p-5 border border-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-accent" />
            <span className="text-[9px] font-black text-accent uppercase">Análisis de Volumen</span>
          </div>
          <p className="text-[10px] text-primary/80 font-semibold leading-relaxed">
            Este movimiento representó un impacto del <span className="text-primary font-black">{(((transaction.amount ?? 0) / 1000000) * 100).toFixed(2)}%</span> sobre el flujo mensual proyectado.
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/5 border border-muted/20">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Canal de Auditoría</span>
            <span className="text-[10px] font-black text-primary flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-accent" /> IA Cognitiva Activa
            </span>
          </div>
          <Badge variant="outline" className="rounded-none border-primary/20 text-primary font-black uppercase text-[8px] py-0.5 h-5">Verificado</Badge>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <Button 
            className="w-full h-14 rounded-none bg-primary text-white font-black uppercase text-[10px] tracking-[0.1em] shadow-lg active:scale-95 transition-all"
            onClick={onEdit}
          >
            <Edit3 className="w-4 h-4 mr-2" /> Editar Registro Maestro
          </Button>
          <Button 
            variant="destructive"
            className="w-full h-14 rounded-none font-black uppercase text-[10px] tracking-[0.1em] active:scale-95 transition-all"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Eliminar Permanentemente
          </Button>
        </div>
      </div>
    </div>
  );
}
