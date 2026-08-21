"use client";

import { MapPin, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ZoneConfig, CityConfig } from '@/lib/city-config';
import { resolveZonePricing } from '@/lib/city-config';

interface ZoneSelectorProps {
  zones: ZoneConfig[];
  cityConfig: CityConfig;
  selectedZoneId: string;
  onZoneChange: (zoneId: string) => void;
  error?: boolean;
  saveStatus?: 'idle' | 'typing' | 'saved';
}

export function ZoneSelector({ zones, cityConfig, selectedZoneId, onZoneChange, error }: ZoneSelectorProps) {
  if (zones.length <= 1) return null;

  const selectedZone = zones.find(z => z.id === selectedZoneId) || null;
  const pricing = resolveZonePricing(cityConfig, selectedZone);

  return (
    <div className={cn("space-y-2 group transition-all duration-300", error && "animate-shake-strong")}>
      <div className="flex items-center gap-2 ml-4">
        <MapPin className={cn("w-3 h-3 animate-pulse", error ? "text-red-500" : "text-blue-500")} />
        <label className={cn(
          "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
          error ? "text-red-500" : "text-slate-400"
        )}>
          Zona / Barrio
        </label>
      </div>
      <div className="relative">
        <div className={cn(
          "absolute left-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center shadow-md z-10 transition-colors",
          error ? "bg-red-500 text-white" : "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
        )}>
          <MapPin className="w-5 h-5" />
        </div>
        <select
          value={selectedZoneId}
          onChange={(e) => onZoneChange(e.target.value)}
          className={cn(
            "w-full h-14 sm:h-14 lg:h-16 rounded-[20px] sm:rounded-[24px] border-2 pl-12 sm:pl-14 lg:pl-16 pr-10 font-black text-base sm:text-lg transition-all duration-500 appearance-none cursor-pointer",
            "bg-gradient-to-r from-blue-50/50 to-white focus:bg-white",
            error
              ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              : "border-blue-500/20 focus:border-blue-500 focus:shadow-[0_0_25px_rgba(59,130,246,0.2)]"
          )}
        >
          <option value="">Selecciona tu barrio...</option>
          {zones.map(z => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      </div>
      {selectedZone && (
        <div className="flex items-center gap-2 ml-4 animate-in fade-in duration-300">
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
            Mín. {pricing.minHours}h • Desde ${pricing.rateAuto.toLocaleString()}/h
          </span>
        </div>
      )}
    </div>
  );
}
