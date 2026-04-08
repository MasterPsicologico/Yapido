
"use client";

import { Button } from '@/components/ui/button';
import { Navigation, CheckCircle2, MapPinned } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MyDeliveriesActionsProps {
  orderId: string;
  status: string;
  onUpdateStatus: (status: string, metadata?: any) => void;
  onFinalize: (orderId: string) => void;
}

/**
 * MyDeliveriesActions - Orquestador Atómico de Botones para Recogida.
 * Maneja la transición de 3 pasos sin contraer el contenedor principal.
 */
export function MyDeliveriesActions({ 
  orderId, 
  status, 
  onUpdateStatus, 
  onFinalize 
}: MyDeliveriesActionsProps) {
  
  // FASE 1: IR A RECOGER
  const isStartPickup = ['delivered', 'at_destination'].includes(status);
  
  // FASE 2: LLEGADA AL SITIO
  const isMovingToPickup = status === 'picking_up';
  
  // FASE 3: RECOGIDA FÍSICA
  const isAtPickup = status === 'at_pickup';

  return (
    <div className="pt-2 animate-in fade-in duration-500">
      {isStartPickup && (
        <Button 
          onClick={() => onUpdateStatus('picking_up', { id: orderId })}
          className="w-full h-16 rounded-[24px] bg-slate-100 text-slate-900 font-black uppercase text-xs tracking-widest gap-3 shadow-xl hover:bg-white active:scale-95 transition-all"
        >
          <Navigation className="w-5 h-5 text-primary" /> IR A RECOGER LAVADORA
        </Button>
      )}

      {isMovingToPickup && (
        <Button 
          onClick={() => onUpdateStatus('at_pickup', { id: orderId })}
          className="w-full h-16 rounded-[24px] bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-2xl hover:bg-blue-500 active:scale-95 transition-all border-b-4 border-blue-800 leading-tight px-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LLEGUÉ A BUSCAR LA LAVADORA
          </div>
        </Button>
      )}

      {isAtPickup && (
        <Button 
          onClick={() => onFinalize(orderId)}
          className="w-full h-20 rounded-[24px] bg-green-600 text-white font-black uppercase text-xs tracking-widest gap-3 shadow-[0_15px_40px_rgba(34,197,94,0.4)] border-b-[8px] border-green-800 active:border-b-0 active:translate-y-2 transition-all"
        >
          <CheckCircle2 className="w-6 h-6 animate-bounce" /> RECOGÍ LA LAVADORA
        </Button>
      )}
    </div>
  );
}
