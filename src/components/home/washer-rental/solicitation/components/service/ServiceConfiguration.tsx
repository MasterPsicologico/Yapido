
"use client";

import { Settings2 } from 'lucide-react';
import { WasherTypeSelector } from './WasherTypeSelector';
import { AccessibilityInputs } from './AccessibilityInputs';
import { cn } from '@/lib/utils';

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
  availableMachineTypes?: { automatic: boolean; semiautomatic: boolean };
}

/**
 * ServiceConfiguration - Contenedor con ADN Dorado Morrocoy
 */
export function ServiceConfiguration({
  isAdmin, washerType, setWasherType, floor, setFloor, hasElevator, setHasElevator, 
  hasStairs, setHasStairs, stairCount, setStairCount, availableMachineTypes
}: ServiceConfigurationProps) {
  return (
    <div className={cn(
      "relative space-y-8 overflow-hidden p-8 rounded-[40px] border-2 transition-all duration-500 shadow-xl",
      "bg-gradient-to-br from-yellow-50/50 via-white to-yellow-50/30 border-yellow-500/20"
    )}>
      {/* Efecto Shimmer de fondo */}
      <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-yellow-200/10 to-transparent skew-x-12 animate-shimmer pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-slate-950 shadow-md">
          <Settings2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-yellow-700 leading-none italic">Detalles del Servicio</h3>
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Configuración Técnica Élite</p>
        </div>
      </div>

      <div className="relative z-10 space-y-10">
        <WasherTypeSelector isAdmin={isAdmin} selectedType={washerType} onSelect={setWasherType} availableMachineTypes={availableMachineTypes} />
        
        <AccessibilityInputs 
          floor={floor} setFloor={setFloor} 
          hasElevator={hasElevator} setHasElevator={setHasElevator}
          hasStairs={hasStairs} setHasStairs={setHasStairs}
          stairCount={stairCount} setStairCount={setStairCount}
        />
      </div>
    </div>
  );
}
