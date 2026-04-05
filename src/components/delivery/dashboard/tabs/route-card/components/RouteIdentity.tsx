
"use client";

import { MapPin, User, CheckCircle2 } from 'lucide-react';

interface RouteIdentityProps {
  customerName: string;
  customerAddress: string;
}

export function RouteIdentity({ customerName, customerAddress }: RouteIdentityProps) {
  return (
    <div className="flex items-start gap-5">
      <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0 border border-slate-50 relative">
        <MapPin className="w-6 h-6 text-primary" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
          <CheckCircle2 className="w-2 h-2 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <User className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {customerName || 'Cliente de Aguachica'}
          </span>
        </div>
        <p className="text-lg font-black text-slate-800 leading-tight uppercase italic tracking-tighter line-clamp-2">
          {customerAddress}
        </p>
      </div>
    </div>
  );
}
