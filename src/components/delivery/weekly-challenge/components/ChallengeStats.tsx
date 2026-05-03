
"use client";

import { Star, Wallet } from 'lucide-react';
import { ChallengeStatCard } from './ChallengeStatCard';

interface ChallengeStatsProps {
  avgRating: number;
  weeklyEarnings: number;
  commissionRate?: number;
}

/**
 * ChallengeStats - Orquestador de Cuadrantes de Rendimiento Real.
 * Ahora recibe datos dinámicos de transacciones y reputación.
 */
export function ChallengeStats({ avgRating, weeklyEarnings, commissionRate = 0.20 }: ChallengeStatsProps) {
  const formattedEarnings = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(weeklyEarnings);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* CUADRANTE REPUTACIÓN REAL */}
      <ChallengeStatCard 
        label="Promedio"
        value={avgRating.toFixed(1)}
        icon={Star}
        iconBg="bg-yellow-50"
        iconColor="text-yellow-500 fill-yellow-500"
      />

      {/* CUADRANTE COMISIÓN SEMANAL DEL REPARTIDOR */}
      <ChallengeStatCard 
        label={`Comisión (${Math.round(commissionRate * 100)}%)`}
        value={formattedEarnings}
        icon={Wallet}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-500"
      />
    </div>
  );
}
