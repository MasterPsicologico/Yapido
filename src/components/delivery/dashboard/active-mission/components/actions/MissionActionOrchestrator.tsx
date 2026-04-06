
"use client";

import { CheckCircle2, Navigation, Timer, Camera, Loader2, X, ShieldCheck, Store as StoreIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface MissionActionOrchestratorProps {
  status: string;
  isAtDestination: boolean;
  isInUse: boolean;
  evidencePhoto: string | null;
  isCompressing: boolean;
  onUpdateStatus: (status: string, metadata?: any) => void;
  onStartCamera: () => void;
  onClearPhoto: () => void;
}

/**
 * Módulo de Acciones Simplificado: Salida directa a destino.
 */
export function MissionActionOrchestrator({
  status,
  isAtDestination,
  isInUse,
  evidencePhoto,
  isCompressing,
  onUpdateStatus,
  onStartCamera,
  onClearPhoto
}: MissionActionOrchestratorProps) {
  
  // Determinamos si estamos en cualquier fase de transporte (aceptado, en tienda o cargado)
  const isEnRoute = status === 'shipped' || status === 'at_store' || status === 'delivered_to_driver';

  return (
    <section className="space-y-4">
      {/* 1. FLUJO DIRECTO: EN CAMINO AL CLIENTE */}
      {isEnRoute && !isAtDestination && (
        <Button 
          onClick={() => onUpdateStatus('at_destination')} 
          className="w-full h-20 rounded-[32px] bg-blue-600 text-white font-black text-xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all border-b-[8px] border-blue-900 active:border-b-0"
        >
          <Navigation className="w-7 h-7" /> LLEGUÉ AL DESTINO
        </Button>
      )}

      {/* 2. EN DESTINO: ENTREGAR E INICIAR USO */}
      {isAtDestination && (
        <div className="space-y-6">
          <Button 
            onClick={() => onUpdateStatus('delivered', { deliveredAt: new Date() })} 
            className="w-full h-24 rounded-[36px] bg-green-500 text-white font-black text-2xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all border-b-[10px] border-green-700 active:border-b-0"
          >
            <Timer className="w-8 h-8 animate-pulse" /> INICIAR TIEMPO
          </Button>

          <div className="flex flex-col items-center gap-4">
            {evidencePhoto && (
              <div className="relative aspect-video w-full rounded-[32px] overflow-hidden border-4 border-white shadow-xl animate-in zoom-in">
                <Image src={evidencePhoto} alt="Evidencia" fill className="object-cover" />
                <button onClick={onClearPhoto} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={onStartCamera}
              className="rounded-full h-12 px-8 border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest gap-3 hover:bg-slate-50"
            >
              <Camera className="w-4 h-4" /> {evidencePhoto ? "Cambiar Foto Evidencia" : "Tomar Foto Evidencia (Opcional)"}
            </Button>
          </div>
        </div>
      )}

      {/* 3. EN USO: MODO CUSTODIA */}
      {isInUse && (
        <div className="bg-slate-900 rounded-[36px] p-8 text-center space-y-4 border-2 border-white/5 opacity-60">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
            Misión Entregada • En Tiempo de Uso
          </p>
        </div>
      )}
    </section>
  );
}
