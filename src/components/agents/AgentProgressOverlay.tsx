
"use client";

import { useEffect, useState } from 'react';
import { 
  Loader2, 
  ShieldCheck, 
  Zap, 
  MapPinned, 
  Sparkles, 
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
      const timer = setTimeout(() => {
        if (currentLogIdx < logs.length - 1) {
          setCurrentLogIdx(prev => prev + 1);
        } else {
          // PROCESO TERMINADO: Esperar un momento para que el usuario lea y luego activar el fin
          setShowFinishButton(true);
          if (onComplete && !isError) {
            // Auto-redirección tras 2.5 segundos de lectura
            const redirectTimer = setTimeout(onComplete, 2500);
            return () => clearTimeout(redirectTimer);
          }
        }
      }, 1000); // Un segundo por log para legibilidad quirúrgica
      return () => clearTimeout(timer);
    }
  }, [isOpen, logs, currentLogIdx, onComplete, isError]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="max-w-md w-full space-y-10 text-center">
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 rounded-[40px] bg-primary/20 animate-ping duration-[3000ms]" />
          <div className="relative w-32 h-32 bg-slate-800 rounded-[40px] border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
            {isError ? (
              <AlertCircle className="w-16 h-16 text-red-500 animate-vibrate" />
            ) : showFinishButton ? (
              <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-500" />
            ) : (
              <div className="relative">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className={cn(
            "text-3xl font-black italic uppercase tracking-tighter leading-none",
            isError ? "text-red-400" : "text-white"
          )}>
            {isError ? "Intervención de Seguridad" : showFinishButton ? "Sincronización Exitosa" : "Vitriniando AI"}
          </h2>
          <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.5em] ml-1">
            {isError ? "Protocolo Detenido" : showFinishButton ? "Finalizando Operación" : "Ciudadela de Agentes Activa"}
          </p>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-[32px] p-8 space-y-4 text-left min-h-[180px] flex flex-col justify-center shadow-inner relative overflow-hidden">
          {logs.slice(0, currentLogIdx + 1).map((log, i) => (
            <div key={i} className="flex items-start gap-3 animate-in slide-in-from-left-4 fade-in duration-500">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                i === currentLogIdx ? "bg-primary animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "bg-white/20"
              )} />
              <p className={cn(
                "text-[11px] font-bold uppercase tracking-widest leading-relaxed",
                i === currentLogIdx ? "text-white" : "text-white/30"
              )}>
                {log}
              </p>
            </div>
          ))}
          
          {isError && (
            <div className="pt-4 flex items-center gap-3 text-red-400 animate-in zoom-in duration-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-black uppercase italic">{errorMsg || "Error desconocido"}</p>
            </div>
          )}

          {showFinishButton && !isError && (
            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center animate-in fade-in duration-500">
               <div className="flex items-center gap-2 bg-white px-6 py-2 rounded-full shadow-2xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Redirigiendo...</span>
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
               </div>
            </div>
          )}
        </div>

        {isError && (
          <button 
            onClick={() => window.location.reload()}
            className="h-14 rounded-full bg-white text-slate-900 font-black uppercase tracking-widest px-10 shadow-xl"
          >
            REINTENTAR
          </button>
        )}
      </div>
    </div>
  );
}
