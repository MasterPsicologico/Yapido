
"use client";

import { Truck, RotateCcw, ArrowRight, PackageOpen } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface WasherRouteSelectorProps {
  routeType: 'round_trip' | 'delivery' | 'pickup';
  setRouteType: (v: 'round_trip' | 'delivery' | 'pickup') => void;
}

const ROUTES = [
  { id: 'round_trip', label: 'Ida y Regreso', icon: RotateCcw, desc: 'Llevamos y recogemos' },
  { id: 'delivery', label: 'Solo Entrega', icon: ArrowRight, desc: 'Tú la entregas después' },
  { id: 'pickup', label: 'Solo Recogida', icon: PackageOpen, desc: 'Ya terminaste el uso' },
];

export function WasherRouteSelector({ routeType, setRouteType }: WasherRouteSelectorProps) {
  return (
    <div className="space-y-4">
      <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.3em]">Logística de Trayecto</Label>
      <div className="grid grid-cols-1 gap-3">
        {ROUTES.map((route) => {
          const Icon = route.icon;
          const isActive = routeType === route.id;
          return (
            <button
              key={route.id}
              onClick={() => setRouteType(route.id as any)}
              className={cn(
                "flex items-center gap-4 p-5 rounded-[28px] border-2 transition-all group",
                isActive ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]" : "bg-white border-slate-100 text-slate-400 hover:border-primary/30"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors",
                isActive ? "bg-white/10 text-primary" : "bg-slate-50 text-slate-300 group-hover:text-primary"
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-black text-xs uppercase tracking-widest leading-none">{route.label}</p>
                <p className={cn("text-[9px] font-bold uppercase mt-1 opacity-60", isActive ? "text-slate-400" : "text-slate-300")}>{route.desc}</p>
              </div>
              {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.8)]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
