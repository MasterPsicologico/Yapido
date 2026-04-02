
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
 * Mandamiento #1: Aislamiento total, feedback visual dinámico y sincronización de precios.
 */
export function WasherTimeSelector({
  requestHours, onAdjustHours, minHours, formattedPrice, flashEffect
}: WasherTimeSelectorProps) {
  return (
    <div className="space-y-6 pt-6 border-t border-slate-100">
      {/* HEADER DINÁMICO: PREGUNTA PRIORITARIA EN ROJO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-red-600 animate-pulse" />
          <Label className="text-lg font-black uppercase text-red-600 tracking-tight leading-none italic">
            ¿Cuántas horas la necesitarás?
          </Label>
        </div>
        <Badge className="bg-slate-950 text-yellow-500 border border-yellow-500/30 text-[9px] font-black px-4 py-1.5 rounded-full italic tracking-widest shadow-lg w-fit">
          MÍNIMO {minHours} HRS
        </Badge>
      </div>
      
      {/* CONTENEDOR MAESTRO DE AJUSTE */}
      <div className={cn(
        "relative flex flex-col items-center gap-2 p-8 rounded-[48px] shadow-2xl border-4 transition-all duration-500 overflow-hidden",
        "bg-gradient-to-br from-white via-yellow-50/30 to-white",
        flashEffect === 'red' ? "border-red-500 animate-vibrate shadow-red-100" : flashEffect === 'green' ? "border-green-500 shadow-green-100" : "border-slate-50"
      )}>
        {/* Efecto de fondo dinámico (Aura Oro) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="flex items-center gap-8 w-full justify-between relative z-10 px-2">
          {/* BOTÓN DISMINUIR: RELIEVE METÁLICO */}
          <button 
            type="button" 
            onClick={() => onAdjustHours(-1)} 
            className="w-14 h-14 rounded-[20px] bg-white shadow-xl text-slate-400 hover:text-red-500 hover:scale-110 transition-all active:translate-y-1 flex items-center justify-center border border-slate-100 group"
          >
            <Minus className="w-7 h-7 group-active:scale-75 transition-transform" />
          </button>

          {/* DISPLAY CENTRAL: NÚMERO MAGNIFICADO Y PRECIO VIVO */}
          <div className="text-center flex flex-col items-center gap-2">
            <div className="flex items-baseline gap-2 py-2">
              <span className={cn(
                "text-7xl font-black italic tracking-tighter transition-all duration-500 text-transparent bg-clip-text drop-shadow-sm leading-none",
                flashEffect === 'red' 
                  ? "bg-red-600 scale-110" 
                  : flashEffect === 'green' 
                    ? "bg-green-600 scale-110" 
                    : "bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207]"
              )}>
                {requestHours}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">HRS</span>
            </div>

            {/* CÁPSULA DE PRECIO DINÁMICO RESTAURADA */}
            <div className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900 shadow-xl animate-in slide-in-from-top-2 duration-300 transition-colors",
              flashEffect === 'green' && "bg-green-600",
              flashEffect === 'red' && "bg-red-600"
            )}>
              <Wallet className="w-3 h-3 text-yellow-400" />
              <span className="text-[11px] font-black text-white italic tracking-tighter">
                {formattedPrice}
              </span>
            </div>
          </div>

          {/* BOTÓN AUMENTAR: RELIEVE ORO */}
          <button 
            type="button" 
            onClick={() => onAdjustHours(1)} 
            className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-xl text-slate-900 hover:scale-110 transition-all active:translate-y-1 flex items-center justify-center border-b-4 border-yellow-700 group"
          >
            <Plus className="w-7 h-7 group-active:scale-125 transition-transform" />
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
