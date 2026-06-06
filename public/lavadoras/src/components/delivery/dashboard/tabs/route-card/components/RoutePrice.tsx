
"use client";

import { Wallet, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RoutePriceProps {
  formattedPrice: string;
  totalPrice?: number;
  requestHours: number;
  washerType: string;
  createdAt?: any;
  commissionRate?: number;
}

export function RoutePrice({ formattedPrice, totalPrice = 0, requestHours, washerType, createdAt, commissionRate = 0.20 }: RoutePriceProps) {
  // Procesar el timestamp de Firestore de forma segura
  const dateObj = createdAt?.toDate?.() || (createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date());
  const formattedDate = format(dateObj, "dd MMM, HH:mm", { locale: es });
  const driverCut = Math.round(totalPrice * commissionRate);
  const formattedDriverCut = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(driverCut);

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        {/* Etiqueta de Valor del Servicio */}
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <Wallet className="w-3.5 h-3.5" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] italic">VALOR DEL SERVICIO</span>
        </div>
        
        {/* Línea de Horas y Tiempo de Solicitud */}
        <div className="text-lg sm:text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
          {requestHours} horas <span className="text-slate-300 mx-1">•</span> 
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase align-middle">
            {formattedDate}
          </span>
        </div>

        {/* Precio total del servicio */}
        <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-red-600 leading-none drop-shadow-sm">
          {formattedPrice}
        </h2>

        {/* Comisión del repartidor */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
            Tu comisión: {formattedDriverCut} ({Math.round(commissionRate * 100)}%)
          </span>
        </div>
      </div>
      
      <div className="text-right">
        {/* Metadato sutil del equipo */}
        <Badge className="bg-primary/10 text-primary border-none text-[7px] font-black uppercase px-2 italic">
          {washerType === 'automatica' ? 'Auto' : 'Semi'}
        </Badge>
      </div>
    </div>
  );
}
