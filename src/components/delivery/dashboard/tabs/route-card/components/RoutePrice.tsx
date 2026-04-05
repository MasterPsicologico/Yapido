
"use client";

import { Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RoutePriceProps {
  formattedPrice: string;
  requestHours: number;
  washerType: string;
}

export function RoutePrice({ formattedPrice, requestHours, washerType }: RoutePriceProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        {/* Etiqueta de Ganancia: Se mantiene minimalista en la parte superior */}
        <div className="flex items-center gap-2 text-red-600/40 mb-1">
          <Wallet className="w-3.5 h-3.5" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] italic">GANANCIA BRUTA</span>
        </div>
        
        {/* Cantidad de horas: Reubicada justo encima del precio, roja y sin contenedor */}
        <div className="text-3xl sm:text-4xl font-black italic tracking-tighter text-red-600 leading-none">
          {requestHours}H MISIÓN
        </div>

        {/* Precio: Protagonista absoluto en Rojo Élite */}
        <h2 className="text-6xl sm:text-7xl font-black italic tracking-tighter text-red-600 leading-none drop-shadow-sm">
          {formattedPrice}
        </h2>
      </div>
      
      <div className="text-right">
        {/* El tipo de equipo se mantiene como metadato sutil a la derecha */}
        <Badge className="bg-primary/10 text-primary border-none text-[7px] font-black uppercase px-2 italic">
          {washerType === 'automatica' ? 'Auto' : 'Semi'}
        </Badge>
      </div>
    </div>
  );
}
