
"use client";

/**
 * CitySelector — Selector de Ciudad Operativa
 * 
 * Componente obligatorio en el formulario de solicitud.
 * Muestra las ciudades activas de Firestore y permite
 * al usuario seleccionar en qué ciudad realiza la solicitud.
 */

import * as React from 'react';
import { Globe, ChevronDown, MapPin } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { CityConfig } from '@/lib/city-config';
import { formatCityFull } from '@/lib/city-config';

interface CitySelectorProps {
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  activeCities: CityConfig[];
  hasError?: boolean;
  saveStatus?: 'idle' | 'typing' | 'saved';
}

export function CitySelector({ 
  selectedCityId, 
  onCityChange, 
  activeCities,
  hasError 
}: CitySelectorProps) {
  const selectedCity = activeCities.find(c => c.id === selectedCityId);

  return (
    <div id="field-city" className={cn("space-y-2 sm:space-y-3 group transition-all duration-300", hasError && "animate-shake-strong")}>
      <div className="flex items-center gap-2 ml-4 sm:ml-0">
        <Globe className={cn("w-3 h-3 animate-pulse", hasError ? "text-red-500" : "text-emerald-500")} />
        <Label className={cn(
          "text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-colors",
          hasError ? "text-red-500" : "text-slate-400"
        )}>
          Ciudad de Operación (Obligatorio)
        </Label>
      </div>
      <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px]">
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-emerald-200/20 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
        
        <div className={cn(
          "absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white shadow-md z-10 transition-colors",
          hasError ? "bg-red-500" : "bg-gradient-to-br from-emerald-400 to-emerald-600"
        )}>
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        
        <select
          value={selectedCityId}
          onChange={(e) => onCityChange(e.target.value)}
          className={cn(
            "w-full h-14 sm:h-14 lg:h-16 rounded-[20px] sm:rounded-[24px] border-2 pl-12 sm:pl-14 lg:pl-16 pr-10 font-black text-base sm:text-lg transition-all duration-500 appearance-none cursor-pointer",
            "bg-gradient-to-r from-emerald-50/50 to-white focus:bg-white",
            hasError 
              ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
              : "border-emerald-500/20 focus:border-emerald-500 focus:shadow-[0_0_25px_rgba(16,185,129,0.2)]",
            !selectedCityId && "text-slate-400/60 font-medium"
          )}
        >
          <option value="" disabled>Selecciona tu ciudad</option>
          {activeCities.map((city) => (
            <option key={city.id} value={city.id}>
              {formatCityFull(city)}
            </option>
          ))}
        </select>

        <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className={cn("w-4 h-4 sm:w-5 sm:h-5 transition-colors", hasError ? "text-red-400" : "text-emerald-400")} />
        </div>
      </div>

      {selectedCity && (
        <div className="flex items-center gap-2 ml-4 sm:ml-0 mt-1 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">
            Mín. {selectedCity.minHours}h • Desde ${new Intl.NumberFormat('es-CO').format(selectedCity.rateAuto)}/h
          </span>
        </div>
      )}
    </div>
  );
}
