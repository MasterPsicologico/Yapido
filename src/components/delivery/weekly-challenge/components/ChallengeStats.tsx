
"use client";

import { Star, Wallet } from 'lucide-react';
import { ChallengeStatCard } from './ChallengeStatCard';

interface ChallengeStatsProps {
  avgRating: number;
  weeklyEarnings: number;
}

/**
 * ChallengeStats - Orquestador de Cuadrantes de Rendimiento Real.
 * Ahora recibe datos dinámicos de transacciones y reputación.
 */
export function ChallengeStats({ avgRating, weeklyEarnings }: ChallengeStatsProps) {
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

      {/* CUADRANTE GANANCIAS SEMANALES REALES */}
      <ChallengeStatCard 
        label="Total Semanal"
        value={formattedEarnings}
        icon={Wallet}
        iconBg="bg-primary/5"
        iconColor="text-primary"
      />
    </div>
  );
}
