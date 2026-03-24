
"use client";

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarModeSwitcherProps {
  isDeliveryZone: boolean;
  isTransitioning: boolean;
  progress: number;
  onSwitch: () => void;
}

export function NavbarModeSwitcher({ isDeliveryZone, isTransitioning, progress, onSwitch }: NavbarModeSwitcherProps) {
  const targetLabel = isDeliveryZone ? "TIENDAS" : "DELIVERY";
  const targetIcon = isDeliveryZone ? "T" : "D";

  return (
    <div 
      className={cn(
        "relative flex items-center h-9 sm:h-10 rounded-full cursor-pointer transition-all duration-300 pr-1 sm:pr-4 pl-1 overflow-hidden min-w-[36px] sm:min-w-[120px] shadow-sm",
        isDeliveryZone ? "bg-primary/10 hover:bg-primary/20" : "bg-secondary/10 hover:bg-secondary/20"
      )}
      onClick={onSwitch}
    >
      {isTransitioning && (
        <div 
          className={cn("absolute inset-0 transition-all duration-100 ease-linear opacity-40", isDeliveryZone ? "bg-primary" : "bg-secondary")}
          style={{ width: `${progress}%` }}
        />
      )}
      <div className={cn(
        "relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-black shadow-lg transition-transform text-[10px] sm:text-xs",
        isDeliveryZone ? "bg-primary" : "bg-secondary",
        isTransitioning && "scale-90"
      )}>
        {isTransitioning ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : targetIcon}
      </div>
      <span className={cn(
        "relative z-10 ml-1.5 sm:ml-2 text-[10px] font-black uppercase tracking-widest transition-colors hidden sm:inline",
        isDeliveryZone ? "text-primary" : "text-secondary"
      )}>{targetLabel}</span>
    </div>
  );
}
