"use client";

import { Star, Timer } from 'lucide-react';
import { ChallengeStatCard } from './ChallengeStatCard';

/**
 * ChallengeStats - Orquestador de Cuadrantes de Rendimiento.
 * Distribuye las tarjetas atómicas en el tablero de estadísticas.
 */
export function ChallengeStats() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* CUADRANTE PROMEDIO - Blindado individualmente */}
      <ChallengeStatCard 
        label="Promedio"
        value="5.0"
        icon={Star}
        iconBg="bg-yellow-50"
        iconColor="text-yellow-500 fill-yellow-500"
      />

      {/* CUADRANTE ESTADO - Blindado individualmente */}
      <ChallengeStatCard 
        label="Estado"
        value="ACTIVO"
        icon={Timer}
        iconBg="bg-primary/5"
        iconColor="text-primary"
      />
    </div>
  );
}
