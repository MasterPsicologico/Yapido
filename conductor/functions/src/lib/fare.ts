/**
 * Cálculo de tarifa a partir de pricing regional + distancia/duración.
 */

import type { City, CityPricing, LatLng, VehicleType } from '../types.js';
import { haversineKm } from './geo.js';

export interface FareBreakdown {
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
  currency: 'COP';
}

export function computeFare(opts: {
  city: City;
  type: VehicleType;
  distanceMeters: number;
  durationSeconds: number;
  waitSeconds?: number;
  surge?: number;
  tolls?: number;
  tip?: number;
}): FareBreakdown {
  const pricing: CityPricing | undefined = opts.city.pricing[opts.type];
  if (!pricing) {
    throw new Error(`Pricing not configured for type ${opts.type} in city ${opts.city.cityId}`);
  }
  const km = opts.distanceMeters / 1000;
  const min = opts.durationSeconds / 60;
  const wait = ((opts.waitSeconds ?? 0) / 60) * (pricing.waitingFeePerMin ?? 0);

  const distanceFare = km * pricing.perKm;
  const timeFare = min * pricing.perMin;
  let total = pricing.base + distanceFare + timeFare + wait + (opts.tolls ?? 0);

  const surge = Math.max(1, Math.min(opts.city.pricing.surge.max, opts.surge ?? 1));
  if (opts.city.pricing.surge.enabled && surge > 1) {
    total = total * surge;
  }

  total = Math.max(total, pricing.minFare);
  total = Math.round(total / 100) * 100; // redondear a 100 COP

  const platformFee = Math.round(total * pricing.commissionPct);
  const driverEarning = total - platformFee;

  return {
    currency: 'COP',
    base: pricing.base,
    distance: Math.round(distanceFare),
    time: Math.round(timeFare),
    surge,
    tolls: opts.tolls ?? 0,
    wait: Math.round(wait),
    total,
    driverEarning,
    platformFee,
    tip: opts.tip ?? 0,
  };
}

/** Distancia simulada (haversine) — para v1 antes de integrar Mapbox Directions server-side. */
export function estimateDistanceDuration(pickup: LatLng, dropoff: LatLng): { meters: number; seconds: number } {
  const km = haversineKm(pickup, dropoff);
  // Velocidad promedio urbana en ciudad pequeña: 25 km/h
  const avgSpeedKmh = 25;
  const seconds = (km / avgSpeedKmh) * 3600;
  return { meters: km * 1000, seconds };
}
