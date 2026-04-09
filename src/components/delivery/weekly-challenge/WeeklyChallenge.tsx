
"use client";

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChallengeHeader } from './components/ChallengeHeader';
import { ChallengeChart } from './components/ChallengeChart';
import { ChallengeCycle } from './components/ChallengeCycle';
import { ChallengeStats } from './components/ChallengeStats';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

interface WeeklyChallengeProps {
  orders: any[] | null;
}

/**
 * WeeklyChallenge - Orquestador Maestro de Rendimiento.
 * Calcula las métricas globales de la semana para distribuirlas a los componentes atómicos.
 */
export function WeeklyChallenge({ orders }: WeeklyChallengeProps) {
  // CÁLCULO DE MÉTRICAS REALES DE LA SEMANA
  const metrics = useMemo(() => {
    if (!orders) return { avgRating: 5.0, weeklyEarnings: 0 };

    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });

    const weeklyOrders = orders.filter(o => {
      const ts = o.completedAt || o.deliveredAt || o.createdAt;
      const date = ts?.toDate?.() || (ts?.seconds ? new Date(ts.seconds * 1000) : null);
      if (!date) return false;
      return isWithinInterval(date, { start, end });
    });

    const totalStars = weeklyOrders.reduce((acc, curr) => acc + (curr.driverRatingByCustomer || 5), 0);
    const avgRating = weeklyOrders.length > 0 ? (totalStars / weeklyOrders.length) : 5.0;
    
    const weeklyEarnings = weeklyOrders.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    return {
      avgRating: Number(avgRating.toFixed(1)),
      weeklyEarnings
    };
  }, [orders]);

  return (
    <Card className="border-none rounded-[40px] shadow-2xl bg-white overflow-hidden ring-1 ring-black/[0.03]">
      <ChallengeHeader />
      <CardContent className="p-8 pt-4 space-y-6">
        <ChallengeChart orders={orders} />
        <ChallengeCycle />
        <ChallengeStats 
          avgRating={metrics.avgRating} 
          weeklyEarnings={metrics.weeklyEarnings} 
        />
      </CardContent>
    </Card>
  );
}
