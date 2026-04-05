
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
    <div className="p-6 pt-2 border-t border-white/5 shrink-0">
      <Button 
        onClick={onConfirm} 
        disabled={isDisabled} 
        className={cn(
          "w-full h-16 rounded-[24px] font-black uppercase text-sm tracking-widest shadow-lg active:scale-95 transition-all",
          isAlarm ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" : "bg-primary shadow-primary/20"
        )}
      >
        {isAlarm ? "ALERTAR Y LIBERAR" : "CONFIRMAR LIBERACIÓN"}
      </Button>
      <p className="text-[7px] text-center text-slate-500 font-black uppercase tracking-[0.4em] mt-4">
        SISTEMA BLINDADO • VITRINIANDO AI
      </p>
    </div>
  );
}
