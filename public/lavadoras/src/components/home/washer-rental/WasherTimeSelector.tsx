
"use client";

import { Minus, Plus, Clock, Wallet } from 'lucide-react';
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
    <div className="space-y-4 pt-4 border-t border-slate-100">
      <div className="flex flex-col items-center gap-1.5 text-center px-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-red-600 animate-pulse" />
          <Label className="text-xl font-black uppercase text-red-600 tracking-tighter italic">
            ¿Cuántas horas la necesitarás?
          </Label>
        </div>
        <Badge className="bg-slate-950 text-yellow-500 border border-yellow-500/30 text-[8px] font-black px-3 py-1 rounded-full italic tracking-[0.2em]">
          MÍNIMO {minHours} HORAS
        </Badge>
      </div>
      
      <div className={cn(
        "relative flex flex-col items-center justify-center p-6 rounded-[32px] shadow-xl border-2 transition-all duration-500 overflow-hidden",
        "bg-white",
        flashEffect === 'red' ? "border-red-500 animate-vibrate" : flashEffect === 'green' ? "border-green-500" : "border-slate-50"
      )}>
        <div className="flex items-center gap-6 w-full justify-between relative z-10">
          <button 
            type="button" 
            onClick={() => onAdjustHours(-1)} 
            className="w-12 h-12 rounded-2xl bg-white shadow-lg text-slate-400 hover:text-red-500 transition-all active:scale-90 flex items-center justify-center border border-slate-100"
          >
            <Minus className="w-6 h-6" />
          </button>

          <div className="text-center flex flex-col items-center">
            <div className="flex items-center justify-center py-4">
              <span className={cn(
                "text-6xl font-black italic tracking-tighter transition-all duration-500 text-transparent bg-clip-text leading-[1.2] block",
                flashEffect === 'red' ? "bg-red-600" : flashEffect === 'green' ? "bg-green-600" : "bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207]"
              )}>
                {requestHours}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase italic ml-1 self-end mb-4">HRS</span>
            </div>

            <div className={cn(
              "flex items-center gap-1 px-4 py-1.5 rounded-full bg-slate-900 shadow-md transition-colors",
              flashEffect === 'green' && "bg-green-600",
              flashEffect === 'red' && "bg-red-600"
            )}>
              <Wallet className="w-3 h-3 text-yellow-400" />
              <span className="text-xs font-black text-white italic tracking-tighter">{formattedPrice}</span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={() => onAdjustHours(1)} 
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg text-slate-900 hover:scale-105 transition-all active:scale-90 flex items-center justify-center border-b-4 border-yellow-700"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
