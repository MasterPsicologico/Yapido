
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
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">¿Qué piso?</Label>
          <div className="relative">
            <ArrowUpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="number" 
              value={floor} 
              onChange={(e) => setFloor(e.target.value)} 
              className="w-full h-12 rounded-2xl bg-white border border-slate-200 pl-10 font-black text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="flex flex-col justify-center items-center gap-2">
          <Label className="text-[9px] font-black uppercase text-slate-400">¿Hay Ascensor?</Label>
          <Switch checked={hasElevator} onCheckedChange={setHasElevator} className="data-[state=checked]:bg-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-4">
          <button 
            onClick={() => {
              setHasStairs(!hasStairs);
              if (!hasStairs) setStairCount(1);
            }}
            className={cn(
              "flex items-center justify-between w-full p-4 rounded-2xl border transition-all",
              hasStairs ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm" : "bg-white border-slate-100 text-slate-400"
            )}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className={cn("w-5 h-5", hasStairs ? "text-amber-500" : "text-slate-200")} />
              <span className="text-[10px] font-black uppercase tracking-widest">Hay Escalas / Escaleras</span>
            </div>
            <div className={cn("w-2 h-2 rounded-full", hasStairs ? "bg-amber-500 animate-pulse" : "bg-slate-200")} />
          </button>

          {hasStairs && (
            <div className="p-4 bg-white rounded-3xl border border-amber-100 animate-in slide-in-from-top-2 duration-300">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 text-center">¿Cuántos tramos / escalas?</p>
              <div className="flex justify-between gap-2">
                {stairOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setStairCount(opt)}
                    className={cn(
                      "flex-1 h-10 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-0.5",
                      stairCount === opt ? "bg-amber-500 text-white shadow-lg scale-105" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {opt}{opt === 5 && <Plus className="w-2.5 h-2.5" />}
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
