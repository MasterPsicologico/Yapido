/**
 * Utilidades geográficas.
 * - geohash (precisión 1..9)
 * - haversine (distancia km)
 * - bbox (bounding box)
 * - isPointInPolygon (ray casting)
 */

import ngeohash from 'ngeohash';
import type { LatLng } from '@/lib/contracts';

// ---------- Geohash ----------
export function encodeGeohash(loc: LatLng, precision: number = 6): string {
  return ngeohash.encode(loc.lat, loc.lng, precision);
}

export function decodeGeohash(hash: string): LatLng {
  const decoded = ngeohash.decode(hash);
  return { lat: decoded.latitude, lng: decoded.longitude };
}

export function geohashNeighbors(hash: string): string[] {
  return ngeohash.neighbors(hash);
}

// Devuelve las 9 celdas (centro + 8 vecinos) usadas en matching.
export function geohash9(loc: LatLng, precision = 6): string[] {
  const center = encodeGeohash(loc, precision);
  return [center, ...geohashNeighbors(center)];
}

// ---------- Distancias ----------
const EARTH_R_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Distancia haversine en km. */
export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R_KM * Math.asin(Math.sqrt(h));
}

/** Distancia en metros. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  return haversine(a, b) * 1000;
}

// ---------- Bounding box ----------
export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Genera un bbox alrededor de un punto con radio en km. */
export function bboxAround(center: LatLng, radiusKm: number): BBox {
  const dLat = radiusKm / 111; // ~111 km por grado
  const dLng = radiusKm / (111 * Math.cos(toRad(center.lat)));
  return {
    south: center.lat - dLat,
    north: center.lat + dLat,
    west: center.lng - dLng,
    east: center.lng + dLng,
  };
}

/** ¿Está lat/lng dentro del bbox? */
export function isInBBox(p: LatLng, b: BBox): boolean {
  return p.lat >= b.south && p.lat <= b.north && p.lng >= b.west && p.lng <= b.east;
}

// ---------- Punto en polígono (ray casting) ----------
export function isPointInPolygon(p: LatLng, polygon: number[][][]): boolean {
  if (!polygon || polygon.length === 0) return false;
  const ring = polygon[0]!;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    const intersect =
      yi > p.lat !== yj > p.lat &&
      p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ---------- Bearing / heading ----------
export function bearing(from: LatLng, to: LatLng): number {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const λ1 = toRad(from.lng);
  const λ2 = toRad(to.lng);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

// ---------- Interpolación (animación de marker) ----------
export function lerpLatLng(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

// ---------- Formateo amigable ----------
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const min = Math.floor(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h} h ${m} min`;
}

export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

