
"use client";

import { Minus, Plus, Clock, Sparkles, Wallet } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WasherTimeSelectorProps {
  requestHours: number;
  onAdjustHours: (delta: number) => void;
  minHours: number;
  formattedPrice: string;
  flashEffect: 'none' | 'red' | 'green';
}

/**
 * Función Aislada: Selector de Tiempo Compacto de Alta Precisión
 * Mandamiento #1: Aislamiento total y visualización optimizada al 50%.
 */
export function WasherTimeSelector({
  requestHours, onAdjustHours, minHours, formattedPrice, flashEffect
}: WasherTimeSelectorProps) {
  return (
    <div className="space-y-6 pt-6 border-t border-slate-100">
      {/* HEADER DINÁMICO: PREGUNTA PRIORITARIA COMPACTADA */}
      <div className="flex flex-col items-center gap-2 text-center px-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-red-600 animate-pulse" />
          <Label className="text-xl sm:text-2xl font-black uppercase text-red-600 tracking-tighter leading-none italic drop-shadow-sm">
            ¿Cuántas horas la necesitarás?
          </Label>
        </div>
        <Badge className="bg-slate-950 text-yellow-500 border border-yellow-500/30 text-[8px] font-black px-4 py-1.5 rounded-full italic tracking-[0.2em] shadow-lg w-fit">
          MÍNIMO {minHours} HORAS
        </Badge>
      </div>
      
      {/* CONTENEDOR MAESTRO DE AJUSTE REDUCIDO AL 50% */}
      <div className={cn(
        "relative flex flex-col items-center justify-center p-6 rounded-[40px] shadow-xl border-2 transition-all duration-500 overflow-hidden",
        "bg-gradient-to-br from-white via-yellow-50/10 to-white",
        flashEffect === 'red' ? "border-red-500 animate-vibrate shadow-red-50" : flashEffect === 'green' ? "border-green-500 shadow-green-50" : "border-slate-50"
      )}>
        {/* Efecto de fondo dinámico (Aura Oro) */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/5 rounded-full blur-2xl -mr-12 -mt-12" />
        
        <div className="flex items-center gap-4 sm:gap-8 w-full justify-between relative z-10 px-1">
          {/* BOTÓN DISMINUIR: COMPACTO */}
          <button 
            type="button" 
            onClick={() => onAdjustHours(-1)} 
            className="w-12 h-12 rounded-[18px] bg-white shadow-lg text-slate-400 hover:text-red-500 hover:scale-105 transition-all active:translate-y-0.5 flex items-center justify-center border border-slate-100 group shrink-0"
          >
            <Minus className="w-6 h-6 group-active:scale-75 transition-transform" />
          </button>

          {/* DISPLAY CENTRAL: NÚMERO REDUCIDO SIN RECORTES */}
          <div className="text-center flex flex-col items-center">
            <div className="flex items-center justify-center py-2 min-h-[100px]">
              <span className={cn(
                "text-6xl sm:text-7xl font-black italic tracking-tighter transition-all duration-500 text-transparent bg-clip-text drop-shadow-sm leading-[1.1] py-4 px-1 block",
                flashEffect === 'red' 
                  ? "bg-red-600 scale-105" 
                  : flashEffect === 'green' 
                    ? "bg-green-600 scale-105" 
                    : "bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207]"
              )}>
                {requestHours}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-0.5 self-end mb-8">HRS</span>
            </div>

            {/* CÁPSULA DE PRECIO DINÁMICO: COMPACTA */}
            <div className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900 shadow-md animate-in slide-in-from-top-2 duration-500 transition-colors",
              flashEffect === 'green' && "bg-green-600",
              flashEffect === 'red' && "bg-red-600"
            )}>
              <Wallet className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-black text-white italic tracking-tighter">
                {formattedPrice}
              </span>
            </div>
          </div>

          {/* BOTÓN AUMENTAR: COMPACTO */}
          <button 
            type="button" 
            onClick={() => onAdjustHours(1)} 
            className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg text-slate-900 hover:scale-105 transition-all active:translate-y-0.5 flex items-center justify-center border-b-2 border-yellow-700 group shrink-0"
          >
            <Plus className="w-6 h-6 group-active:scale-110 transition-transform" />
          </button>
        </div>

        {/* Decoración de Chispas */}
        <div className="absolute bottom-2 opacity-20 pointer-events-none">
          <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
