
"use client";

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RouteAcceptButtonProps {
  onAccept: () => void;
}

export function RouteAcceptButton({ onAccept }: RouteAcceptButtonProps) {
  return (
    <Button 
      onClick={onAccept} 
      className="w-full h-14 sm:h-16 rounded-[24px] sm:rounded-[32px] bg-primary text-white font-black text-sm sm:text-base uppercase italic tracking-[0.15em] gap-3 sm:gap-4 shadow-[0_10px_30px_rgba(59,130,246,0.4)] border-b-[4px] sm:border-b-[6px] border-blue-800 active:border-b-0 active:translate-y-1 sm:active:translate-y-2 transition-all group"
    >
      ACEPTAR ESTA RUTA <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform" />
    </Button>
  );
}
