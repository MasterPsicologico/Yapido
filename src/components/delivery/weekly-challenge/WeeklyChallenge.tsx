
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { ChallengeHeader } from './components/ChallengeHeader';
import { ChallengeChart } from './components/ChallengeChart';
import { ChallengeCycle } from './components/ChallengeCycle';
import { ChallengeStats } from './components/ChallengeStats';

interface WeeklyChallengeProps {
  orders: any[] | null;
}

export function WeeklyChallenge({ orders }: WeeklyChallengeProps) {
  return (
    <Card className="border-none rounded-[40px] shadow-2xl bg-white overflow-hidden ring-1 ring-black/[0.03]">
      <ChallengeHeader />
      <CardContent className="p-8 pt-4 space-y-6">
        <ChallengeChart orders={orders} />
        <ChallengeCycle />
        <ChallengeStats />
      </CardContent>
    </Card>
  );
}
