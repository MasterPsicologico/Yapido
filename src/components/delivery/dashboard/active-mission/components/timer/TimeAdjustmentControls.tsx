"use client";

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimeAdjustmentControlsProps {
  onAdd: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

/**
 * TimeAdjustmentControls - Componente Atómico: Botones de Negociación Temporal.
 * Rediseñados para ser puramente visuales (iconos) y con etiqueta de pregunta superior.
 */
export function TimeAdjustmentControls({ onAdd, onRemove, disabled }: TimeAdjustmentControlsProps) {
  return (
    <div className="space-y-4 w-full">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">
        ¿NECESITA MÁS TIEMPO?
      </p>
      <div className="grid grid-cols-2 gap-3 w-full">
        <Button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          disabled={disabled}
          className="h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all"
        >
          <Minus className="w-7 h-7 stroke-[4]" />
        </Button>
        <Button 
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          disabled={disabled}
          className="h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black shadow-lg border-b-4 border-green-900 active:border-b-0 active:translate-y-1 transition-all"
        >
          <Plus className="w-7 h-7 stroke-[4]" />
        </Button>
      </div>
    </div>
  );
}
