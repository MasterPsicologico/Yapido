
"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionFooterProps {
  onConfirm: () => void;
  isDisabled: boolean;
  isAlarm: boolean;
}

export function ActionFooter({ onConfirm, isDisabled, isAlarm }: ActionFooterProps) {
  return (
    <div className="p-8 pt-4 bg-slate-900/80 backdrop-blur-md border-t border-white/5 shrink-0 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
      <Button 
        onClick={onConfirm} 
        disabled={isDisabled} 
        className={cn(
          "w-full h-16 rounded-[24px] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all border-b-[6px]",
          isAlarm 
            ? "bg-red-600 hover:bg-red-700 border-red-900 shadow-red-500/20" 
            : "bg-primary border-blue-800 shadow-primary/20"
        )}
      >
        {isAlarm ? "ALERTAR Y LIBERAR" : "CONFIRMAR LIBERACIÓN"}
      </Button>
      <p className="text-[7px] text-center text-slate-600 font-black uppercase tracking-[0.5em] mt-6">
        SISTEMA BLINDADO • VITRINIANDO AI KERNEL
      </p>
    </div>
  );
}
