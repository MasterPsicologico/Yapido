
"use client";

import { Button } from '@/components/ui/button';
import { Navigation, CheckCircle2 } from 'lucide-react';

interface MyDeliveriesActionsProps {
  orderId: string;
  status: string;
  onUpdateStatus: (status: string, metadata?: any) => void;
  onFinalize: (orderId: string) => void;
}

/**
 * MyDeliveriesActions - Botones de acción para el flujo de RECOGIDA.
 * 
 * SOLO se muestra cuando el pedido está en estado 'delivered' (lavadora en uso).
 * Permite al repartidor iniciar la recogida cuando el período de uso termina.
 * 
 * Flujo:
 *   delivered → [IR A RECOGER LAVADORA] → picking_up
 *   picking_up → se muestra en PickupMissionView (TerminalView hace routing)
 *   at_pickup → se muestra en PickupMissionView
 */
export function MyDeliveriesActions({ 
  orderId, 
  status, 
  onUpdateStatus, 
  onFinalize 
}: MyDeliveriesActionsProps) {
  
  // SOLO mostrar el botón de iniciar recogida cuando la lavadora está EN USO (delivered)
  const canStartPickup = status === 'delivered';

  // Si no está en fase de inicio de recogida, no renderizar nada
  if (!canStartPickup) return null;

  return (
    <div className="pt-2">
      <Button 
        onClick={(e) => {
          e.stopPropagation();
          onUpdateStatus('picking_up', { id: orderId });
        }}
        className="w-full h-16 rounded-[24px] bg-slate-100 text-slate-900 font-black uppercase text-xs tracking-widest gap-3 shadow-xl hover:bg-white active:scale-95 transition-all"
      >
        <Navigation className="w-5 h-5 text-primary" /> IR A RECOGER LAVADORA
      </Button>
    </div>
  );
}
