
"use client";

import { ArrowUpCircle, AlertTriangle, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface AccessibilityInputsProps {
  floor: string;
  setFloor: (v: string) => void;
  hasElevator: boolean;
  setHasElevator: (v: boolean) => void;
  hasStairs: boolean;
  setHasStairs: (v: boolean) => void;
  stairCount: number;
  setStairCount: (v: number) => void;
}

export function AccessibilityInputs({
  floor, setFloor, hasElevator, setHasElevator, hasStairs, setHasStairs, stairCount, setStairCount
}: AccessibilityInputsProps) {
  const stairOptions = [1, 2, 3, 4, 5];

  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">¿Qué piso?</Label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-slate-950 shadow-sm z-10">
              <ArrowUpCircle className="w-4 h-4" />
            </div>
            <input 
              type="number" 
              value={floor} 
              onChange={(e) => setFloor(e.target.value)} 
              className={cn(
                "w-full h-14 rounded-2xl pl-14 pr-4 font-black text-sm outline-none transition-all duration-300",
                "bg-white border-2 border-yellow-500/10 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/5 shadow-sm"
              )}
            />
          </div>
        </div>
        <div className="flex flex-col justify-center items-center gap-3">
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">¿Hay Ascensor?</Label>
          <Switch 
            checked={hasElevator} 
            onCheckedChange={setHasElevator} 
            className="data-[state=checked]:bg-yellow-500 shadow-lg" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1">
        <div className="space-y-4">
          <button 
            onClick={() => {
              setHasStairs(!hasStairs);
              if (!hasStairs) setStairCount(1);
            }}
            className={cn(
              "flex items-center justify-between w-full p-5 rounded-[24px] border-2 transition-all duration-500 group",
              hasStairs 
                ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]" 
                : "bg-white border-yellow-500/10 text-slate-400 hover:border-yellow-500/30"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-colors",
                hasStairs ? "bg-white/10 text-yellow-500" : "bg-slate-50 text-slate-300 group-hover:text-yellow-500"
              )}>
                <AlertTriangle className={cn("w-5 h-5", hasStairs && "animate-pulse")} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.15em] italic">Hay Escalas / Escaleras</span>
            </div>
            <div className={cn(
              "w-2 h-2 rounded-full transition-all duration-500",
              hasStairs ? "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)] scale-125" : "bg-slate-200"
            )} />
          </button>

          {/* SELECTOR DE TRAMOS DE ESCALERAS - ESTILO ORO */}
          {hasStairs && (
            <div className="p-5 bg-white rounded-[32px] border-2 border-yellow-500/10 animate-in slide-in-from-top-2 duration-500 shadow-inner">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 text-center">Indique el nivel de dificultad (Tramos)</p>
              <div className="flex justify-between gap-3">
                {stairOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setStairCount(opt)}
                    className={cn(
                      "flex-1 h-12 rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center relative overflow-hidden",
                      stairCount === opt 
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-950 shadow-lg scale-110 z-10" 
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {opt}{opt === 5 && <Plus className="w-3 h-3 ml-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
