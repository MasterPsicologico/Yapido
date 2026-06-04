/**
 * Hook de geolocalización del conductor.
 * - Inicia un watchPosition cuando el conductor está online o en viaje.
 * - Throttle por distancia > GPS_MIN_DISTANCE_M o intervalo mínimo.
 * - Escribe a RTDB (no a Firestore — latencia < 100ms).
 * - Maneja permisos y fallback a background mode.
 */

'use client';

import { useEffect, useRef } from 'react';
import { Geolocation, type PermissionStatus } from '@capacitor/geolocation';
import { writeDriverLocation, writeDriverOffline } from '@/lib/realtime';
import { useDriverStore } from '@/store/driverStore';
import { haversineMeters } from '@/lib/geo';
import { TIMEOUTS } from '@/lib/contracts';
import type { LatLng } from '@/lib/contracts';

export function useDriverGPS(opts: { driverId: string | null; active: boolean; onError?: (e: string) => void }) {
  const cityId = useDriverStore((s) => s.cityId);
  const vehicleType = useDriverStore((s) => s.vehicleType);
  const setLocation = useDriverStore((s) => s.setLocation);
  const lastRef = useRef<{ loc: LatLng; ts: number } | null>(null);
  const watchIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!opts.active || !opts.driverId) return;

    let cancelled = false;

    (async () => {
      try {
        // 1. Verificar permiso
        let perm: PermissionStatus | null = null;
        try {
          perm = await Geolocation.checkPermissions();
        } catch {
          /* web fallback */
        }
        if (perm && perm.location === 'denied') {
          opts.onError?.('Permiso de ubicación denegado');
          return;
        }
          if (perm && perm.location === 'prompt') {
          perm = await Geolocation.requestPermissions();
          if (perm.location !== 'granted') {
            opts.onError?.('No se obtuvo permiso de ubicación');
            return;
          }
        }

        // 2. Watch
        if (cancelled) return;
        const id = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            distanceFilter: 0,    // nosotros hacemos el throttle
            interval: 3000,
          },
          async (pos) => {
            if (cancelled || !pos) return;
            const loc: LatLng = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            const h = pos.coords.heading ?? 0;
            const s = (pos.coords.speed ?? 0) * 3.6; // m/s -> km/h
            const now = Date.now();

            // Throttle: solo si distancia > 10m o tiempo > 5s
            if (lastRef.current) {
              const dist = haversineMeters(lastRef.current.loc, loc);
              if (dist < TIMEOUTS.GPS_MIN_DISTANCE_M && now - lastRef.current.ts < 5_000) {
                return;
              }
            }
            lastRef.current = { loc, ts: now };

            // Actualizar store local
            setLocation(loc);

            // Escribir a RTDB
            try {
              await writeDriverLocation(cityId, opts.driverId!, { ...loc, h, s });
            } catch (e) {
              // Silenciar errores de RTDB transitorios
              console.warn('[GPS] write failed', e);
            }
          },
          { maximumAge: 5_000, timeout: 10_000, enableHighAccuracy: true }
        );
        watchIdRef.current = id;
      } catch (e: any) {
        opts.onError?.(e?.message ?? 'Error iniciando GPS');
      }
    })();

    return () => {
      cancelled = true;
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current }).catch(() => {});
        watchIdRef.current = null;
      }
    };
  }, [opts.active, opts.driverId, cityId, vehicleType, setLocation, opts]);

  // Cleanup al desmontar si estaba activo
  useEffect(() => {
    return () => {
      if (opts.driverId && !opts.active) {
        writeDriverOffline(cityId, opts.driverId).catch(() => {});
      }
    };
  }, [opts.active, opts.driverId, cityId]);
}

