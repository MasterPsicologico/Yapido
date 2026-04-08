"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Importación de Piezas Atómicas
import { TimerDisplay } from './TimerDisplay';
import { TimerHistory } from './TimerHistory';
import { TimerProgressBar } from './TimerProgressBar';
import { TimeAdjustmentControls } from './TimeAdjustmentControls';

interface MissionUsageCountdownProps {
  progress: {
    hours: number;
    minutes: number;
    seconds: number;
    percentage: number;
    expiryLabel: string;
    isExpired: boolean;
    dropOffTime?: string;
    originalExpiry?: string;
  };
  onAddHours: (hours: number) => void;
  onRemoveHour?: () => void;
}

/**
 * MissionUsageCountdown - Orquestador Atómico: Centro de Control de Tiempo.
 * Mantiene el fondo azul oscuro (slate-950) inalterable.
 * Aplica luminiscencia roja externa cuando el tiempo expira.
 */
export function MissionUsageCountdown({ progress, onAddHours, onRemoveHour }: MissionUsageCountdownProps) {
  const [pulseColor, setPulseColor] = useState<'none' | 'green' | 'red'>('none');

  const handleAction = (isAdd: boolean) => {
    setPulseColor(isAdd ? 'green' : 'red');
    if (isAdd) onAddHours(1);
    else if (onRemoveHour) onRemoveHour();
    
    setTimeout(() => setPulseColor('none'), 1500);
  };

  return (
    <section className="animate-in zoom-in duration-500">
      <Card className={cn(
        "border-none rounded-[48px] p-8 shadow-2xl relative overflow-hidden ring-8 transition-all duration-700 bg-slate-950 text-white",
        pulseColor === 'green' ? "ring-green-500/40" : 
        pulseColor === 'red' ? "ring-red-500/40" :
        progress.isExpired ? "ring-red-500/30 animate-pulse-red-glow" : "ring-amber-500/20"
      )}>
        <div className={cn(
          "absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -mr-24 -mt-24 transition-colors duration-1000",
          pulseColor === 'green' ? "bg-green-500/20" :
          pulseColor === 'red' ? "bg-red-500/20" :
          progress.isExpired ? "bg-red-500/20" : "bg-amber-500/10"
        )} />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="flex flex-col items-center gap-2">
            {progress.isExpired ? (
              <div className="flex items-center gap-2 bg-red-600 px-4 py-1.5 rounded-full animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                <AlertCircle className="w-4 h-4 text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">RECOGER AHORA</span>
              </div>
            ) : (
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic">
                TIEMPO DE USO ACTIVO
              </p>
            )}
          </div>

          <TimerDisplay 
            hours={progress.hours} 
            minutes={progress.minutes} 
            seconds={progress.seconds} 
            isExpired={progress.isExpired}
            pulseColor={pulseColor}
          />

          <TimerHistory 
            dropOffTime={progress.dropOffTime} 
            originalExpiry={progress.expiryLabel} 
          />

          <TimerProgressBar 
            percentage={progress.percentage} 
            isExpired={progress.isExpired} 
            pulseColor={pulseColor}
          />

          <TimeAdjustmentControls 
            onAdd={() => handleAction(true)} 
            onRemove={() => handleAction(false)}
            disabled={pulseColor !== 'none'}
          />
        </div>
      </Card>
    </section>
  );
}