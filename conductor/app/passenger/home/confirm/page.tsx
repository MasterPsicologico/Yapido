'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Bike, Car, Crown, MapPin, CreditCard, Banknote, Check } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { MapView } from '@/components/map/MapView';
import { formatCOP, formatDistance, formatDuration } from '@/lib/geo';
import { apiFareEstimate, apiCreateTrip } from '@/lib/api';
import { uuid } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { LatLng, VehicleType, PaymentMethod } from '@/lib/contracts';

const VEHICLES: Array<{ id: VehicleType; label: string; eta: string; icon: any; tone: string }> = [
  { id: 'moto',         label: 'Moto',         eta: '2-5 min',  icon: Bike,  tone: 'text-orange-500' },
  { id: 'auto',         label: 'Auto',         eta: '4-7 min',  icon: Car,   tone: 'text-blue-500' },
  { id: 'auto_comfort', label: 'Auto Comfort', eta: '5-8 min',  icon: Crown, tone: 'text-violet-500' },
];

const PAYMENTS: Array<{ id: PaymentMethod; label: string; icon: any }> = [
  { id: 'cash',  label: 'Efectivo',  icon: Banknote },
  { id: 'wompi', label: 'Tarjeta',   icon: CreditCard },
  { id: 'pse',   label: 'PSE',       icon: CreditCard },
];

export default function ConfirmTripPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [type, setType] = useState<VehicleType>((search.get('type') as VehicleType) ?? 'moto');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickup: LatLng | null = useMemo(() => parseLatLng(search.get('pickup')), [search]);
  const dropoff: LatLng | null = useMemo(() => parseLatLng(search.get('dropoff')), [search]);
  const pickupAddress = search.get('pickupAddress') ?? '';
  const dropoffAddress = search.get('dropoffAddress') ?? '';
  const dropoffName = search.get('dropoffName') ?? '';

  const [estimate, setEstimate] = useState<{ fare: number; distanceMeters: number; durationSeconds: number } | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  // Re-estimar al cambiar tipo de vehículo
  useMemo(() => {
    if (!pickup || !dropoff) return;
    setLoadingEstimate(true);
    apiFareEstimate({ type, pickup, dropoff, cityId: 'aguachica' })
      .then((res) =>
        setEstimate({ fare: res.fare.total, distanceMeters: res.distanceMeters, durationSeconds: res.durationSeconds })
      )
      .catch(() => setEstimate(null))
      .finally(() => setLoadingEstimate(false));
  }, [type, pickup, dropoff]);

  async function handleConfirm() {
    if (!pickup || !dropoff) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiCreateTrip({
        requestId: uuid(),
        type,
        pickup: { ...pickup, address: pickupAddress },
        dropoff: { ...dropoff, address: dropoffAddress },
        paymentMethod: payment,
        notes: notes.trim() || undefined,
      });
      router.push(`/passenger/trip/${res.tripId}`);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo crear el viaje');
    } finally {
      setLoading(false);
    }
  }

  if (!pickup || !dropoff) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Faltan datos del viaje</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="p-4 pt-safe flex items-center gap-3 border-b border-border">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold">Confirma tu viaje</h1>
      </header>

      <div className="h-56">
        <MapView center={pickup} zoom={13} pickup={pickup} dropoff={dropoff} />
      </div>

      <div className="flex-1 p-4 space-y-4">
        <div className="card space-y-3">
          <Row icon={<MapPin className="h-5 w-5 text-primary" />} title={dropoffName || 'Destino'} subtitle={dropoffAddress} />
          <hr className="border-border" />
          <Row icon={<MapPin className="h-5 w-5 text-muted-foreground" />} title="Origen" subtitle={pickupAddress} />
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Tipo de vehículo</p>
          <div className="grid grid-cols-3 gap-2">
            {VEHICLES.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => setType(v.id)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition',
                    type === v.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-secondary/50'
                  )}
                >
                  <Icon className={cn('h-6 w-6', v.tone)} />
                  <p className="text-sm font-semibold mt-1">{v.label}</p>
                  <p className="text-xs text-muted-foreground">{v.eta}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Método de pago</p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENTS.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setPayment(p.id)}
                  className={cn(
                    'p-3 rounded-xl border text-sm font-medium transition flex items-center justify-center gap-2',
                    payment === p.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-secondary/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Notas para el conductor (opcional)</p>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: llegar por la entrada principal"
            className="input"
            maxLength={280}
          />
        </div>

        {estimate && (
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total estimado</p>
              <p className="text-2xl font-bold text-primary">
                {loadingEstimate ? '…' : formatCOP(estimate.fare)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistance(estimate.distanceMeters)} · {formatDuration(estimate.durationSeconds)}
              </p>
            </div>
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>

      <div className="p-4 pb-safe border-t border-border bg-card">
        <Button fullWidth size="lg" onClick={handleConfirm} loading={loading}>
          <Check className="h-5 w-5" /> Pedir viaje
        </Button>
      </div>
    </main>
  );
}

function Row({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
    </div>
  );
}

function parseLatLng(s: string | null): LatLng | null {
  if (!s) return null;
  const [lat, lng] = s.split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

