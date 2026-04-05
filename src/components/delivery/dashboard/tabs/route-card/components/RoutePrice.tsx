
"use client";

import { Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RoutePriceProps {
  formattedPrice: string;
  requestHours: number;
  washerType: string;
  createdAt?: any;
}

export function RoutePrice({ formattedPrice, requestHours, washerType, createdAt }: RoutePriceProps) {
  // Procesar el timestamp de Firestore de forma segura
  const dateObj = createdAt?.toDate?.() || (createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date());
  const formattedDate = format(dateObj, "dd MMM, HH:mm", { locale: es });

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        {/* Etiqueta de Ganancia Sutil */}
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <Wallet className="w-3.5 h-3.5" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] italic">GANANCIA BRUTA</span>
        </div>
        
        {/* Línea de Horas y Tiempo de Solicitud: Negro, elegante y tamaño medio */}
        <div className="text-lg sm:text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
          {requestHours} horas <span className="text-slate-300 mx-1">•</span> 
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase align-middle">
            {formattedDate}
          </span>
        </div>

        {/* Precio: Protagonista absoluto en Rojo Élite */}
        <h2 className="text-6xl sm:text-7xl font-black italic tracking-tighter text-red-600 leading-none drop-shadow-sm">
          {formattedPrice}
        </h2>
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
