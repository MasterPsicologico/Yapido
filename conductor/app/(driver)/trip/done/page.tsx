'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Banknote, CreditCard } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCOP } from '@/lib/geo';
import { Button } from '@/components/shared/Button';

export default function TripDonePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [fare, setFare] = useState<{ total: number; driverEarning: number; platformFee: number } | null>(null);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <CheckCircle2 className="h-20 w-20 text-emerald-500 mb-4" />
      <h1 className="text-2xl font-bold">¡Viaje completado!</h1>
      {fare && (
        <div className="card mt-6 w-full max-w-sm space-y-2">
          <Row label="Total cobrado" value={formatCOP(fare.total)} />
          <Row label="Tu ganancia" value={formatCOP(fare.driverEarning)} highlight />
          <Row label="Comisión Yapido" value={formatCOP(fare.platformFee)} muted />
        </div>
      )}
      <div className="w-full max-w-sm mt-6 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => router.push('/(driver)/earnings')}>Ver ganancias</Button>
        <Button onClick={() => router.push('/(driver)/home')}>Listo</Button>
      </div>
    </main>
  );
}

function Row({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-bold ${highlight ? 'text-primary' : muted ? 'text-muted-foreground' : ''}`}>{value}</span>
    </div>
  );
}

