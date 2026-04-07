
"use client";

import { MapPin, Sparkles, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AddressFieldProps {
  address: string;
  onAddressChange: (v: string) => void;
  sector: string;
  onSectorChange: (v: string) => void;
}

export function AddressField({ address, onAddressChange, sector, onSectorChange }: AddressFieldProps) {
  return (
    <div className="space-y-6">
      {/* CAMPO 1: BARRIO / SECTOR (PÚBLICO PARA EL RADAR) */}
      <div className="space-y-2 group">
        <div className="flex items-center gap-2 ml-4">
          <Navigation className="w-3 h-3 text-primary animate-pulse" />
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Barrio o Sector (Público)</Label>
        </div>
        <div className="relative overflow-hidden rounded-[24px]">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 z-10">
            <Navigation className="w-5 h-5" />
          </div>
          <Input 
            value={sector} 
            onChange={(e) => onSectorChange(e.target.value)} 
            className="h-16 rounded-[24px] border-2 border-slate-100 pl-16 pr-6 font-bold text-slate-900 text-lg bg-slate-50 focus:bg-white focus:border-primary transition-all"
            placeholder="Ej: Barrio El Centro o Sector Norte" 
          />
        </div>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Esta información la verán todos los repartidores</p>
      </div>

      {/* CAMPO 2: DIRECCIÓN EXACTA (PRIVADA - SOLO TRAS ACEPTAR) */}
      <div className="space-y-2 group">
        <div className="flex items-center gap-2 ml-4">
          <Sparkles className="w-3 h-3 text-yellow-600 animate-pulse" />
          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Dirección Exacta (Protegida)</Label>
        </div>
        <div className="relative overflow-hidden rounded-[24px]">
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
          <div className="absolute left-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-slate-900 shadow-md z-10">
            <MapPin className="w-5 h-5" />
          </div>
          <Input 
            value={address} 
            onChange={(e) => onAddressChange(e.target.value)} 
            className={cn(
              "h-16 rounded-[24px] border-2 border-yellow-500/20 pl-16 pr-6 font-black text-slate-900 text-lg transition-all duration-500",
              "bg-gradient-to-r from-yellow-50/50 to-white focus:bg-white focus:border-yellow-500 focus:shadow-[0_0_25px_rgba(234,179,8,0.2)]"
            )}
            placeholder="Calle, Número, Casa..." 
          />
        </div>
        <p className="text-[8px] font-black text-yellow-600 uppercase tracking-widest ml-4">Solo el repartidor que aceptes verá estos datos</p>
      </div>
    </div>
  );
}
