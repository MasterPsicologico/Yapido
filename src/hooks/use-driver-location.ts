"use client";
import { useEffect, useRef, useCallback, useMemo } from "react";
import { useUser, useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";

const GPS_INTERVAL_MS = 15_000;
const GPS_TIMEOUT_MS = 5_000;

const VALID_LAT_MIN = -90;
const VALID_LAT_MAX = 90;
const VALID_LNG_MIN = -180;
const VALID_LNG_MAX = 180;

const MAX_SPEED_KMH = 200;
const MIN_TIME_BETWEEN_UPDATES = 5000;

const VALID_COLOMBIA_BOUNDS = {
  latMin: 4.4,
  latMax: 4.9,
  lngMin: -74.2,
  lngMax: -73.9,
};

export interface DriverLocationData {
  lat: number;
  lng: number;
  timestamp: number;
  heading?: number;
  speed?: number;
}

function isValidLocation(location: DriverLocationData): boolean {
  if (!location) return false;
  
  if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return false;
  }
  
  if (location.lat < VALID_LAT_MIN || location.lat > VALID_LAT_MAX) {
    return false;
  }
  
  if (location.lng < VALID_LNG_MIN || location.lng > VALID_LNG_MAX) {
    return false;
  }

  if (location.lat < VALID_COLOMBIA_BOUNDS.latMin || 
      location.lat > VALID_COLOMBIA_BOUNDS.latMax ||
      location.lng < VALID_COLOMBIA_BOUNDS.lngMin || 
      location.lng > VALID_COLOMBIA_BOUNDS.lngMax) {
    console.warn('[Security] Location outside Colombia bounds:', location);
  }
  
  if (location.speed !== undefined && location.speed > MAX_SPEED_KMH) {
    console.warn('[Security] Speed exceeds maximum allowed:', location.speed);
    return false;
  }

  const timeSinceTimestamp = Date.now() - (location.timestamp || 0);
  if (timeSinceTimestamp > 60000) {
    console.warn('[Security] Location timestamp too old:', timeSinceTimestamp);
    return false;
  }
  
  return true;
}

function sanitizeLocationData(location: Partial<DriverLocationData>): DriverLocationData | null {
  if (!location) return null;
  
  return {
    lat: Math.max(VALID_LAT_MIN, Math.min(VALID_LAT_MAX, location.lat || 0)),
    lng: Math.max(VALID_LNG_MIN, Math.min(VALID_LNG_MAX, location.lng || 0)),
    timestamp: location.timestamp || Date.now(),
    heading: typeof location.heading === 'number' ? Math.max(0, Math.min(360, location.heading)) : undefined,
    speed: typeof location.speed === 'number' ? Math.max(0, Math.min(MAX_SPEED_KMH, location.speed)) : undefined,
  };
}

function getCurrentPosition(): Promise<DriverLocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
          heading: pos.coords.heading || undefined,
          speed: pos.coords.speed !== null ? pos.coords.speed * 3.6 : undefined,
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge: 0 }
    );
  });
}

export function useDriverLocation({
  enabled = true,
  storeId,
}: {
  enabled?: boolean;
  storeId?: string;
}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTrackingRef = useRef(false);
  const lastUpdateRef = useRef<number>(0);

  const sendLocation = useCallback(
    async (location: DriverLocationData) => {
      if (!firestore || !user?.uid) return;
      
      const now = Date.now();
      if (now - lastUpdateRef.current < MIN_TIME_BETWEEN_UPDATES) {
        return;
      }
      
      if (!isValidLocation(location)) {
        console.warn('[Security] Invalid location data rejected:', location);
        return;
      }
      
      const sanitizedLocation = sanitizeLocationData(location);
      if (!sanitizedLocation) return;
      
      try {
        const userRef = doc(firestore, "users", user.uid);
        await updateDocumentNonBlocking(userRef, {
          currentLocation: {
            lat: sanitizedLocation.lat,
            lng: sanitizedLocation.lng,
            timestamp: sanitizedLocation.timestamp,
            heading: sanitizedLocation.heading,
            speed: sanitizedLocation.speed,
          },
          deliveryActive: true,
          deliveryStoreId: storeId || null,
          lastLocationUpdate: now,
        });
        lastUpdateRef.current = now;
      } catch (error) {
        console.error('[GPS] Error updating location:', error);
      }
    },
    [firestore, user?.uid, storeId]
  );

  const startTracking = useCallback(() => {
    if (isTrackingRef.current || !user?.uid) return;
    isTrackingRef.current = true;
    lastUpdateRef.current = 0;
    getCurrentPosition()
      .then((location) => {
        if (isValidLocation(location)) {
          sendLocation(location);
        }
      })
      .catch((error) => {
        console.warn('[GPS] Initial position failed:', error);
      });
    
    intervalRef.current = setInterval(() => {
      getCurrentPosition()
        .then((location) => {
          if (isValidLocation(location)) {
            sendLocation(location);
          }
        })
        .catch(() => {});
    }, GPS_INTERVAL_MS);
  }, [user?.uid, sendLocation]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isTrackingRef.current = false;
    if (firestore && user?.uid) {
      const userRef = doc(firestore, "users", user.uid);
      try {
        updateDocumentNonBlocking(userRef, {
          deliveryActive: false,
          currentLocation: null,
          deliveryStoreId: null,
          lastLocationUpdate: null,
        });
      } catch (error) {
        console.warn('[GPS] Error stopping tracking:', error);
      }
    }
  }, [firestore, user?.uid]);

  useEffect(() => {
    if (enabled) startTracking();
    else stopTracking();
    return () => { stopTracking(); };
  }, [enabled, startTracking, stopTracking]);

  return { startTracking, stopTracking };
}