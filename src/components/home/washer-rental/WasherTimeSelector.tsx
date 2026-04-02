"use client";

import { Minus, Plus } from 'lucide-react';
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
    <div className="space-y-4 pt-4 border-t border-slate-50">
      <div className="flex items-center justify-between px-2">
        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">TIEMPO DE ALQUILER</Label>
        <Badge className="bg-slate-900 text-white border-none text-[9px] font-black px-3 py-1">MIN. {minHours} HORAS</Badge>
      </div>
      
      <div className={cn(
        "flex flex-col items-center gap-2 bg-slate-50 p-6 rounded-[40px] shadow-inner relative overflow-hidden border-2 transition-all duration-300",
        flashEffect === 'red' ? "border-red-500 animate-vibrate" : flashEffect === 'green' ? "border-green-500" : "border-transparent"
      )}>
        <div className="flex items-center gap-8 w-full justify-between px-4">
          <button 
            type="button" 
            onClick={() => onAdjustHours(-1)} 
            className="w-14 h-14 rounded-2xl bg-white shadow-md text-slate-400 hover:text-red-500 transition-all active:scale-90 flex items-center justify-center"
          >
            <Minus className="w-6 h-6" />
          </button>
          <div className="text-center flex flex-col">
            <div className="flex items-baseline gap-2 justify-center">
              <span className={cn(
                "text-6xl font-black italic tracking-tighter transition-colors", 
                flashEffect === 'red' ? "text-red-600" : flashEffect === 'green' ? "text-green-600" : "text-slate-950"
              )}>
                {requestHours}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Horas</span>
            </div>
            <div className="mt-1 text-2xl font-black text-primary italic tracking-tighter">{formattedPrice}</div>
          </div>
          <button 
            type="button" 
            onClick={() => onAdjustHours(1)} 
            className="w-14 h-14 rounded-2xl bg-white shadow-md text-slate-400 hover:text-green-500 transition-all active:scale-90 flex items-center justify-center"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
