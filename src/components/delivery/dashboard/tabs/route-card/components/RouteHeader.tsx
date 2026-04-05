
"use client";

interface RouteHeaderProps {
  protocolId: string;
}

export function RouteHeader({ protocolId }: RouteHeaderProps) {
  return (
    <div className="h-12 px-8 flex items-center justify-between gap-2 text-white bg-gradient-to-r from-green-500 to-emerald-600 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">RADAR ACTIVO</span>
      </div>
      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest italic">
        Protocolo #{protocolId.slice(-6).toUpperCase()}
      </span>
    </div>
  );
}
