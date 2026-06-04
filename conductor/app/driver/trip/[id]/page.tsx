'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Phone, MessageCircle, MapPin, Navigation, Check, Square, X } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase';
import { useDriverStore } from '@/store/driverStore';
import { useDriverGPS } from '@/hooks/useDriverGPS';
import { writeTripStatus, writeTripDriverLocation } from '@/lib/realtime';
import { apiCompleteTrip, apiStartTrip } from '@/lib/api';
import { MapView } from '@/components/map/MapView';
import { Button } from '@/components/shared/Button';
import { Rating } from '@/components/shared/Rating';
import { formatCOP, formatDistance, haversineMeters } from '@/lib/geo';
import { uuid } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { LatLng, Trip } from '@/lib/contracts';

export default function DriverTripPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tripId = params.id;
  const { user } = useAuth();
  const cityId = useDriverStore((s) => s.cityId);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [phase, setPhase] = useState<'arriving' | 'waiting' | 'inProgress'>('arriving');
  const [waitingSince, setWaitingSince] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useDriverGPS({ driverId: user?.uid ?? null, active: true });

  // Suscribirse al trip
  useEffect(() => {
    if (!tripId) return;
    return onSnapshot(doc(firebaseDb(), 'trips', tripId), (snap) => {
      if (snap.exists()) setTrip({ tripId: snap.id, ...(snap.data() as Omit<Trip, 'tripId'>) });
    });
  }, [tripId]);

  // Calcular distancia al pickup
  useEffect(() => {
    if (!trip?.pickup) return;
    const id = setInterval(() => {
      const loc = useDriverStore.getState().currentLocation;
      if (loc) {
        setDistance(haversineMeters(loc, trip.pickup));
      }
    }, 3_000);
    return () => clearInterval(id);
  }, [trip?.pickup]);

  const onArrived = async () => {
    if (!trip) return;
    await writeTripStatus(cityId, tripId, 'arriving');
    setPhase('waiting');
    setWaitingSince(Date.now());
  };

  const onStartTrip = async () => {
    if (!trip) return;
    try {
      await apiStartTrip(tripId, { requestId: uuid() });
      await writeTripStatus(cityId, tripId, 'in_progress');
      setPhase('inProgress');
    } catch (e) {
      console.error(e);
    }
  };

  const onComplete = async () => {
    if (!trip) return;
    try {
      await apiCompleteTrip(tripId, { requestId: uuid() });
      router.push('/driver/trip/done');
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo completar el viaje');
    }
  };

  const onCancel = async () => {
    if (!confirm('¿Cancelar el viaje?')) return;
    router.push('/driver/home');
  };

  if (!trip) {
    return (
      <main className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Cargando viaje…</div>
      </main>
    );
  }

  const target = phase === 'inProgress' ? trip.dropoff : trip.pickup;

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0">
        <MapView
          center={useDriverStore.getState().currentLocation ?? trip.pickup}
          zoom={16}
          pickup={trip.pickup}
          dropoff={trip.dropoff}
        />
      </div>

      <header className="absolute top-0 left-0 right-0 p-4 pt-safe z-10">
        <div className="flex items-center justify-between">
          <div className="card flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{phase === 'inProgress' ? 'Llevar a destino' : 'Ir al pickup'}</p>
              {distance != null && phase !== 'inProgress' && (
                <p className="font-semibold">{formatDistance(distance)}</p>
              )}
            </div>
          </div>
          <button onClick={onCancel} className="card !p-2.5">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <section className="absolute bottom-0 left-0 right-0 z-10 pb-safe">
        <div className="card !rounded-b-none !rounded-t-3xl !border-b-0">
          <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-slate-300" />

          {/* Pasajero */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
              {trip.passenger.displayName?.[0]?.toUpperCase() ?? 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{trip.passenger.displayName}</p>
              <Rating score={trip.passenger.rating} size="sm" />
            </div>
            <div className="flex gap-1">
              <button className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <Phone className="h-4 w-4" />
              </button>
              <button className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Recoger en</p>
                <p className="font-medium truncate">{trip.pickup.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Llevar a</p>
                <p className="font-medium truncate">{trip.dropoff.address}</p>
              </div>
            </div>
          </div>

          {phase === 'arriving' && (
            <div className="grid grid-cols-1 gap-2 mt-3">
              <Button size="lg" onClick={onArrived}>
                <Check className="h-5 w-5" /> Ya llegué al pickup
              </Button>
            </div>
          )}

          {phase === 'waiting' && (
            <div className="grid grid-cols-1 gap-2 mt-3">
              <WaitingTimer since={waitingSince} />
              <Button size="lg" onClick={onStartTrip}>
                <Navigation className="h-5 w-5" /> Iniciar viaje
              </Button>
            </div>
          )}

          {phase === 'inProgress' && (
            <div className="grid grid-cols-1 gap-2 mt-3">
              <div className="flex items-center justify-between bg-secondary rounded-xl p-3">
                <span className="text-sm text-muted-foreground">Total estimado</span>
                <span className="font-bold text-primary">{formatCOP(trip.fare.total)}</span>
              </div>
              <Button size="lg" variant="primary" onClick={onComplete}>
                <Square className="h-5 w-5" /> Completar viaje
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function WaitingTimer({ since }: { since: number | null }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!since) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - since) / 1000)), 1000);
    return () => clearInterval(t);
  }, [since]);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  const isLong = elapsed > 180; // 3 min
  return (
    <div className={`text-center text-sm font-semibold ${isLong ? 'text-amber-600' : 'text-muted-foreground'}`}>
      Esperando pasajero: {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
      {isLong && <p className="text-xs font-normal">Considera contactar al pasajero</p>}
    </div>
  );
}
