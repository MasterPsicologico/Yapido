
"use client";

/**
 * useCityConfig — Cerebro Geográfico de Yapido
 * 
 * Hook central que provee el contexto de ciudad Y zona a toda la app.
 * Lee el cityId del perfil del usuario y carga:
 *   1. Configuración base de la ciudad (Firestore `cities/{cityId}`)
 *   2. Zonas operativas de esa ciudad (`cities/{cityId}/zones`)
 *   3. Pricing resuelto con cascada: Zona override > Ciudad base
 * 
 * Uso:
 *   const { cityConfig, activeZones, resolvedPricing } = useCityConfig({
 *     overrideCityId: 'medellin',
 *     overrideZoneId: 'aranjuez',
 *   });
 */

import { useMemo } from 'react';
import { doc, collection, query, where } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import {
  CityConfig,
  ZoneConfig,
  PricingFields,
  DEFAULT_CITY_ID,
  getFallbackCityConfig,
  resolveZonePricing,
} from '@/lib/city-config';

interface UseCityConfigOptions {
  /** Override del cityId (ej. desde un formulario) */
  overrideCityId?: string | null;
  /** Override del zoneId (ej. desde un selector de zona) */
  overrideZoneId?: string | null;
  /** Profile del usuario (contiene cityId) */
  profile?: any;
}

interface UseCityConfigResult {
  cityConfig: CityConfig;
  cityId: string;
  cityName: string;
  isLoading: boolean;
  /** Todas las ciudades activas (para selects) */
  activeCities: CityConfig[];
  activeCitiesLoading: boolean;
  /** Zonas activas de la ciudad seleccionada */
  activeZones: ZoneConfig[];
  activeZonesLoading: boolean;
  /** Zona seleccionada (si aplica) */
  selectedZone: ZoneConfig | null;
  /** Pricing resuelto con cascada zona > ciudad */
  resolvedPricing: PricingFields;
  /** Si la ciudad tiene múltiples zonas (mostrar selector) */
  hasMultipleZones: boolean;
}

export function useCityConfig(options: UseCityConfigOptions = {}): UseCityConfigResult {
  const { overrideCityId, overrideZoneId, profile } = options;
  const firestore = useFirestore();

  // RESOLUCIÓN DE CIUDAD: override > perfil > default
  const resolvedCityId = overrideCityId || profile?.cityId || DEFAULT_CITY_ID;

  // Documento de la ciudad activa
  const cityDocRef = useMemoFirebase(
    () => doc(firestore, 'cities', resolvedCityId),
    [firestore, resolvedCityId]
  );
  const { data: cityDoc, isLoading: cityLoading } = useDoc(cityDocRef);

  // Query de TODAS las ciudades activas (para dropdowns)
  const activeCitiesQuery = useMemoFirebase(
    () => query(collection(firestore, 'cities'), where('active', '==', true)),
    [firestore]
  );
  const { data: activeCitiesRaw, isLoading: activeCitiesLoading } = useCollection(activeCitiesQuery);

  // Query de ZONAS activas de la ciudad seleccionada
  const zonesQuery = useMemoFirebase(
    () => query(
      collection(firestore, 'cities', resolvedCityId, 'zones'),
      where('active', '==', true)
    ),
    [firestore, resolvedCityId]
  );
  const { data: zonesRaw, isLoading: zonesLoading } = useCollection(zonesQuery);

  // Merge: datos de Firestore + fallback estático
  const cityConfig: CityConfig = useMemo(() => {
    const fallback = getFallbackCityConfig(resolvedCityId);
    if (!cityDoc) return fallback;
    return {
      ...fallback,
      ...cityDoc,
      id: resolvedCityId,
      // Asegurar que los números sean números
      minHours: Number(cityDoc.minHours ?? fallback.minHours),
      rateAuto: Number(cityDoc.rateAuto ?? fallback.rateAuto),
      rateSemi: Number(cityDoc.rateSemi ?? fallback.rateSemi),
      floorFee: Number(cityDoc.floorFee ?? fallback.floorFee),
      stairsFee: Number(cityDoc.stairsFee ?? fallback.stairsFee),
      mapZoom: Number(cityDoc.mapZoom ?? fallback.mapZoom),
    };
  }, [cityDoc, resolvedCityId]);

  // Lista de ciudades activas (para el selector)
  const activeCities: CityConfig[] = useMemo(() => {
    if (!activeCitiesRaw?.length) {
      return getFallbackCityConfig(DEFAULT_CITY_ID) ? [getFallbackCityConfig(DEFAULT_CITY_ID)] : [];
    }
    return activeCitiesRaw.map((c: any) => ({
      id: c.id,
      name: c.name || c.id,
      department: c.department || '',
      country: c.country || 'Colombia',
      minHours: Number(c.minHours || 5),
      rateAuto: Number(c.rateAuto || 3500),
      rateSemi: Number(c.rateSemi || 3000),
      floorFee: Number(c.floorFee || 2000),
      stairsFee: Number(c.stairsFee || 5000),
      mapCenter: c.mapCenter || { lat: 0, lng: 0 },
      mapZoom: Number(c.mapZoom || 13),
      timezone: c.timezone || 'America/Bogota',
      active: c.active !== false,
    }));
  }, [activeCitiesRaw]);

  // Lista de zonas activas de la ciudad
  const activeZones: ZoneConfig[] = useMemo(() => {
    if (!zonesRaw?.length) return [];
    return zonesRaw.map((z: any) => ({
      id: z.id,
      name: z.name || z.id,
      active: z.active !== false,
      description: z.description || '',
      rateAuto: z.rateAuto != null ? Number(z.rateAuto) : undefined,
      rateSemi: z.rateSemi != null ? Number(z.rateSemi) : undefined,
      minHours: z.minHours != null ? Number(z.minHours) : undefined,
      floorFee: z.floorFee != null ? Number(z.floorFee) : undefined,
      stairsFee: z.stairsFee != null ? Number(z.stairsFee) : undefined,
    }));
  }, [zonesRaw]);

  // Zona seleccionada
  const selectedZone: ZoneConfig | null = useMemo(() => {
    if (!overrideZoneId || !activeZones.length) return null;
    return activeZones.find(z => z.id === overrideZoneId) || null;
  }, [overrideZoneId, activeZones]);

  // Pricing resuelto con cascada zona > ciudad
  const resolvedPricing = useMemo(
    () => resolveZonePricing(cityConfig, selectedZone),
    [cityConfig, selectedZone]
  );

  return {
    cityConfig,
    cityId: resolvedCityId,
    cityName: cityConfig.name,
    isLoading: cityLoading,
    activeCities,
    activeCitiesLoading,
    activeZones,
    activeZonesLoading: zonesLoading,
    selectedZone,
    resolvedPricing,
    hasMultipleZones: activeZones.length > 1,
  };
}
