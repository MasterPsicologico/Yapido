
"use client";

import { useEffect, useState } from 'react';
import { 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AgentProgressOverlayProps {
  isOpen: boolean;
  logs: string[];
  isError?: boolean;
  errorMsg?: string;
  onComplete?: () => void;
}

export function AgentProgressOverlay({ isOpen, logs, isError, errorMsg, onComplete }: AgentProgressOverlayProps) {
  const [currentLogIdx, setCurrentLogIdx] = useState(0);
  const [showFinishButton, setShowFinishButton] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentLogIdx(0);
      setShowFinishButton(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && logs.length > currentLogIdx) {
      // REDUCCIÓN QUIRÚRGICA DE TIEMPOS (300ms por log para velocidad instantánea)
      const timer = setTimeout(() => {
        if (currentLogIdx < logs.length - 1) {
          setCurrentLogIdx(prev => prev + 1);
        } else {
          setShowFinishButton(true);
          if (onComplete && !isError) {
            // REDIRECCIÓN AUTOMÁTICA EN 1 SEGUNDO
            const redirectTimer = setTimeout(onComplete, 1000);
            return () => clearTimeout(redirectTimer);
          }
        }
      }, 300); 
      return () => clearTimeout(timer);
    }
  }, [isOpen, logs, currentLogIdx, onComplete, isError]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="max-w-md w-full space-y-10 text-center">
        <div className="relative mx-auto w-28 h-28">
          <div className="absolute inset-0 rounded-[32px] bg-primary/20 animate-ping [animation-duration:2000ms]" />
          <div className="relative w-28 h-28 bg-slate-800 rounded-[32px] border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
            {isError ? (
              <AlertCircle className="w-14 h-14 text-red-500" />
            ) : showFinishButton ? (
              <CheckCircle2 className="w-14 h-14 text-green-500 animate-in zoom-in" />
            ) : (
              <div className="relative">
                <Loader2 className="w-14 h-14 text-primary animate-spin" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className={cn(
            "text-2xl font-black italic uppercase tracking-tighter leading-none",
            isError ? "text-red-400" : "text-white"
          )}>
            {isError ? "Intervención de Seguridad" : showFinishButton ? "Sincronización Élite" : "Vitriniando AI"}
          </h2>
          <p className="text-primary/60 text-[9px] font-black uppercase tracking-[0.4em] ml-1">
            Ciudadela de Agentes Activa
          </p>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-[28px] p-6 space-y-3 text-left min-h-[140px] flex flex-col justify-center shadow-inner">
          {logs.slice(0, currentLogIdx + 1).map((log, i) => (
            <div key={i} className="flex items-start gap-3 animate-in slide-in-from-left-4 fade-in duration-300">
              <div className={cn(
                "w-1 h-1 rounded-full mt-1.5 shrink-0",
                i === currentLogIdx ? "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "bg-white/20"
              )} />
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest leading-relaxed",
                i === currentLogIdx ? "text-white" : "text-white/30"
              )}>
                {log}
              </p>
            </div>
          ))}
          
          {isError && (
            <div className="pt-4 flex items-center gap-3 text-red-400 animate-in zoom-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[10px] font-black uppercase italic">{errorMsg || "Error desconocido"}</p>
            </div>
          )}
        </div>

        {isError && (
          <Button 
            onClick={() => window.location.reload()}
            className="h-14 rounded-full bg-white text-slate-900 font-black uppercase tracking-widest px-10"
          >
            REINTENTAR
          </Button>
        )}
      </div>
    </div>
  );
}
