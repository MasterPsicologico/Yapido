
"use client";

import { Minus, Plus, Clock, Sparkles } from 'lucide-react';
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

export function WasherTimeSelector({
  requestHours, onAdjustHours, minHours, formattedPrice, flashEffect
}: WasherTimeSelectorProps) {
  return (
    <div className="space-y-6 pt-6 border-t border-slate-100">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-600" />
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Tiempo Élite</Label>
        </div>
        <Badge className="bg-slate-950 text-yellow-500 border border-yellow-500/30 text-[9px] font-black px-4 py-1.5 rounded-full italic tracking-widest shadow-lg">
          MIN. {minHours} HORAS
        </Badge>
      </div>
      
      <div className={cn(
        "relative flex flex-col items-center gap-2 p-8 rounded-[48px] shadow-2xl border-4 transition-all duration-500 overflow-hidden",
        "bg-gradient-to-br from-white via-yellow-50/30 to-white",
        flashEffect === 'red' ? "border-red-500 animate-vibrate" : flashEffect === 'green' ? "border-yellow-400 shadow-yellow-200" : "border-slate-50"
      )}>
        {/* Efecto de fondo dinámico */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="flex items-center gap-10 w-full justify-between relative z-10 px-2">
          <button 
            type="button" 
            onClick={() => onAdjustHours(-1)} 
            className="w-16 h-16 rounded-[24px] bg-white shadow-xl text-slate-400 hover:text-red-500 hover:scale-110 transition-all active:translate-y-1 flex items-center justify-center border border-slate-100"
          >
            <Minus className="w-8 h-8" />
          </button>

          <div className="text-center flex flex-col items-center">
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-8xl font-black italic tracking-tighter transition-all duration-500 text-transparent bg-clip-text drop-shadow-sm",
                flashEffect === 'red' ? "bg-red-600" : "bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207]"
              )}>
                {requestHours}
              </span>
              <div className="flex flex-col items-start">
                <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse mb-1" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">HRS</span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onClick={() => onAdjustHours(1)} 
            className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-xl text-slate-900 hover:scale-110 transition-all active:translate-y-1 flex items-center justify-center border-b-4 border-yellow-700"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
}
