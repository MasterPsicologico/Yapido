'use client';

import { useEffect, useState } from 'react';
import { MapPin, Search, History, User2, ChevronRight } from 'lucide-react';
import { MapView } from '@/components/map/MapView';
import { Button } from '@/components/shared/Button';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/store/userStore';
import { useOnline } from '@/hooks/useOnline';
import type { LatLng } from '@/lib/contracts';
import { encodeGeohash } from '@/lib/geo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const DEFAULT_CENTER: LatLng = { lat: 8.3127, lng: -73.6218 }; // Aguachica centro

export default function PassengerHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const setUser = useUserStore((s) => s.setUser);
  const { online } = useOnline();
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [pickupAddress, setPickupAddress] = useState<string>('Usar mi ubicación actual');
  const [searchFocused, setSearchFocused] = useState(false);

  // Geolocalización del pasajero
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setPickup({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {/* silenciar */},
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const center = pickup ?? DEFAULT_CENTER;

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Mapa full screen */}
      <div className="absolute inset-0">
        <MapView
          center={center}
          zoom={15}
          pickup={pickup ?? undefined}
        />
      </div>

      {/* Top bar */}
      <header className="absolute top-0 left-0 right-0 p-4 pt-safe z-10">
        <div className="flex items-center justify-between">
          <div className="card !p-2 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {user?.displayName?.[0]?.toUpperCase() ?? 'Y'}
            </div>
            <span className="text-sm font-medium pr-1">Hola, {user?.displayName?.split(' ')[0] ?? 'viajero'}</span>
          </div>
          <div className="flex gap-2">
            <Link href="/(passenger)/history" className="card !p-3">
              <History className="h-5 w-5" />
            </Link>
            <Link href="/(passenger)/profile" className="card !p-3">
              <User2 className="h-5 w-5" />
            </Link>
          </div>
        </div>
        {!online && (
          <div className="mt-3 card !bg-amber-50 !border-amber-200 !text-amber-800 text-sm">
            Sin conexión. Los cambios se guardarán y enviarán al volver la red.
          </div>
        )}
      </header>

      {/* Bottom sheet de búsqueda */}
      <section className="absolute bottom-0 left-0 right-0 z-10 pb-safe">
        <div className="card !rounded-b-none !rounded-t-3xl !border-b-0 shadow-xl">
          <div className="mx-auto -mt-1 mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
          <h2 className="text-lg font-semibold mb-3">¿A dónde vas?</h2>

          <Link
            href={{
              pathname: '/(passenger)/home/search',
              query: { pickup: pickup ? `${pickup.lat},${pickup.lng}` : '', pickupAddress },
            }}
            className="flex items-center gap-3 h-14 px-4 rounded-xl bg-secondary border border-border"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Buscar destino…</span>
            <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
          </Link>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/(passenger)/home?setHome=1" className="card !p-3 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              Mi casa
            </Link>
            <Link href="/(passenger)/home?setWork=1" className="card !p-3 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              Mi trabajo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

