
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
 * Función Aislada: Selector de Tiempo de Alta Precisión
 * Mandamiento #1: Aislamiento total y visualización íntegra sin recortes.
 */
export function WasherTimeSelector({
  requestHours, onAdjustHours, minHours, formattedPrice, flashEffect
}: WasherTimeSelectorProps) {
  return (
    <div className="space-y-8 pt-8 border-t border-slate-100">
      {/* HEADER DINÁMICO: PREGUNTA PRIORITARIA EN ROJO Y GRANDE */}
      <div className="flex flex-col items-center gap-3 text-center px-4">
        <div className="flex items-center gap-2">
          <Clock className="w-7 h-7 text-red-600 animate-pulse" />
          <Label className="text-2xl sm:text-3xl font-black uppercase text-red-600 tracking-tighter leading-none italic drop-shadow-sm">
            ¿Cuántas horas la necesitarás?
          </Label>
        </div>
        <Badge className="bg-slate-950 text-yellow-500 border border-yellow-500/30 text-[10px] font-black px-5 py-2 rounded-full italic tracking-[0.2em] shadow-xl w-fit">
          MÍNIMO {minHours} HORAS
        </Badge>
      </div>
      
      {/* CONTENEDOR MAESTRO DE AJUSTE */}
      <div className={cn(
        "relative flex flex-col items-center justify-center p-10 rounded-[56px] shadow-2xl border-4 transition-all duration-500 overflow-hidden",
        "bg-gradient-to-br from-white via-yellow-50/20 to-white",
        flashEffect === 'red' ? "border-red-500 animate-vibrate shadow-red-100" : flashEffect === 'green' ? "border-green-500 shadow-green-100" : "border-slate-50"
      )}>
        {/* Efecto de fondo dinámico (Aura Oro) */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400/5 rounded-full blur-3xl -mr-20 -mt-20" />
        
        <div className="flex items-center gap-6 sm:gap-12 w-full justify-between relative z-10 px-2">
          {/* BOTÓN DISMINUIR: RELIEVE METÁLICO */}
          <button 
            type="button" 
            onClick={() => onAdjustHours(-1)} 
            className="w-16 h-16 rounded-[24px] bg-white shadow-xl text-slate-400 hover:text-red-500 hover:scale-110 transition-all active:translate-y-1 flex items-center justify-center border border-slate-100 group shrink-0"
          >
            <Minus className="w-8 h-8 group-active:scale-75 transition-transform" />
          </button>

          {/* DISPLAY CENTRAL: NÚMERO MAGNIFICADO SIN RECORTES */}
          <div className="text-center flex flex-col items-center">
            <div className="flex items-center justify-center py-4 min-h-[140px]">
              <span className={cn(
                "text-[6.5rem] sm:text-[8rem] font-black italic tracking-tighter transition-all duration-500 text-transparent bg-clip-text drop-shadow-sm leading-[1.2] py-6 px-2 block",
                flashEffect === 'red' 
                  ? "bg-red-600 scale-110" 
                  : flashEffect === 'green' 
                    ? "bg-green-600 scale-110" 
                    : "bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207]"
              )}>
                {requestHours}
              </span>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest italic ml-1 self-end mb-14">HRS</span>
            </div>

            {/* CÁPSULA DE PRECIO DINÁMICO: UBICACIÓN ESTRATÉGICA */}
            <div className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-in slide-in-from-top-4 duration-500 transition-colors",
              flashEffect === 'green' && "bg-green-600",
              flashEffect === 'red' && "bg-red-600"
            )}>
              <Wallet className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-black text-white italic tracking-tighter">
                {formattedPrice}
              </span>
            </div>
          </div>

          {/* BOTÓN AUMENTAR: RELIEVE ORO */}
          <button 
            type="button" 
            onClick={() => onAdjustHours(1)} 
            className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-xl text-slate-900 hover:scale-110 transition-all active:translate-y-1 flex items-center justify-center border-b-4 border-yellow-700 group shrink-0"
          >
            <Plus className="w-8 h-8 group-active:scale-125 transition-transform" />
          </button>
        </div>

        {/* Decoración de Chispas */}
        <div className="absolute bottom-4 opacity-30 pointer-events-none">
          <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
