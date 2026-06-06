/**
 * Geocoding con Mapbox — Search Box API v1 (forward/autocomplete) + Geocoding v5 (reverse).
 *
 * Forward (búsqueda en vivo con autocomplete): Search Box API v1.
 *   - Devuelve `features[]` con metadatos estructurados en `properties`.
 *   - session_token agrupa calls del mismo flujo (autocomplete económico).
 *
 * Reverse (tap-en-mapa): Geocoding v5 reverse.
 *   - Estable, soporta Colombia/Aguachica bien.
 *   - Solo acepta un `type` o ninguno, no lista con `limit`.
 *
 * Docs:
 *  - https://docs.mapbox.com/api/search/search-box/
 *  - https://docs.mapbox.com/api/search/geocoding-v5/
 */

import type { LatLng } from '@/lib/contracts';

const SEARCH_BOX_URL = 'https://api.mapbox.com/search/searchbox/v1';
const GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

export interface PlaceSuggestion {
  id: string;
  name: string;          // p.ej. "Parque Principal"
  address: string;       // dirección completa para mostrar
  shortAddress?: string; // solo la calle (sin ciudad/país) si está disponible
  fullAddress?: string;
  featureType?: string;  // poi | address | place | neighborhood
  loc: LatLng;
  distanceMeters?: number;
}

/** Estructura REAL de un feature en Search Box v1. */
interface SearchBoxProperties {
  mapbox_id?: string;
  name?: string;
  name_preferred?: string;
  feature_type?: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
  poi_category?: string[];
  coordinates?: { latitude: number; longitude: number };
  distance?: number;
}

interface SearchBoxFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: SearchBoxProperties;
}

interface SearchBoxResponse {
  suggestions?: SearchBoxFeature[];
  features?: SearchBoxFeature[];
  attribution?: string;
}

interface GeocodingFeature {
  id: string;
  type: 'Feature';
  text: string;
  place_name: string;
  geometry: { type: 'Point'; coordinates: [number, number] };
}

interface GeocodingResponse {
  features: GeocodingFeature[];
}

function token(): string {
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
}

function sessionToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Cache 30s ────────────────────────────────────────────
const cache = new Map<string, { value: PlaceSuggestion[]; ts: number }>();
const CACHE_TTL = 30_000;
function cacheGet(k: string): PlaceSuggestion[] | null {
  const hit = cache.get(k);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL) { cache.delete(k); return null; }
  return hit.value;
}
function cacheSet(k: string, v: PlaceSuggestion[]) { cache.set(k, { value: v, ts: Date.now() }); }

/**
 * Forward geocoding / autocomplete.
 */
export async function geocodeForward(
  query: string,
  opts: {
    proximity?: LatLng;
    countryCodes?: string[];
    limit?: number;
    types?: string[];
    useSessionToken?: boolean;
    signal?: AbortSignal;
  } = {}
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const cacheKey = JSON.stringify({ q, ...opts });
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    q,
    access_token: token(),
    language: 'es',
    limit: String(opts.limit ?? 8),
  });
  if (opts.countryCodes?.length) params.set('country', opts.countryCodes.join(','));
  if (opts.types?.length) params.set('types', opts.types.join(','));
  if (opts.proximity) params.set('proximity', `${opts.proximity.lng},${opts.proximity.lat}`);
  if (opts.useSessionToken) params.set('session_token', sessionToken());

  const url = `${SEARCH_BOX_URL}/forward?${params.toString()}`;

  try {
    const res = await fetch(url, { signal: opts.signal });
    if (!res.ok) {
      console.warn('geocodeForward HTTP', res.status, await res.text().catch(() => ''));
      return [];
    }
    const data: SearchBoxResponse = await res.json();
    const list = data.features ?? data.suggestions ?? [];
    const mapped = list.map(mapSearchBoxFeature).filter(Boolean) as PlaceSuggestion[];
    cacheSet(cacheKey, mapped);
    return mapped;
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') return [];
    console.warn('geocodeForward error', e);
    return [];
  }
}

/**
 * Retrieve: cuando el usuario selecciona una suggestion, recuperamos la
 * geometría exacta y dirección completa. Si la geometría ya viene en la
 * suggestion (caso común con v1), este paso es opcional.
 */
export async function geocodeRetrieve(
  suggestionId: string,
  sessionTkn: string,
  signal?: AbortSignal
): Promise<PlaceSuggestion | null> {
  const url = `${SEARCH_BOX_URL}/retrieve/${encodeURIComponent(suggestionId)}?access_token=${token()}&session_token=${sessionTkn}`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Retrieve HTTP ${res.status}`);
    const data: { features?: SearchBoxFeature[] } = await res.json();
    const f = data.features?.[0];
    if (!f) return null;
    return mapSearchBoxFeature(f);
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') return null;
    console.warn('geocodeRetrieve error', e);
    return null;
  }
}

/**
 * Reverse geocoding: lat/lng → dirección (un solo resultado).
 * v5 no acepta `types` múltiples + `limit`, así que solo limit=1.
 */
export async function geocodeReverse(loc: LatLng, signal?: AbortSignal): Promise<PlaceSuggestion | null> {
  const { lng, lat } = loc;
  const url = `${GEOCODING_URL}/${lng},${lat}.json?access_token=${token()}&language=es&limit=1`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) {
      console.warn('geocodeReverse HTTP', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data: GeocodingResponse = await res.json();
    const f = data.features?.[0];
    if (!f) return null;
    const [flng, flat] = f.geometry.coordinates;
    return {
      id: f.id,
      name: f.text,
      address: f.place_name,
      fullAddress: f.place_name,
      featureType: f.id.split('.')[0],
      loc: { lat: flat, lng: flng },
    };
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') return null;
    console.warn('geocodeReverse error', e);
    return null;
  }
}

/** Mapea un feature del Search Box v1 a nuestra PlaceSuggestion. */
function mapSearchBoxFeature(f: SearchBoxFeature): PlaceSuggestion | null {
  const coords = f.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lng, lat] = coords;
  const p = f.properties || {};
  const id = p.mapbox_id;
  if (!id) return null;
  const name = p.name_preferred || p.name || p.place_formatted || p.full_address || 'Sin nombre';
  return {
    id,
    name,
    address: p.full_address || p.place_formatted || p.address || '',
    shortAddress: p.address,
    fullAddress: p.full_address,
    featureType: p.feature_type,
    loc: { lat, lng },
    distanceMeters: p.distance,
  };
}
