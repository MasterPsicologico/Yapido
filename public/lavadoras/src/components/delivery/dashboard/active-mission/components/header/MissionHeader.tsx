
"use client";

import { format } from 'date-fns';
import { Clock, RotateCcw, Map, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MissionHeaderProps {
  onReleaseOpen: () => void;
  onOpenLiveMap?: () => void;
  status: string;
  isWithDriver: boolean;
  isInUse: boolean;
  isAtDestination: boolean;
  currentTime: Date;
}

/**
 * Encabezado de Misión con estados simplificados para Aguachica.
 */
export function MissionHeader({ 
  onReleaseOpen, 
  onOpenLiveMap,
  status, 
  isWithDriver, 
  isInUse, 
  isAtDestination, 
  currentTime 
}: MissionHeaderProps) {
  
  const getStatusLabel = () => {
    if (isInUse) return "EN USO";
    if (isAtDestination) return "EN EL DESTINO";
    if (status === 'shipped' || status === 'delivered_to_driver' || status === 'at_store') return "EN RUTA AL CLIENTE";
    if (status === 'ready_for_pickup') return "PEDIDO ACEPTADO";
    if (status === 'picking_up') return "EN RUTA A RECOGER";
    if (status === 'at_pickup') return "EN PUNTO DE RECOGIDA";
    return "MISIÓN ACTIVA";
  };

  const getStatusColor = () => {
    if (isInUse) return "bg-amber-500";
    if (isAtDestination) return "bg-blue-500";
    if (status === 'shipped' || status === 'delivered_to_driver' || status === 'at_store') return "bg-primary";
    if (status === 'ready_for_pickup') return "bg-green-500";
    if (status === 'picking_up') return "bg-orange-500";
    if (status === 'at_pickup') return "bg-orange-600";
    return "bg-green-500";
  };

  return (
    <div className="h-16 bg-slate-900 flex items-center justify-between px-4 text-white shrink-0 shadow-xl z-20">
      {onOpenLiveMap && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onOpenLiveMap} 
          className="h-10 w-10 text-white/80 hover:text-primary hover:bg-primary/10 rounded-full transition-all"
        >
          <MapPin className="w-5 h-5" />
        </Button>
      )}
      
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full animate-pulse", getStatusColor())} />
        <span className="text-[9px] font-black uppercase tracking-[0.2em]">
          {getStatusLabel()}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-black italic tracking-tighter tabular-nums">{format(currentTime, 'HH:mm')}</span>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <Clock className="w-4 h-4 text-primary" />
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onReleaseOpen} 
          className="h-9 w-9 text-white/60 hover:text-red-500 hover:bg-white/5 rounded-full transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
