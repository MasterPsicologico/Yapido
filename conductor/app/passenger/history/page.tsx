'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCOP } from '@/lib/geo';
import { StatusPill } from '@/components/trip/StatusPill';
import Link from 'next/link';
import type { Trip } from '@/lib/contracts';

export default function HistoryPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const q = query(
          collection(firebaseDb(), 'trips'),
          where('passenger.uid', '==', user.uid),
          orderBy('timeline.requestedAt', 'desc'),
          limit(30)
        );
        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({ tripId: d.id, ...(d.data() as Omit<Trip, 'tripId'>) }));
        setTrips(items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <div className="p-6 text-muted-foreground">Cargando…</div>;

  return (
    <main className="min-h-screen p-4 pt-safe">
      <h1 className="text-2xl font-bold mb-4">Historial de viajes</h1>
      {trips.length === 0 ? (
        <p className="text-muted-foreground">Aún no tienes viajes.</p>
      ) : (
        <ul className="space-y-3">
          {trips.map((t) => (
            <li key={t.tripId} className="card">
              <Link href={`/passenger/trip/${t.tripId}`} className="block">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium truncate">{t.dropoff.address}</p>
                  <StatusPill status={t.status} />
                </div>
                <p className="text-xs text-muted-foreground">→ {t.dropoff.address}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">{formatDate(t.timeline.requestedAt)}</p>
                  <p className="font-semibold">{formatCOP(t.fare.total)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function formatDate(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

