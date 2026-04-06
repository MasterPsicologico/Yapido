
"use client";

import { Navigation, PackageCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
 * Orquestador de Acciones para la Flota de Aguachica.
 * Simplificado para transiciones rápidas y cierre de tarjeta.
 */
export function MissionActionOrchestrator({
  status,
  isAtDestination,
  onUpdateStatus
}: MissionActionOrchestratorProps) {
  
  const isEnRoute = status === 'shipped';

  return (
    <section className="space-y-4">
      {/* ESTADO 1: SALIENDO DE BASE HACIA EL CLIENTE */}
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
          onClick={() => onUpdateStatus('delivered')} 
          className="w-full h-24 rounded-[36px] bg-purple-600 text-white font-black text-2xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all border-b-[10px] border-purple-800 active:border-b-0"
        >
          <PackageCheck className="w-8 h-8 animate-bounce" /> INSTALÉ LA LAVADORA
        </Button>
      )}
    </section>
  );
}
