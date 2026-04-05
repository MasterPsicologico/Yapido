
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
      className="w-full h-20 rounded-[32px] bg-primary text-white font-black text-base sm:text-lg uppercase italic tracking-[0.15em] gap-4 shadow-[0_20px_60px_rgba(59,130,246,0.4)] border-b-[8px] border-blue-800 active:border-b-0 active:translate-y-2 transition-all group"
    >
      ACEPTAR ESTA RUTA <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
    </Button>
  );
}
