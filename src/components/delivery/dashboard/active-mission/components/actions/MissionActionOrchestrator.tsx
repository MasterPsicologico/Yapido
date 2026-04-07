
"use client";

import { Navigation, PackageCheck } from 'lucide-react';
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
 * Orquestador de Acciones Logísticas para Aguachica.
 * Diseñado para transiciones de alta velocidad y liberación inmediata de pantalla.
 */
export function MissionActionOrchestrator({
  status,
  isAtDestination,
  onUpdateStatus
}: MissionActionOrchestratorProps) {
  
  const isEnRoute = status === 'shipped';

  return (
    <section className="space-y-4">
      {/* PASO 1: EN CAMINO AL CLIENTE */}
      {isEnRoute && (
        <Button 
          onClick={() => onUpdateStatus('at_destination')} 
          className="w-full h-20 rounded-[32px] bg-blue-600 text-white font-black text-xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all border-b-[8px] border-blue-900 active:border-b-0"
        >
          <Navigation className="w-7 h-7" /> LLEGUÉ AL DESTINO
        </Button>
      )}

      {/* PASO 2: INSTALACIÓN FINAL (Este botón cierra la tarjeta heroica) */}
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
