/**
 * CONFIGURACIÓN GEOGRÁFICA MULTI-CIUDAD — Yapido
 * 
 * Sistema jerárquico: Ciudad → Zonas → Pricing
 * 
 * Cada ciudad tiene su configuración base de pricing.
 * Dentro de cada ciudad, las zonas operativas (barrios/sectores)
 * pueden sobrescribir campos específicos de pricing.
 * 
 * Resolución: Zona override > Ciudad base > Fallback global
 */

/** Coordenadas geográficas */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Campos de pricing que pueden ser overrideados por zona */
export interface PricingFields {
  minHours: number;
  rateAuto: number;
  rateSemi: number;
  floorFee: number;
  stairsFee: number;
}

/** Configuración completa de una ciudad operativa */
export interface CityConfig extends PricingFields {
  id: string;
  name: string;
  department: string;
  country: string;

  // Mapa
  mapCenter: GeoPoint;
  mapZoom: number;

  // Operaciones
  timezone: string;
  active: boolean;

  // Metadata
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Zona operativa dentro de una ciudad.
 * Los campos de pricing son opcionales (Partial).
 * Solo los que se definen sobreescriben los de la ciudad.
 */
export interface ZoneConfig {
  id: string;
  name: string;
  active: boolean;

  /** Override parcial de pricing. Campos no definidos heredan de la ciudad */
  rateAuto?: number;
  rateSemi?: number;
  minHours?: number;
  floorFee?: number;
  stairsFee?: number;

  /** Descripción de la zona para el admin */
  description?: string;

  // Metadata
  createdAt?: any;
  updatedAt?: any;
}

/** Ciudad por defecto cuando el usuario no tiene una asignada */
export const DEFAULT_CITY_ID = 'aguachica';

/**
 * Lista estática de ciudades para el selector (dropdown).
 * Se usa como fallback si la consulta a Firestore falla.
 * Las ciudades activas se cargan dinámicamente de Firestore.
 */
export const SEED_CITIES: CityConfig[] = [
  {
    id: 'aguachica',
    name: 'Aguachica',
    department: 'Cesar',
    country: 'Colombia',
    minHours: 4,
    rateAuto: 3500,
    rateSemi: 3000,
    floorFee: 2000,
    stairsFee: 5000,
    mapCenter: { lat: 8.3087, lng: -73.6362 },
    mapZoom: 14,
    timezone: 'America/Bogota',
    active: true,
  },
  {
    id: 'medellin',
    name: 'Medellín',
    department: 'Antioquia',
    country: 'Colombia',
    minHours: 5,
    rateAuto: 4000,
    rateSemi: 3500,
    floorFee: 3000,
    stairsFee: 7000,
    mapCenter: { lat: 6.2442, lng: -75.5812 },
    mapZoom: 13,
    timezone: 'America/Bogota',
    active: true,
  },
];

/**
 * Obtiene la configuración fallback de una ciudad por su ID
 * desde la lista estática (sin red).
 */
export function getFallbackCityConfig(cityId: string): CityConfig {
  return SEED_CITIES.find(c => c.id === cityId) || SEED_CITIES[0];
}

/**
 * Formatea el nombre completo de la ciudad con departamento.
 * Ejemplo: "Aguachica, Cesar"
 */
export function formatCityFull(city: CityConfig): string {
  return `${city.name}, ${city.department}`;
}

/**
 * Resuelve el pricing efectivo aplicando la cascada: Zona > Ciudad.
 * Si la zona no define un campo, se hereda de la ciudad.
 */
export function resolveZonePricing(
  city: CityConfig,
  zone: ZoneConfig | null
): PricingFields {
  if (!zone) {
    return {
      minHours: city.minHours,
      rateAuto: city.rateAuto,
      rateSemi: city.rateSemi,
      floorFee: city.floorFee,
      stairsFee: city.stairsFee,
    };
  }

  return {
    minHours: zone.minHours ?? city.minHours,
    rateAuto: zone.rateAuto ?? city.rateAuto,
    rateSemi: zone.rateSemi ?? city.rateSemi,
    floorFee: zone.floorFee ?? city.floorFee,
    stairsFee: zone.stairsFee ?? city.stairsFee,
  };
}

/**
 * Genera un ID slug-safe a partir de un nombre.
 * Ejemplo: "El Poblado" → "el-poblado"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
