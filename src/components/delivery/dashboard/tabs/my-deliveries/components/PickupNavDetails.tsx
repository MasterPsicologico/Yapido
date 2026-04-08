
"use client";

import { MapPinned, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PickupNavDetailsProps {
  status: string;
  customerAddress: string;
  customerSector?: string;
}

/**
 * PickupNavDetails - Componente Atómico que despliega la ruta de navegación.
 * Aparece solo cuando el repartidor marca que va en camino a recoger.
 */
export function PickupNavDetails({ status, customerAddress, customerSector }: PickupNavDetailsProps) {
  // Desplegar solo en Fase 2 (En camino) o Fase 3 (En el sitio)
  if (status !== 'picking_up' && status !== 'at_pickup') return null;

  const handleOpenMaps = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customerAddress)}`, '_blank');
  };

  return (
    <div className="p-5 rounded-[28px] bg-slate-900 border border-white/10 shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
            <MapPinned className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-0.5">Destino de Recogida</p>
            <p className="text-[11px] font-black text-white uppercase italic truncate">
              {customerAddress}
            </p>
            {customerSector && (
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
                Sector: {customerSector}
              </p>
            )}
          </div>
        </div>
        
        <Button 
          onClick={handleOpenMaps}
          size="icon" 
          className="h-12 w-12 rounded-[18px] bg-primary text-white shadow-lg active:scale-90 transition-transform group"
        >
          <Navigation className="w-5 h-5 group-hover:animate-bounce" />
        </Button>
      </div>
      
      <div className="h-px bg-white/5 mx-2" />
      
      <div className="flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Navegación Activa para Recogida</span>
      </div>
    </div>
  );
}
