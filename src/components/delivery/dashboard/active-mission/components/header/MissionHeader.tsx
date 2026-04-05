
"use client";

import { format } from 'date-fns';
import { Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MissionHeaderProps {
  onReleaseOpen: () => void;
  status: string;
  isWithDriver: boolean;
  isInUse: boolean;
  isAtDestination: boolean;
  currentTime: Date;
}

export function MissionHeader({ 
  onReleaseOpen, 
  status, 
  isWithDriver, 
  isInUse, 
  isAtDestination, 
  currentTime 
}: MissionHeaderProps) {
  return (
    <div className="h-16 bg-slate-900 flex items-center justify-between px-4 text-white shrink-0 shadow-xl z-20">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onReleaseOpen} 
        className="h-10 w-10 text-white/60 hover:text-red-500 hover:bg-white/5 rounded-full transition-all"
      >
        <RotateCcw className="w-5 h-5" />
      </Button>
      
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full animate-pulse", 
          isInUse ? "bg-amber-500" : isAtDestination ? "bg-blue-500" : isWithDriver ? "bg-purple-500" : "bg-green-500"
        )} />
        <span className="text-[9px] font-black uppercase tracking-[0.2em]">
          {isInUse ? "EN USO" : isAtDestination ? "EN DESTINO" : isWithDriver ? "EN RUTA" : "BUSCANDO"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-black italic tracking-tighter tabular-nums">{format(currentTime, 'HH:mm')}</span>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <Clock className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}
