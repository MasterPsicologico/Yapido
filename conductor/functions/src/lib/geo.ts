/**
 * Utilidades de geografía del lado servidor.
 * Usa ngeohash (Node 20).
 */

import ngeohash from 'ngeohash';
import type { LatLng } from '../types.js';

const EARTH_R_KM = 6371;
const toRad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R_KM * Math.asin(Math.sqrt(h));
}

export function encodeGeohash(loc: LatLng, precision = 6): string {
  return ngeohash.encode(loc.lat, loc.lng, precision);
}

export function geohashNeighbors(hash: string): string[] {
  return ngeohash.neighbors(hash);
}

export function geohash9(loc: LatLng, precision = 6): string[] {
  const center = encodeGeohash(loc, precision);
  return [center, ...geohashNeighbors(center)];
}

export function bearing(from: LatLng, to: LatLng): number {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const λ1 = toRad(from.lng);
  const λ2 = toRad(to.lng);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
