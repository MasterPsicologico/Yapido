
"use client";

import { LayoutGrid, ArrowUpCircle, CheckCircle2, AlertTriangle, Settings2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface WasherServiceDetailsProps {
  washerType: 'automatica' | 'semiautomatica';
  setWasherType: (v: 'automatica' | 'semiautomatica') => void;
  floor: string;
  setFloor: (v: string) => void;
  hasElevator: boolean;
  setHasElevator: (v: boolean) => void;
  needsInstallation: boolean;
  setNeedsInstallation: (v: boolean) => void;
  isHeavyLoad: boolean;
  setIsHeavyLoad: (v: boolean) => void;
}

export function WasherServiceDetails({
  washerType, setWasherType, floor, setFloor, hasElevator, setHasElevator, needsInstallation, setNeedsInstallation, isHeavyLoad, setIsHeavyLoad
}: WasherServiceDetailsProps) {
  return (
    <div className="space-y-8 bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-inner">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
          <Settings2 className="w-4 h-4" />
        </div>
        <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Detalles del Servicio</h3>
      </div>

      <div className="grid gap-6">
        {/* Tipo de Lavadora */}
        <div className="space-y-3">
          <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Equipo Solicitado</Label>
          <div className="grid grid-cols-2 gap-2">
            {['automatica', 'semiautomatica'].map((type) => (
              <button
                key={type}
                onClick={() => setWasherType(type as any)}
                className={cn(
                  "h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all",
                  washerType === type ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-400 border-slate-200"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Piso y Ascensor */}
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

        {/* Toggles de Valor */}
        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={() => setNeedsInstallation(!needsInstallation)}
            className={cn(
              "flex items-center justify-between p-4 rounded-2xl border transition-all",
              needsInstallation ? "bg-green-50 border-green-200 text-green-700 shadow-sm" : "bg-white border-slate-100 text-slate-400"
            )}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className={cn("w-5 h-5", needsInstallation ? "text-green-500" : "text-slate-200")} />
              <span className="text-[10px] font-black uppercase tracking-widest">Requiere Instalación</span>
            </div>
            <div className={cn("w-2 h-2 rounded-full", needsInstallation ? "bg-green-500 animate-pulse" : "bg-slate-200")} />
          </button>

          <button 
            onClick={() => setIsHeavyLoad(!isHeavyLoad)}
            className={cn(
              "flex items-center justify-between p-4 rounded-2xl border transition-all",
              isHeavyLoad ? "bg-red-50 border-red-200 text-red-700 shadow-sm animate-vibrate" : "bg-white border-slate-100 text-slate-400"
            )}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className={cn("w-5 h-5", isHeavyLoad ? "text-red-500" : "text-slate-200")} />
              <span className="text-[10px] font-black uppercase tracking-widest">Carga muy pesada</span>
            </div>
            <div className={cn("w-2 h-2 rounded-full", isHeavyLoad ? "bg-red-500 animate-pulse" : "bg-slate-200")} />
          </button>
        </div>
      </div>
    </div>
  );
}
