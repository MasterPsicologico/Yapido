'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { apiFareEstimate } from '@/lib/api';
import { formatCOP, formatDistance, formatDuration } from '@/lib/geo';
import type { LatLng } from '@/lib/contracts';
import { cn } from '@/lib/utils';
import { Bike, Car, Crown } from 'lucide-react';

const TYPE_META: Record<'moto' | 'auto' | 'auto_comfort', { label: string; icon: any; tone: string }> = {
  moto:        { label: 'Moto',         icon: Bike,   tone: 'text-orange-500' },
  auto:        { label: 'Auto',         icon: Car,    tone: 'text-blue-500' },
  auto_comfort:{ label: 'Auto Comfort', icon: Crown,  tone: 'text-violet-500' },
};

// Búsqueda simulada de lugares (en v2 conectar Mapbox Places API).
const FAKE_PLACES: Array<{ name: string; address: string; loc: LatLng }> = [
  { name: 'Parque Principal',  address: 'Cra 16 #5-50, Aguachica',  loc: { lat: 8.3127, lng: -73.6218 } },
  { name: 'Hospital Regional', address: 'Cll 5 #22-30, Aguachica',   loc: { lat: 8.3090, lng: -73.6240 } },
  { name: 'Plaza de Mercado',  address: 'Cra 14 #3-20, Aguachica',   loc: { lat: 8.3140, lng: -73.6190 } },
  { name: 'Terminal de Transportes', address: 'Cll 10 #20-15, Aguachica', loc: { lat: 8.3170, lng: -73.6260 } },
  { name: 'Centro Comercial Yapido',  address: 'Cra 17 #8-40, Aguachica',  loc: { lat: 8.3110, lng: -73.6200 } },
];

export default function SearchDestinationPage() {
  const router = useRouter();
  const search = useSearchParams();
  const pickupStr = search.get('pickup') ?? '';
  const pickupAddress = search.get('pickupAddress') ?? '';
  const pickup: LatLng | null = useMemo(() => {
    const [lat, lng] = pickupStr.split(',').map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  }, [pickupStr]);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<typeof FAKE_PLACES[0] | null>(null);
  const [vehicleType, setVehicleType] = useState<'moto' | 'auto' | 'auto_comfort'>('moto');
  const [estimate, setEstimate] = useState<{ fare: number; distanceMeters: number; durationSeconds: number; surge: number } | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return FAKE_PLACES;
    return FAKE_PLACES.filter((p) => (p.name + p.address).toLowerCase().includes(q));
  }, [query]);

  async function handleSelect(place: typeof FAKE_PLACES[0]) {
    setSelected(place);
    if (!pickup) return;
    setLoadingEstimate(true);
    try {
      const res = await apiFareEstimate({
        type: vehicleType,
        pickup,
        dropoff: place.loc,
        cityId: 'aguachica',
      });
      setEstimate({
        fare: res.fare.total,
        distanceMeters: res.distanceMeters,
        durationSeconds: res.durationSeconds,
        surge: res.surge,
      });
    } catch (e) {
      // El cliente puede seguir y mostrar fallback en UI
      console.error(e);
    } finally {
      setLoadingEstimate(false);
    }
  }

  function goConfirm() {
    if (!selected || !pickup) return;
    const params = new URLSearchParams({
      pickup: `${pickup.lat},${pickup.lng}`,
      pickupAddress,
      dropoff: `${selected.loc.lat},${selected.loc.lng}`,
      dropoffAddress: selected.address,
      dropoffName: selected.name,
      type: vehicleType,
    });
    router.push(`/passenger/home/confirm?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="p-4 pt-safe flex items-center gap-3 border-b border-border">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold">Elige tu destino</h1>
      </header>

      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿A dónde quieres ir?"
            className="input pl-10"
            autoFocus
          />
        </div>

        <div className="card !p-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Origen:</span>
            <span className="font-medium truncate">{pickupAddress || 'Tu ubicación actual'}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {(['moto', 'auto', 'auto_comfort'] as const).map((t) => {
            const meta = TYPE_META[t];
            const Icon = meta.icon;
            return (
              <button
                key={t}
                onClick={() => setVehicleType(t)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border text-sm font-semibold transition',
                  vehicleType === t
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-secondary'
                )}
              >
                <Icon className={cn('h-5 w-5', vehicleType === t ? 'text-primary-foreground' : meta.tone)} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="flex-1 overflow-auto divide-y divide-border">
        {filtered.map((p) => (
          <li key={p.name}>
            <button
              onClick={() => handleSelect(p)}
              className="w-full text-left p-4 hover:bg-secondary/50 flex items-start gap-3"
            >
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-sm text-muted-foreground truncate">{p.address}</p>
              </div>
              {selected?.name === p.name && estimate && (
                <div className="text-right">
                  <p className="font-semibold text-primary">{formatCOP(estimate.fare)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistance(estimate.distanceMeters)} · {formatDuration(estimate.durationSeconds)}
                  </p>
                </div>
              )}
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="p-6 text-center text-muted-foreground">No se encontraron lugares</li>
        )}
      </ul>

      {selected && (
        <div className="p-4 border-t border-border bg-card">
          <Button fullWidth size="lg" onClick={goConfirm} loading={loadingEstimate} disabled={!pickup}>
            Continuar
          </Button>
        </div>
      )}
    </main>
  );
}

