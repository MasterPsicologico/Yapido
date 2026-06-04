/**
 * Algoritmo de matching + ranking de conductores.
 */

import type { LatLng, VehicleType, City } from '../types.js';
import { geohash9, haversineKm } from './geo.js';

export interface DriverCandidate {
  id: string;
  loc: LatLng;
  ratingAvg: number;
  acceptRate30d: number;
  vehicleType: VehicleType;
  idleMinutes: number;
}

export interface RankedDriver extends DriverCandidate {
  distance: number;
  score: number;
}

export function rankDrivers(
  candidates: DriverCandidate[],
  pickup: LatLng,
  type: VehicleType,
  city: City
): RankedDriver[] {
  const isSmallCity = (city.population ?? 200_000) < 200_000;
  const maxKm = isSmallCity ? 8 : 5;
  const distWeight = isSmallCity ? 0.65 : 0.50;
  const idleThreshold = isSmallCity ? 3 : 5;
  const idleBonus = 0.15;

  return candidates
    .filter((d) => d.vehicleType === type)
    .map<RankedDriver>((d) => {
      const distance = haversineKm(d.loc, pickup);
      const distScore = Math.max(0, 1 - distance / maxKm);
      const ratingScore = Math.max(0, (d.ratingAvg - 4) / 1);
      const acceptScore = d.acceptRate30d;
      const bonus = d.idleMinutes > idleThreshold ? idleBonus : 0;
      const score = distWeight * distScore + 0.20 * ratingScore + 0.10 * acceptScore + bonus;
      return { ...d, distance, score };
    })
    .filter((d) => d.distance < maxKm && d.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function getOfferTimeoutMs(city: City): number {
  const isSmall = (city.population ?? 200_000) < 200_000;
  return isSmall ? 12_000 : 8_000;
}
