
"use client";

import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ReleaseHeaderProps {
  onClose: () => void;
  isAlarm: boolean;
}

export function ReleaseHeader({ onClose, isAlarm }: ReleaseHeaderProps) {
  return (
    <div className="relative shrink-0 p-6 pb-2">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex flex-col items-center text-center space-y-4 pt-4">
        <div className="relative">
          <RotateCcw className="w-12 h-12 text-primary animate-spin-slow" />
          {isAlarm && (
            <AlertTriangle className="absolute -top-2 -right-2 w-6 h-6 text-red-500 animate-bounce" />
          )}
        </div>
        <div className="space-y-1">
          <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
            Liberar Misión
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
            Protocolo de Deserción
          </DialogDescription>
        </div>
      </div>
    </div>
  );
}
