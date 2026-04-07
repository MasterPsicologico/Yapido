
"use client";

import * as React from 'react';
import { MapPin, Sparkles, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AddressFieldProps {
  address: string;
  onAddressChange: (v: string) => void;
  sector: string;
  onSectorChange: (v: string) => void;
  errorSector?: boolean;
  errorAddress?: boolean;
}

export function AddressField({ 
  address, 
  onAddressChange, 
  sector, 
  onSectorChange,
  errorSector,
  errorAddress
}: AddressFieldProps) {
  // Usamos un objeto para pasar las refs desde el padre si fuera necesario, 
  // pero aquí las manejamos con IDs para el scroll del contenedor si es simple.
  
  return (
    <div className="space-y-6">
      {/* CAMPO 1: BARRIO / SECTOR (PÚBLICO PARA EL RADAR) */}
      <div id="field-sector" className={cn("space-y-2 group transition-all duration-300", errorSector && "animate-shake-strong")}>
        <div className="flex items-center gap-2 ml-4">
          <Sparkles className={cn("w-3 h-3 animate-pulse", errorSector ? "text-red-500" : "text-yellow-600")} />
          <Label className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
            errorSector ? "text-red-500" : "text-slate-400"
          )}>
            Barrio o Sector (Público)
          </Label>
        </div>
        <div className="relative overflow-hidden rounded-[24px]">
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
          
          <div className={cn(
            "absolute left-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-slate-900 shadow-md z-10 transition-colors",
            errorSector ? "bg-red-500" : "bg-gradient-to-br from-yellow-400 to-yellow-600"
          )}>
            <Navigation className="w-5 h-5" />
          </div>
          
          <Input 
            value={sector} 
            onChange={(e) => onSectorChange(e.target.value)} 
            className={cn(
              "h-16 rounded-[24px] border-2 pl-16 pr-6 font-black text-slate-900 text-lg transition-all duration-500",
              "bg-gradient-to-r from-yellow-50/50 to-white focus:bg-white",
              errorSector 
                ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
                : "border-yellow-500/20 focus:border-yellow-500 focus:shadow-[0_0_25px_rgba(234,179,8,0.2)]"
            )}
            placeholder="Ej: Barrio El Centro o Sector Norte" 
          />
        </div>
      </div>

      {/* CAMPO 2: DIRECCIÓN EXACTA (PRIVADA - SOLO TRAS ACEPTAR) */}
      <div id="field-address" className={cn("space-y-2 group transition-all duration-300", errorAddress && "animate-shake-strong")}>
        <div className="flex items-center gap-2 ml-4">
          <Sparkles className={cn("w-3 h-3 animate-pulse", errorAddress ? "text-red-500" : "text-yellow-600")} />
          <Label className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
            errorAddress ? "text-red-500" : "text-slate-400"
          )}>
            Dirección Exacta (Protegida)
          </Label>
        </div>
        <div className="relative overflow-hidden rounded-[24px]">
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
          
          <div className={cn(
            "absolute left-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-slate-900 shadow-md z-10 transition-colors",
            errorAddress ? "bg-red-500" : "bg-gradient-to-br from-yellow-400 to-yellow-600"
          )}>
            <MapPin className="w-5 h-5" />
          </div>
          
          <Input 
            value={address} 
            onChange={(e) => onAddressChange(e.target.value)} 
            className={cn(
              "h-16 rounded-[24px] border-2 pl-16 pr-6 font-black text-slate-900 text-lg transition-all duration-500",
              "bg-gradient-to-r from-yellow-50/50 to-white focus:bg-white",
              errorAddress 
                ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
                : "border-yellow-500/20 focus:border-yellow-500 focus:shadow-[0_0_25px_rgba(234,179,8,0.2)]"
            )}
            placeholder="Calle, Número, Casa..." 
          />
        </div>
      </div>
    </div>
  );
}
