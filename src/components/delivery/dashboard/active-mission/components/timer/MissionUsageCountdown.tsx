
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
  onAddHours?: (hours: number) => void;
  onRemoveHour?: () => void;
  hideControls?: boolean;
  onSOS?: () => void;
}

/**
 * MissionUsageCountdown - Orquestador Atómico: Centro de Control de Tiempo.
 * Actualizado a fondo Blanco Élite con contraste Slate-900.
 */
export function MissionUsageCountdown({ progress, onAddHours, onRemoveHour, hideControls, onSOS = undefined }: MissionUsageCountdownProps) {
  const [pulseColor, setPulseColor] = useState<'none' | 'green' | 'red'>('none');

  const handleAction = (isAdd: boolean) => {
    setPulseColor(isAdd ? 'green' : 'red');
    if (isAdd && onAddHours) onAddHours(1);
    else if (!isAdd && onRemoveHour) onRemoveHour();
    
    setTimeout(() => setPulseColor('none'), 1500);
  };

  return (
    <section className="animate-in zoom-in duration-500 p-2 sm:p-4">
      <Card className={cn(
        "border-none rounded-[40px] p-6 sm:p-8 shadow-2xl relative overflow-visible ring-4 sm:ring-8 transition-all duration-700 bg-white text-slate-900",
        pulseColor === 'green' ? "ring-green-500/20" : 
        pulseColor === 'red' ? "ring-red-500/20" :
        progress.isExpired ? "ring-red-500/10 animate-pulse-red-glow" : "ring-amber-500/10"
      )}>
        {/* Inner background container for clipping without affecting outer glow */}
        <div className="absolute inset-0 overflow-hidden rounded-[40px] pointer-events-none">
          <div className={cn(
            "absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -mr-24 -mt-24 transition-colors duration-1000",
            pulseColor === 'green' ? "bg-green-500/5" :
            pulseColor === 'red' ? "bg-red-500/5" :
            progress.isExpired ? "bg-red-500/5" : "bg-amber-500/5"
          )} />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-5">
          <div className="flex flex-col items-center gap-2">
            {progress.isExpired ? (
              <div className="flex items-center gap-2 bg-red-600 px-4 py-1.5 rounded-full animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                <AlertCircle className="w-4 h-4 text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">RECOGER AHORA</span>
              </div>
            ) : (
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] italic">
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

          {!hideControls && (
            <TimeAdjustmentControls 
              onAdd={() => handleAction(true)} 
              onRemove={() => handleAction(false)}
              disabled={pulseColor !== 'none'}
            />
          )}

          {typeof onSOS === 'function' && (
            <div className="w-full pt-4 mt-2 border-t border-slate-100">
              <button 
                onClick={onSOS}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black text-[10px] uppercase tracking-widest py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors border border-red-200"
              >
                <AlertCircle className="w-4 h-4" />
                REPORTAR AVERÍA O PROBLEMA (S.O.S)
              </button>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}
