
"use client";

import { MapPin, User, ShieldCheck } from 'lucide-react';

interface RouteIdentityProps {
  customerName: string;
  customerAddress: string;
  customerSector?: string;
}

export function RouteIdentity({ customerName, customerAddress, customerSector }: RouteIdentityProps) {
  return (
    <div className="flex items-start gap-5">
      <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0 border border-slate-50 relative">
        <MapPin className="w-6 h-6 text-primary" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
          <ShieldCheck className="w-2 h-2 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <User className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {customerName || 'Cliente Protegido'}
          </span>
        </div>
        
        {/* VISUALIZACIÓN DEL SECTOR (DIRECCIÓN EXACTA OCULTA) */}
        <p className="text-lg font-black text-slate-800 leading-tight uppercase italic tracking-tighter line-clamp-2">
          {customerSector || 'Sector por definir'}
        </p>
        
        <div className="flex items-center gap-1.5 pt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          <span className="text-[8px] font-black text-yellow-600 uppercase tracking-widest italic">
            Dirección exacta oculta hasta aceptar
          </span>
        </div>
      </div>
    </div>
  );
}
