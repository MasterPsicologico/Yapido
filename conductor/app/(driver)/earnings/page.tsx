'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCOP } from '@/lib/geo';
import { TrendingUp, Calendar, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { useDriverStore } from '@/store/driverStore';

export default function EarningsPage() {
  const { user } = useAuth();
  const setOnline = useDriverStore((s) => s.setOnline);
  const [trips, setTrips] = useState<any[]>([]);
  const [today, setToday] = useState(0);
  const [week, setWeek] = useState(0);
  const [tripsCount, setTripsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const q = query(
          collection(firebaseDb(), 'trips'),
          where('driver.uid', '==', user.uid),
          where('status', 'in', ['completed', 'rated']),
          orderBy('timeline.completedAt', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        const items = snap.docs.map((d) => d.data());
        setTrips(items);

        const now = Date.now();
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - 7);
        let t = 0, w = 0, c = 0;
        items.forEach((it: any) => {
          const ts = it.timeline?.completedAt?.toMillis?.() ?? 0;
          const earning = it.fare?.driverEarning ?? 0;
          if (ts >= startOfDay.getTime()) t += earning;
          if (ts >= startOfWeek.getTime()) w += earning;
          c += 1;
        });
        setToday(t);
        setWeek(w);
        setTripsCount(c);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user]);

  return (
    <main className="min-h-screen p-4 pt-safe">
      <h1 className="text-2xl font-bold mb-4">Ganancias</h1>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4" /> Hoy
          </div>
          <p className="text-2xl font-bold text-primary mt-1">{formatCOP(today)}</p>
          <p className="text-xs text-muted-foreground">{tripsCount} viajes</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> 7 días
          </div>
          <p className="text-2xl font-bold mt-1">{formatCOP(week)}</p>
        </div>
      </div>

      <Button fullWidth size="lg" variant="primary" leftIcon={<ArrowDownToLine className="h-5 w-5" />}>
        Retirar a mi banco
      </Button>

      <h2 className="text-lg font-semibold mt-6 mb-2">Últimos viajes</h2>
      <ul className="space-y-2">
        {trips.slice(0, 20).map((t, i) => (
          <li key={i} className="card flex items-center justify-between">
            <div>
              <p className="font-medium text-sm truncate">{t.dropoff?.address ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{formatDate(t.timeline?.completedAt)}</p>
            </div>
            <p className="font-bold text-primary">{formatCOP(t.fare?.driverEarning ?? 0)}</p>
          </li>
        ))}
        {trips.length === 0 && <p className="text-muted-foreground text-sm">Sin viajes aún</p>}
      </ul>
    </main>
  );
}

function formatDate(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

