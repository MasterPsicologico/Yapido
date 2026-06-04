'use client';

import { useEffect, useState } from 'react';
import { LogIn, Power, Wallet, History, User2, Bike, Car, Crown, Bell } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDriverStore } from '@/store/driverStore';
import { useDriverGPS } from '@/hooks/useDriverGPS';
import { apiSetOnline, apiAcceptOffer } from '@/lib/api';
import { subscribeDriverOffer, clearDriverOffer } from '@/lib/realtime';
import { MapView } from '@/components/map/MapView';
import { Button } from '@/components/shared/Button';
import { Rating } from '@/components/shared/Rating';
import { formatCOP } from '@/lib/geo';
import { uuid } from '@/lib/utils';
import type { DriverProfile, LatLng, VehicleType } from '@/lib/contracts';
import { cn } from '@/lib/utils';

const VEHICLE_OPTIONS: Array<{ id: VehicleType; label: string; icon: any }> = [
  { id: 'moto',         label: 'Moto',  icon: Bike },
  { id: 'auto',         label: 'Auto',  icon: Car  },
  { id: 'auto_comfort', label: 'Comfort', icon: Crown },
];

export default function DriverHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const cityId = useDriverStore((s) => s.cityId);
  const setCity = useDriverStore((s) => s.setCity);
  const vehicleType = useDriverStore((s) => s.vehicleType);
  const setVehicleType = useDriverStore((s) => s.setVehicleType);
  const online = useDriverStore((s) => s.online);
  const setOnline = useDriverStore((s) => s.setOnline);
  const currentLocation = useDriverStore((s) => s.currentLocation);
  const setLocation = useDriverStore((s) => s.setLocation);
  const setOffer = useDriverStore((s) => s.setOffer);
  const setTrip = useDriverStore((s) => s.setTrip);

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [earningsToday, setEarningsToday] = useState(0);
  const [center, setCenter] = useState<LatLng>({ lat: 8.3127, lng: -73.6218 });

  // Cargar perfil del conductor
  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(firebaseDb(), 'driver_profiles', user.uid));
      if (snap.exists()) {
        const p = snap.data() as DriverProfile;
        setProfile(p);
        if (p.currentCityId) setCity(p.currentCityId);
        if (p.currentLocation) {
          setLocation(p.currentLocation);
          setCenter(p.currentLocation);
        }
      }
    })();
  }, [user]); // eslint-disable-line

  // GPS solo si está online
  useDriverGPS({ driverId: user?.uid ?? null, active: online });

  // Suscribirse a ofertas RTDB
  useEffect(() => {
    if (!user || !online) return;
    const unsub = subscribeDriverOffer(user.uid, (offer) => {
      if (offer) setOffer({ tripId: offer.tripId, fareEstimate: (offer as any).fareEstimate ?? 0, expiresAt: offer.expiresAt });
      else setOffer(null);
    });
    return () => unsub();
  }, [user, online]); // eslint-disable-line

  // Watch geo del navegador
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(loc);
        if (online) setLocation(loc);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 10_000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [online]); // eslint-disable-line

  async function toggleOnline() {
    if (!user) return;
    if (!currentLocation && !online) {
      alert('Espera un momento, estamos ubicándote…');
      return;
    }
    const next = !online;
    try {
      await apiSetOnline({
        requestId: uuid(),
        online: next,
        cityId,
        loc: currentLocation ?? center,
      });
      setOnline(next);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo cambiar el estado');
    }
  }

  async function handleAccept() {
    if (!user) return;
    const offer = useDriverStore.getState().pendingOffer;
    if (!offer) return;
    try {
      await apiAcceptOffer(offer.tripId, { requestId: uuid(), offerId: uuid() });
      await clearDriverOffer(user.uid);
      setTrip(offer.tripId);
      router.push(`/(driver)/trip/${offer.tripId}`);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo aceptar la oferta');
    }
  }

  async function handleReject() {
    if (!user) return;
    await clearDriverOffer(user.uid);
    setOffer(null);
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Bike className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Conviértete en conductor</h1>
          <p className="text-muted-foreground mb-6">Empieza a ganar con tu moto o auto.</p>
          <Link href="/(driver)/onboarding" className="btn-primary w-full">
            <LogIn className="h-5 w-5" /> Registrarme como conductor
          </Link>
        </div>
      </main>
    );
  }

  if (profile.status !== 'approved') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-2">Tu cuenta está en revisión</h1>
          <p className="text-muted-foreground">Te avisaremos cuando tus documentos sean aprobados (24-48h).</p>
        </div>
      </main>
    );
  }

  const offer = useDriverStore((s) => s.pendingOffer);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0">
        <MapView center={center} zoom={15} />
      </div>

      {/* Top bar */}
      <header className="absolute top-0 left-0 right-0 p-4 pt-safe z-10">
        <div className="flex items-center justify-between">
          <div className="card !p-3 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {profile.ratingAvg.toFixed(1)}
            </div>
            <Rating score={profile.ratingAvg} size="sm" />
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs font-medium">{profile.totalTrips} viajes</span>
          </div>
          <div className="flex gap-2">
            <Link href="/(driver)/earnings" className="card !p-3">
              <Wallet className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Bottom panel */}
      <section className="absolute bottom-0 left-0 right-0 z-10 pb-safe">
        <div className="card !rounded-b-none !rounded-t-3xl !border-b-0">
          <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-slate-300" />

          {/* Selector de vehículo */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {VEHICLE_OPTIONS.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => !online && setVehicleType(v.id)}
                  disabled={online}
                  className={cn(
                    'p-2 rounded-xl border text-xs font-semibold transition',
                    vehicleType === v.id ? 'border-primary bg-primary/5' : 'border-border bg-card',
                    online && 'opacity-50'
                  )}
                >
                  <Icon className="h-5 w-5 mx-auto" />
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* Toggle online */}
          <button
            onClick={toggleOnline}
            className={cn(
              'w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition',
              online
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-primary text-primary-foreground hover:brightness-110'
            )}
          >
            <Power className="h-5 w-5" />
            {online ? 'En línea — esperando viajes' : 'Conectarme para recibir viajes'}
          </button>

          {online && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Mantén la app abierta para recibir ofertas.
            </p>
          )}
        </div>
      </section>

      {/* Modal de oferta */}
      {offer && (
        <div className="absolute inset-0 z-30 bg-black/50 flex items-end" onClick={handleReject}>
          <div className="w-full bg-background rounded-t-3xl p-6 animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-slate-300" />
            <div className="text-center mb-4">
              <Bell className="h-10 w-10 text-primary mx-auto mb-2 animate-pulse" />
              <h2 className="text-xl font-bold">¡Nueva oferta!</h2>
              <p className="text-muted-foreground text-sm">Tienes 12 segundos para responder</p>
            </div>
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Ganancia estimada</span>
                <span className="text-2xl font-bold text-primary">{formatCOP(offer.fareEstimate)}</span>
              </div>
            </div>
            <Countdown expiresAt={offer.expiresAt} />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Button variant="secondary" size="lg" onClick={handleReject}>Rechazar</Button>
              <Button size="lg" onClick={handleAccept}>Aceptar</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
  useEffect(() => {
    const t = setInterval(() => setRemaining(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))), 250);
    return () => clearInterval(t);
  }, [expiresAt]);
  const pct = (remaining / 12) * 100;
  return (
    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
      <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

