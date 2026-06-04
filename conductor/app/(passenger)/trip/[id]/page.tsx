'use client';

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Phone, MessageCircle, X, Star, ShieldCheck, CreditCard, Banknote, Loader2, CheckCircle2 } from 'lucide-react';
import { useMachine } from '@xstate/react';
import { tripMachine } from '@/store/tripMachine';
import { useTripStream } from '@/hooks/useTripStream';
import { useDriverStore } from '@/store/driverStore';
import { MapView } from '@/components/map/MapView';
import { Button } from '@/components/shared/Button';
import { Rating } from '@/components/shared/Rating';
import { StatusPill } from '@/components/trip/StatusPill';
import { apiCancelTrip } from '@/lib/api';
import { formatCOP, formatDuration } from '@/lib/geo';
import { cn } from '@/lib/utils';

export default function TripPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tripId = params.id;
  const cityId = useDriverStore((s) => s.cityId);

  const [state, send] = useMachine(tripMachine);
  const { trip, driverLoc, liveStatus, eta, loading } = useTripStream(tripId);

  // Hidratar la state machine cuando llega el trip
  useEffect(() => {
    if (!trip) return;
    if (trip.status === 'searching' && state.matches('idle')) {
      send({ type: 'REQUEST_TRIP', trip });
    } else if (trip.status === 'accepted' || trip.status === 'arriving') {
      if (trip.driver) send({ type: 'DRIVER_FOUND', driver: trip.driver });
      send({ type: 'TRIP_STARTED' });
      if (trip.status === 'arriving') send({ type: 'DRIVER_ARRIVED' });
    } else if (trip.status === 'in_progress') {
      if (trip.driver) send({ type: 'DRIVER_FOUND', driver: trip.driver });
      send({ type: 'TRIP_STARTED' });
      send({ type: 'DRIVER_ARRIVED' });
      send({ type: 'TRIP_STARTED' });
    } else if (trip.status === 'completed') {
      if (trip.driver) send({ type: 'DRIVER_FOUND', driver: trip.driver });
      send({ type: 'TRIP_COMPLETED', fare: trip.fare });
    } else if (trip.status === 'cancelled') {
      send({ type: 'CANCEL', by: 'system', reason: trip.timeline.cancelReason ?? 'Cancelado' });
    } else if (trip.status === 'no_drivers') {
      send({ type: 'NO_DRIVERS' });
    }
  }, [trip?.status]); // eslint-disable-line

  // Push de ubicación del conductor al state machine
  useEffect(() => {
    if (driverLoc) send({ type: 'DRIVER_LOCATION', loc: driverLoc });
  }, [driverLoc]); // eslint-disable-line

  // Push de ETA
  useEffect(() => {
    if (eta != null) send({ type: 'ETA_UPDATE', eta });
  }, [eta]); // eslint-disable-line

  const driver = trip?.driver ?? null;
  const pickup = trip?.pickup ?? null;
  const dropoff = trip?.dropoff ?? null;
  const center = useMemo(() => driverLoc ?? pickup ?? { lat: 8.3127, lng: -73.6218 }, [driverLoc, pickup]);

  async function handleCancel() {
    if (!tripId) return;
    if (!confirm('¿Cancelar el viaje? Podrías recibir un cargo si ya asignamos conductor.')) return;
    try {
      await apiCancelTrip(tripId, { requestId: crypto.randomUUID(), reason: 'passenger_changed_mind' });
      send({ type: 'CANCEL', by: 'passenger', reason: 'passenger_changed_mind' });
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <main className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (state.matches('cancelled')) {
    return (
      <CenteredMessage title="Viaje cancelado" subtitle="Esperemos a la próxima." action={{ label: 'Volver al inicio', onClick: () => router.push('/(passenger)/home') }} />
    );
  }
  if (state.matches('noDrivers')) {
    return (
      <CenteredMessage title="No encontramos conductores" subtitle="Intenta de nuevo en 1 minuto." action={{ label: 'Reintentar', onClick: () => router.push('/(passenger)/home') }} />
    );
  }
  if (state.matches('completed') || state.matches('rated')) {
    return <RatingScreen tripId={tripId} fare={trip?.fare.total ?? 0} onSubmitted={() => router.push('/(passenger)/home')} />;
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0">
        <MapView
          center={center}
          zoom={15}
          pickup={pickup ?? undefined}
          dropoff={dropoff ?? undefined}
          driverLoc={driverLoc ?? undefined}
        />
      </div>

      <header className="absolute top-0 left-0 right-0 p-4 pt-safe z-10">
        <div className="flex items-center justify-between">
          <StatusPill status={liveStatus ?? trip?.status ?? 'searching'} />
          {(state.matches('searching') || state.matches('offered') || state.matches('accepted')) && (
            <button onClick={handleCancel} className="card !p-2.5">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* Buscando */}
      {state.matches('searching') && (
        <SearchingCard eta={eta} />
      )}

      {/* Conductor asignado */}
      {(state.matches('offered') || state.matches('accepted')) && driver && (
        <DriverCard driver={driver} statusText="Va en camino" eta={eta} />
      )}

      {/* Conductor llegó */}
      {state.matches('arriving') && driver && (
        <DriverArrivedCard driver={driver} />
      )}

      {/* En curso */}
      {state.matches('inProgress') && driver && (
        <InProgressCard driver={driver} fare={trip?.fare.total ?? 0} />
      )}
    </main>
  );
}

function SearchingCard({ eta }: { eta: number | null }) {
  return (
    <section className="absolute bottom-0 left-0 right-0 z-10 pb-safe">
      <div className="card !rounded-b-none !rounded-t-3xl !border-b-0 text-center">
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-slate-300" />
        <div className="flex justify-center mb-3">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-3xl">🛵</div>
          </div>
        </div>
        <h2 className="text-lg font-semibold">Buscando tu conductor</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {eta ? `Tiempo estimado: ${formatDuration(eta)}` : 'Calculando tiempo estimado…'}
        </p>
        <p className="text-xs text-muted-foreground mt-2">Te notificaremos cuando acepten tu viaje.</p>
      </div>
    </section>
  );
}

function DriverCard({ driver, statusText, eta }: { driver: NonNullable<NonNullable<ReturnType<typeof useTripStream>['trip']>['driver']>; statusText: string; eta: number | null }) {
  return (
    <section className="absolute bottom-0 left-0 right-0 z-10 pb-safe">
      <div className="card !rounded-b-none !rounded-t-3xl !border-b-0">
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-slate-300" />
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
            {driver.displayName?.[0]?.toUpperCase() ?? 'Y'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{driver.displayName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Rating score={driver.rating} size="sm" />
              {driver.plate && <span className="chip">· {driver.plate}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{statusText}</p>
            {eta && <p className="font-semibold text-primary">{formatDuration(eta)}</p>}
          </div>
        </div>
        {driver.vehicleDesc && <p className="text-sm text-muted-foreground mt-2">{driver.vehicleDesc}</p>}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button variant="secondary" leftIcon={<Phone className="h-4 w-4" />}>Llamar</Button>
          <Button variant="secondary" leftIcon={<MessageCircle className="h-4 w-4" />}>Chat</Button>
        </div>
      </div>
    </section>
  );
}

function DriverArrivedCard({ driver }: { driver: any }) {
  return (
    <section className="absolute bottom-0 left-0 right-0 z-10 pb-safe">
      <div className="card !rounded-b-none !rounded-t-3xl !border-b-0 bg-emerald-50 border-emerald-200">
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-emerald-300" />
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <div>
            <h2 className="text-lg font-semibold">¡Tu conductor llegó!</h2>
            <p className="text-sm text-muted-foreground">{driver.displayName} te espera. Placa: {driver.plate}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function InProgressCard({ driver, fare }: { driver: any; fare: number }) {
  return (
    <section className="absolute bottom-0 left-0 right-0 z-10 pb-safe">
      <div className="card !rounded-b-none !rounded-t-3xl !border-b-0">
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-slate-300" />
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Viaje en curso con</p>
            <p className="font-semibold">{driver.displayName}</p>
          </div>
        </div>
        <div className="flex items-center justify-between bg-secondary rounded-xl p-3">
          <span className="text-sm text-muted-foreground">Total estimado</span>
          <span className="font-bold text-primary">{formatCOP(fare)}</span>
        </div>
      </div>
    </section>
  );
}

function RatingScreen({ tripId, fare, onSubmitted }: { tripId: string; fare: number; onSubmitted: () => void }) {
  const [score, setScore] = useState(0);
  const [tip, setTip] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { apiRateTrip } = require('@/lib/api') as typeof import('@/lib/api');

  async function submit() {
    if (score === 0) return;
    setSubmitting(true);
    try {
      await apiRateTrip(tripId, { requestId: crypto.randomUUID(), score, tip, comment: comment.trim() || undefined });
      onSubmitted();
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo enviar la calificación');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col p-6 pt-safe">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold">¿Cómo estuvo tu viaje?</h1>
        <p className="text-muted-foreground">Tu opinión ayuda a mejorar Yapido</p>
        <div className="flex gap-2 my-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setScore(n)}>
              <Star
                className={cn('h-10 w-10 transition', n <= score ? 'text-amber-500 fill-amber-500' : 'text-slate-300')}
              />
            </button>
          ))}
        </div>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Cuéntanos cómo te fue (opcional)"
          className="input max-w-md"
          maxLength={500}
        />
        <div className="mt-4 w-full max-w-md">
          <p className="text-sm text-muted-foreground mb-2">¿Quieres dejar propina?</p>
          <div className="grid grid-cols-4 gap-2">
            {[0, 2000, 5000, 10000].map((v) => (
              <button
                key={v}
                onClick={() => setTip(v)}
                className={cn(
                  'h-12 rounded-xl border text-sm font-semibold transition',
                  tip === v ? 'border-primary bg-primary/5' : 'border-border bg-card'
                )}
              >
                {v === 0 ? 'No' : formatCOP(v)}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Total cobrado: {formatCOP(fare + tip)}</p>
        {error && <p className="text-destructive text-sm mt-3">{error}</p>}
      </div>
      <Button fullWidth size="lg" onClick={submit} loading={submitting} disabled={score === 0}>
        Enviar
      </Button>
    </main>
  );
}

function CenteredMessage({ title, subtitle, action }: { title: string; subtitle: string; action: { label: string; onClick: () => void } }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-2 mb-6">{subtitle}</p>
        <Button fullWidth onClick={action.onClick}>{action.label}</Button>
      </div>
    </main>
  );
}
