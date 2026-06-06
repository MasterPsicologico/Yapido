
"use client";

import { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReleaseHeader } from './components/ReleaseHeader';
import { ReleaseReasonItem } from './components/ReleaseReasonItem';
import { ActionFooter } from './components/ActionFooter';

const RELEASE_REASONS = [
  { id: "pinchazo", label: "Me he pinchado", isAlarm: true },
  { id: "gasolina", label: "Sin gasolina", isAlarm: true },
  { id: "accidente", label: "Accidente en ruta", isAlarm: true },
  { id: "falla_tecnica", label: "Falla técnica vehículo", isAlarm: false },
  { id: "espera_excesiva", label: "Espera excesiva en tienda", isAlarm: false },
  { id: "otro", label: "Otro motivo", isAlarm: false }
];

interface ReleaseMissionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmRelease: (reason: string) => void;
}

export function ReleaseMissionDialog({ isOpen, onOpenChange, onConfirmRelease }: ReleaseMissionDialogProps) {
  const [selectedReason, setSelectedReason] = useState<typeof RELEASE_REASONS[0] | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] w-[92vw] sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-[40px] bg-slate-900/95 backdrop-blur-2xl text-white outline-none [&>button:last-child]:hidden z-[600]">
        <div className="flex flex-col h-full max-h-[85dvh]">
          {/* Header Fijo */}
          <ReleaseHeader 
            onClose={() => onOpenChange(false)} 
            isAlarm={selectedReason?.isAlarm || false} 
          />

          {/* Instrucción Estática (Fuera del Scroll para mayor claridad) */}
          <div className="px-10 pb-4 shrink-0">
            <p className="text-[9px] text-slate-400 text-center uppercase font-black tracking-[0.2em] leading-relaxed opacity-60">
              Selecciona el motivo del reporte
            </p>
          </div>

          {/* Cuerpo con Scroll Área Protegida */}
          <div className="flex-1 min-h-0 px-6">
            <ScrollArea className="h-full w-full">
              <div className="space-y-3 pb-12 px-2"> 
                {/* El pb-12 asegura que la última opción no quede detrás del footer */}
                {RELEASE_REASONS.map((r) => (
                  <ReleaseReasonItem 
                    key={r.id}
                    reason={r}
                    isSelected={selectedReason?.id === r.id}
                    onSelect={setSelectedReason}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Footer Fijo con Sombra de Elevación */}
          <ActionFooter 
            onConfirm={() => selectedReason && onConfirmRelease(selectedReason.label)}
            isDisabled={!selectedReason}
            isAlarm={selectedReason?.isAlarm || false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
