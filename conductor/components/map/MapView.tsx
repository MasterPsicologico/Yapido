'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { LatLng } from '@/lib/contracts';
import { lerpLatLng } from '@/lib/geo';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

export interface MapViewProps {
  center: LatLng;
  zoom?: number;
  driverLoc?: LatLng | null;
  pickup?: LatLng;
  dropoff?: LatLng;
  routePolyline?: string;
  onMapClick?: (loc: LatLng) => void;
  className?: string;
  /** Estilo del mapa. Por defecto, calle light. */
  style?: string;
}

const DEFAULT_STYLE = 'mapbox://styles/mapbox/light-v11';

export function MapView({
  center,
  zoom = 14,
  driverLoc,
  pickup,
  dropoff,
  routePolyline,
  onMapClick,
  className,
  style = DEFAULT_STYLE,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);

  // Init map
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    });
    mapRef.current = map;

    map.on('load', () => setStyleLoaded(true));
    if (onMapClick) {
      map.on('click', (e) => onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
    }
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }), 'top-right');

    return () => {
      driverMarkerRef.current?.remove();
      pickupMarkerRef.current?.remove();
      dropoffMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center when changed externally
  useEffect(() => {
    if (!mapRef.current || !styleLoaded) return;
    mapRef.current.easeTo({ center: [center.lng, center.lat], zoom, duration: 600 });
  }, [center, zoom, styleLoaded]);

  // Driver marker con interpolación
  useEffect(() => {
    if (!mapRef.current || !styleLoaded) return;
    if (!driverLoc) {
      driverMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      return;
    }
    if (!driverMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-card text-primary-foreground text-lg font-bold';
      el.textContent = '🛵';
      driverMarkerRef.current = new mapboxgl.Marker(el).setLngLat([driverLoc.lng, driverLoc.lat]).addTo(mapRef.current);
    } else {
      // Interpolación suave entre la posición anterior y la nueva
      const current = driverMarkerRef.current.getLngLat();
      const target = { lat: driverLoc.lat, lng: driverLoc.lng };
      const start = { lat: current.lat, lng: current.lng };
      const duration = 1500;
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        const p = lerpLatLng(start, target, t);
        driverMarkerRef.current?.setLngLat([p.lng, p.lat]);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, [driverLoc, styleLoaded]);

  // Pickup marker
  useEffect(() => {
    if (!mapRef.current || !styleLoaded) return;
    pickupMarkerRef.current?.remove();
    if (pickup) {
      const el = document.createElement('div');
      el.className = 'w-7 h-7 rounded-full bg-blue-500 border-[3px] border-card shadow';
      pickupMarkerRef.current = new mapboxgl.Marker(el).setLngLat([pickup.lng, pickup.lat]).addTo(mapRef.current);
    }
  }, [pickup, styleLoaded]);

  // Dropoff marker
  useEffect(() => {
    if (!mapRef.current || !styleLoaded) return;
    dropoffMarkerRef.current?.remove();
    if (dropoff) {
      const el = document.createElement('div');
      el.className = 'w-7 h-7 rounded-full bg-foreground border-[3px] border-card shadow';
      dropoffMarkerRef.current = new mapboxgl.Marker(el).setLngLat([dropoff.lng, dropoff.lat]).addTo(mapRef.current);
    }
  }, [dropoff, styleLoaded]);

  // Route line
  useEffect(() => {
    if (!mapRef.current || !styleLoaded) return;
    const map = mapRef.current;
    const src = map.getSource('route') as mapboxgl.GeoJSONSource | undefined;
    if (routePolyline) {
      // Decodificar polyline de Mapbox
      const decoded = decodePolyline(routePolyline);
      const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: decoded.map((p) => [p.lng, p.lat]) },
      };
      if (src) {
        src.setData(geojson);
      } else {
        map.addSource('route', { type: 'geojson', data: geojson });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#00b871', 'line-width': 5, 'line-opacity': 0.85 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
      }
    } else if (src) {
      map.removeLayer('route');
      map.removeSource('route');
    }
  }, [routePolyline, styleLoaded]);

  return <div ref={containerRef} className={className ?? 'h-full w-full'} />;
}

// Decodificador de polyline (algoritmo de Google, mismo que Mapbox).
function decodePolyline(str: string, precision = 5): LatLng[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: LatLng[] = [];
  const factor = Math.pow(10, precision);
  while (index < str.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    coordinates.push({ lat: lat / factor, lng: lng / factor });
  }
  return coordinates;
}

