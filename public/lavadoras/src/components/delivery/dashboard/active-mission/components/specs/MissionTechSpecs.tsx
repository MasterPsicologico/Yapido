
"use client";

import { Settings2, ArrowUpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionTechSpecsProps {
  floor: string;
  hasStairs: boolean;
  stairCount: number;
  washerType: string;
  totalPrice: number;
}

export function MissionTechSpecs({
  floor,
  hasStairs,
  stairCount,
  washerType,
  totalPrice
}: MissionTechSpecsProps) {
  return (
    <div className="bg-white p-6 rounded-[36px] shadow-sm border border-slate-100 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
        <Settings2 className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Detalles de Operación</span>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-[8px] font-black text-slate-400 uppercase">Ubicación Piso</p>
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-black italic uppercase">Piso {floor || '1'}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[8px] font-black text-slate-400 uppercase">Dificultad</p>
          <div className="flex items-center gap-2">
            <Loader2 className={cn("w-4 h-4 animate-spin text-primary", !hasStairs && "hidden")} />
            <span className="text-sm font-black italic uppercase">
              {hasStairs ? `${stairCount} ESCALAS` : 'SIN ESCALAS'}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[8px] font-black text-slate-400 uppercase">Equipo</p>
          <span className="text-sm font-black italic uppercase text-slate-700">{washerType || 'LAVADORA'}</span>
        </div>
        <div className="space-y-1">
          <p className="text-[8px] font-black text-slate-400 uppercase">Cobro</p>
          <span className="text-sm font-black italic text-primary">
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalPrice || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
