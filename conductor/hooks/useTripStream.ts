/**
 * Hook que escucha el viaje en tiempo real (RTDB + Firestore snapshot).
 */

'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase/client';
import { subscribeTripLive } from '@/lib/realtime';
import { useDriverStore } from '@/store/driverStore';
import type { LatLng, Trip } from '@/lib/contracts';

export function useTripStream(tripId: string | null) {
  const cityId = useDriverStore((s) => s.cityId);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [driverLoc, setDriverLoc] = useState<LatLng | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // 1. Firestore: source of truth
    const unsubFs = onSnapshot(
      doc(firebaseDb(), 'trips', tripId),
      (snap) => {
        if (snap.exists()) {
          setTrip({ tripId: snap.id, ...(snap.data() as Omit<Trip, 'tripId'>) });
        } else {
          setError('Viaje no encontrado');
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    // 2. RTDB: live location del conductor
    const unsubRtdb = subscribeTripLive(cityId, tripId, (data) => {
      if (!data) return;
      if (data.driverLoc) {
        setDriverLoc({ lat: data.driverLoc.lat, lng: data.driverLoc.lng });
      }
      if (data.status) setLiveStatus(data.status as string);
      if (typeof data.eta === 'number') setEta(data.eta);
    });

    return () => {
      unsubFs();
      unsubRtdb();
    };
  }, [tripId, cityId]);

  return { trip, driverLoc, liveStatus, eta, loading, error };
}

