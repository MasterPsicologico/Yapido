/**
 * Tipos compartidos en el servidor.
 * NO importar Zod directamente aquí para evitar bundle bloat en Cloud Functions v1.
 */

export type LatLng = { lat: number; lng: number };
export type VehicleType = 'moto' | 'auto' | 'auto_comfort';
export type TripStatus =
  | 'searching' | 'offered' | 'accepted' | 'arriving' | 'in_progress'
  | 'completed' | 'cancelled' | 'no_drivers' | 'rated';

export interface CityPricing {
  base: number;
  perKm: number;
  perMin: number;
  minFare: number;
  currency: 'COP';
  commissionPct: number;
  waitingFeePerMin: number;
}

export interface City {
  cityId: string;
  displayName: string;
  population?: number;
  pricing: {
    moto: CityPricing;
    auto: CityPricing;
    auto_comfort?: CityPricing;
    surge: { enabled: boolean; max: number };
  };
  serviceArea: { type: 'polygon'; coordinates: number[][][] };
  centerLat: number;
  centerLng: number;
}

export interface TripDoc {
  tripId: string;
  cityId: string;
  status: TripStatus;
  type: VehicleType;
  passenger: { uid: string; displayName: string; photoURL?: string | null; rating: number; phone?: string };
  driver?: { uid: string; displayName: string; photoURL?: string | null; rating: number; phone?: string; plate?: string; vehicleDesc?: string } | null;
  pickup: LatLng & { address: string; notes?: string };
  dropoff: LatLng & { address: string; notes?: string };
  routePolyline?: string;
  distanceMeters: number;
  durationSeconds: number;
  fare: {
    currency: 'COP';
    base: number;
    distance: number;
    time: number;
    surge: number;
    tolls: number;
    wait: number;
    total: number;
    driverEarning: number;
    platformFee: number;
    tip: number;
  };
  payment: { method: 'cash' | 'card' | 'wompi' | 'pse'; status: 'pending' | 'paid' | 'failed' | 'refunded'; transactionId: string | null; paidAt: any };
  timeline: {
    requestedAt: any; matchedAt: any; acceptedAt: any; arrivedAt: any;
    startedAt: any; completedAt: any; cancelledAt: any;
    cancelledBy: 'passenger' | 'driver' | 'system' | null;
    cancelReason: string | null; ratedAt: any | null;
  };
  offerLog: Array<{ driverId: string; offeredAt: any; expiredAt: any | null; reason?: string }>;
  createdAt: any;
}
