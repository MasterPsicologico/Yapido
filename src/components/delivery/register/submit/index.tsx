
"use client";

import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegisterSubmitProps {
  loading: boolean;
  isReady: boolean;
  onClick: () => void;
}

export function RegisterSubmit({ loading, isReady, onClick }: RegisterSubmitProps) {
  return (
    <div className="mt-16 space-y-6">
      <Button 
        onClick={onClick} 
        disabled={loading || !isReady} 
        className={cn(
          "w-full h-24 rounded-[40px] text-white font-black text-xl md:text-2xl gap-5 shadow-2xl transition-all active:scale-95 uppercase italic tracking-tighter",
          "relative transition-all duration-75 ease-out",
          isReady ? [
            "bg-primary hover:bg-primary/90 shadow-primary/30",
            "border-b-[10px] border-blue-800 hover:border-b-[6px] hover:translate-y-[4px] active:border-b-0 active:translate-y-[10px]"
          ] : "bg-slate-300 grayscale cursor-not-allowed border-none"
        )}
      >
        {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : (
          <>
            <CheckCircle2 className="w-8 h-8" /> 
            ENVIAR SOLICITUD MAESTRA 
            <ArrowRight className="w-6 h-6 hidden sm:inline" />
          </>
        )}
      </Button>
      <p className="text-[9px] text-center text-slate-300 font-black uppercase tracking-[0.5em] animate-pulse">
        SISTEMA BLINDADO • PROTECCIÓN DE DATOS ACTIVA
      </p>
    </div>
  );
}
