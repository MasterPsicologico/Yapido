
"use client";

import { Zap, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteHeaderProps {
  protocolId: string;
  isDirectRequest?: boolean;
}

export function RouteHeader({ protocolId, isDirectRequest }: RouteHeaderProps) {
  return (
    <div className={cn(
      "h-12 px-8 flex items-center justify-between gap-2 text-white shrink-0 relative overflow-hidden",
      isDirectRequest 
        ? "bg-gradient-to-r from-red-600 to-red-800 animate-pulse-red-glow" 
        : "bg-gradient-to-r from-green-500 to-emerald-600"
    )}>
      {isDirectRequest && (
        <div className="absolute top-0 right-0 w-24 h-full bg-white/10 skew-x-[-35deg] translate-x-12 animate-shimmer pointer-events-none" />
      )}

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">
          {isDirectRequest ? "SOLICITUD DIRECTA" : "RADAR ACTIVO"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {isDirectRequest && <Zap className="w-3.5 h-3.5 text-yellow-400 fill-current animate-bounce" />}
        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest italic">
          #{protocolId.slice(-6).toUpperCase()}
        </span>
      </div>
    </div>
  );
}
