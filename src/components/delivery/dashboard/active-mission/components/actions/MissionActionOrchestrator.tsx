
"use client";

import { Navigation, Timer, Camera, CheckCircle2, PackageCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MissionActionOrchestratorProps {
  status: string;
  isAtDestination: boolean;
  isInUse: boolean;
  isExpired?: boolean;
  onUpdateStatus: (status: string, metadata?: any) => void;
  onStartCamera: () => void;
  evidencePhoto: string | null;
}

/**
 * Orquestador de Acciones Evolutivo para Aguachica Digital.
 */
export function MissionActionOrchestrator({
  status,
  isAtDestination,
  isInUse,
  isExpired,
  onUpdateStatus,
  onStartCamera,
  evidencePhoto
}: MissionActionOrchestratorProps) {
  
  const isEnRoute = status === 'shipped' || status === 'delivered_to_driver';

  return (
    <section className="space-y-4">
      {/* ESTADO 1: EN TRAYECTO */}
      {isEnRoute && (
        <Button 
          onClick={() => onUpdateStatus('at_destination')} 
          className="w-full h-20 rounded-[32px] bg-blue-600 text-white font-black text-xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all border-b-[8px] border-blue-900 active:border-b-0"
        >
          <Navigation className="w-7 h-7" /> LLEGUÉ AL DESTINO
        </Button>
      )}

      {/* ESTADO 2: EN CASA DEL CLIENTE (INSTALACIÓN) */}
      {isAtDestination && (
        <Button 
          onClick={() => onUpdateStatus('delivered', { deliveredAt: new Date() })} 
          className="w-full h-24 rounded-[36px] bg-purple-600 text-white font-black text-2xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all border-b-[10px] border-purple-800 active:border-b-0"
        >
          <PackageCheck className="w-8 h-8 animate-bounce" /> INSTALÉ LA LAVADORA
        </Button>
      )}

      {/* ESTADO 3: EN USO / EXPIRADO (RETORNO A CASA) */}
      {isInUse && isExpired && (
        <Button 
          onClick={() => onUpdateStatus('completed', { completedAt: new Date() })} 
          className="w-full h-24 rounded-[36px] bg-red-600 text-white font-black text-2xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all border-b-[10px] border-red-800 animate-glow-red-strong active:border-b-0"
        >
          <CheckCircle2 className="w-8 h-8" /> EQUIPO EN CASA
        </Button>
      )}
    </section>
  );
}
