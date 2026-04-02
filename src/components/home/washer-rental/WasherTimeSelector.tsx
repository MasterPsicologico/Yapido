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
 * REVISIÓN: Reducción de escala para evitar desbordes.
 */
export function WasherTimeSelector({
  requestHours, onAdjustHours, minHours, formattedPrice, flashEffect
}: WasherTimeSelectorProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-slate-100">
      {/* HEADER DINÁMICO: PREGUNTA PRIORITARIA COMPACTADA */}
      <div className="flex flex-col items-center gap-1.5 text-center px-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-red-600 animate-pulse" />
          <Label className="text-lg sm:text-xl font-black uppercase text-red-600 tracking-tighter leading-none italic drop-shadow-sm">
            ¿Cuántas horas la necesitarás?
          </Label>
        </div>
        <Badge className="bg-slate-950 text-yellow-500 border border-yellow-500/30 text-[7px] font-black px-3 py-1 rounded-full italic tracking-[0.2em] shadow-lg w-fit">
          MÍNIMO {minHours} HORAS
        </Badge>
      </div>
      
      {/* CONTENEDOR MAESTRO DE AJUSTE REDUCIDO AL 50% */}
      <div className={cn(
        "relative flex flex-col items-center justify-center p-4 rounded-[32px] shadow-xl border-2 transition-all duration-500 overflow-hidden",
        "bg-gradient-to-br from-white via-yellow-50/10 to-white",
        flashEffect === 'red' ? "border-red-500 animate-vibrate shadow-red-50" : flashEffect === 'green' ? "border-green-500 shadow-green-50" : "border-slate-50"
      )}>
        {/* Aura Oro */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400/5 rounded-full blur-2xl -mr-8 -mt-8" />
        
        <div className="flex items-center gap-4 w-full justify-between relative z-10 px-1">
          {/* BOTÓN DISMINUIR */}
          <button 
            type="button" 
            onClick={() => onAdjustHours(-1)} 
            className="w-10 h-10 rounded-[14px] bg-white shadow-lg text-slate-400 hover:text-red-500 hover:scale-105 transition-all active:translate-y-0.5 flex items-center justify-center border border-slate-100 group shrink-0"
          >
            <Minus className="w-5 h-5 group-active:scale-75 transition-transform" />
          </button>

          {/* DISPLAY CENTRAL */}
          <div className="text-center flex flex-col items-center">
            <div className="flex items-center justify-center py-1 min-h-[70px]">
              <span className={cn(
                "text-4xl sm:text-5xl font-black italic tracking-tighter transition-all duration-500 text-transparent bg-clip-text drop-shadow-sm leading-[1.1] py-2 px-1 block",
                flashEffect === 'red' 
                  ? "bg-red-600 scale-105" 
                  : flashEffect === 'green' 
                    ? "bg-green-600 scale-105" 
                    : "bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207]"
              )}>
                {requestHours}
              </span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic ml-0.5 self-end mb-4">HRS</span>
            </div>

            {/* CÁPSULA DE PRECIO DINÁMICO */}
            <div className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 shadow-md animate-in slide-in-from-top-2 duration-500 transition-colors",
              flashEffect === 'green' && "bg-green-600",
              flashEffect === 'red' && "bg-red-600"
            )}>
              <Wallet className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] font-black text-white italic tracking-tighter">
                {formattedPrice}
              </span>
            </div>
          </div>

          {/* BOTÓN AUMENTAR */}
          <button 
            type="button" 
            onClick={() => onAdjustHours(1)} 
            className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg text-slate-900 hover:scale-105 transition-all active:translate-y-0.5 flex items-center justify-center border-b-2 border-yellow-700 group shrink-0"
          >
            <Plus className="w-5 h-5 group-active:scale-110 transition-transform" />
          </button>
        </div>

        {/* Decoración de Chispas */}
        <div className="absolute bottom-1 opacity-20 pointer-events-none">
          <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
