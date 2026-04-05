
"use client";

import { Settings2 } from 'lucide-react';
import { WasherTypeSelector } from './WasherTypeSelector';
import { AccessibilityInputs } from './AccessibilityInputs';

interface ServiceConfigurationProps {
  isAdmin: boolean;
  washerType: 'automatica' | 'semiautomatica';
  setWasherType: (v: 'automatica' | 'semiautomatica') => void;
  floor: string;
  setFloor: (v: string) => void;
  hasElevator: boolean;
  setHasElevator: (v: boolean) => void;
  hasStairs: boolean;
  setHasStairs: (v: boolean) => void;
  stairCount: number;
  setStairCount: (v: number) => void;
}

export function ServiceConfiguration({
  isAdmin, washerType, setWasherType, floor, setFloor, hasElevator, setHasElevator, 
  hasStairs, setHasStairs, stairCount, setStairCount
}: ServiceConfigurationProps) {
  return (
    <div className="space-y-8 bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-inner">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
          <Settings2 className="w-4 h-4" />
        </div>
        <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Detalles del Servicio</h3>
      </div>

      <WasherTypeSelector isAdmin={isAdmin} selectedType={washerType} onSelect={setWasherType} />
      
      <AccessibilityInputs 
        floor={floor} setFloor={setFloor} 
        hasElevator={hasElevator} setHasElevator={setHasElevator}
        hasStairs={hasStairs} setHasStairs={setHasStairs}
        stairCount={stairCount} setStairCount={setStairCount}
      />
    </div>
  );
}
