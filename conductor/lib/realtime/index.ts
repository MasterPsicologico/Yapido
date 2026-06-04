/**
 * Suscripciones en tiempo real a RTDB.
 * Encapsula los listeners y devuelve funciones de unsubscribe.
 */

import { ref, onValue, set, update, serverTimestamp, off, type Unsubscribe } from 'firebase/database';
import { firebaseRtdb } from '@/lib/firebase/client';
import { encodeGeohash } from '@/lib/geo';
import type { LatLng } from '@/lib/contracts';
import type { DriverOnlineStatus, VehicleType } from '@/lib/contracts';

const rtdb = firebaseRtdb();

// ---------- Driver online state ----------

export interface DriverOnlinePayload {
  status: DriverOnlineStatus;
  vehicleType: VehicleType;
  loc: { lat: number; lng: number; h?: number; s?: number; ts: number };
  geo6: string;
  driverId: string;
  updatedAt: number;
}

export function writeDriverOnline(
  cityId: string,
  driverId: string,
  data: Omit<DriverOnlinePayload, 'updatedAt' | 'driverId'>
): Promise<void> {
  return set(ref(rtdb, `cities/${cityId}/drivers_online/${driverId}`), {
    ...data,
    driverId,
    updatedAt: Date.now(),
  });
}

export function writeDriverLocation(
  cityId: string,
  driverId: string,
  loc: LatLng & { h?: number; s?: number }
): Promise<void> {
  const geo6 = encodeGeohash(loc, 6);
  return update(ref(rtdb, `cities/${cityId}/drivers_online/${driverId}`), {
    loc: { ...loc, ts: Date.now() },
    geo6,
    updatedAt: Date.now(),
  });
}

export function writeDriverOffline(cityId: string, driverId: string): Promise<void> {
  return set(ref(rtdb, `cities/${cityId}/drivers_online/${driverId}`), null);
}

// ---------- Trip live (pasajero escucha) ----------

export function subscribeTripLive(
  cityId: string,
  tripId: string,
  onChange: (data: { driverLoc?: any; status?: string; eta?: number; routePolyline?: string } | null) => void
): Unsubscribe {
  const tripRef = ref(rtdb, `cities/${cityId}/trips_live/${tripId}`);
  const listener = onValue(tripRef, (snap) => {
    onChange(snap.val());
  });
  return () => off(tripRef, 'value', listener);
}

export function writeTripDriverLocation(
  cityId: string,
  tripId: string,
  loc: LatLng & { h?: number; s?: number }
): Promise<void> {
  return update(ref(rtdb, `cities/${cityId}/trips_live/${tripId}/driverLoc`), {
    ...loc,
    ts: Date.now(),
  });
}

export function writeTripStatus(
  cityId: string,
  tripId: string,
  status: string,
  extras: Record<string, unknown> = {}
): Promise<void> {
  return update(ref(rtdb, `cities/${cityId}/trips_live/${tripId}`), {
    status,
    ...extras,
    lastUpdate: serverTimestamp(),
  });
}

// ---------- Ofertas activas para el conductor ----------

export function subscribeDriverOffer(
  driverId: string,
  onChange: (offer: { tripId: string; expiresAt: number; fareEstimate?: unknown; pickup?: LatLng; type?: VehicleType } | null) => void
): Unsubscribe {
  const ref_ = ref(rtdb, `drivers_offers/${driverId}/current`);
  const listener = onValue(ref_, (snap) => onChange(snap.val()));
  return () => off(ref_, 'value', listener);
}

export function clearDriverOffer(driverId: string): Promise<void> {
  return set(ref(rtdb, `drivers_offers/${driverId}/current`), null);
}

// ---------- Connection status ----------
export function subscribeConnection(onChange: (connected: boolean) => void): Unsubscribe {
  const conn = ref(rtdb, '.info/connected');
  const listener = onValue(conn, (snap) => onChange(!!snap.val()));
  return () => off(conn, 'value', listener);
}

