"use client";
import { useEffect, useRef, useCallback } from "react";
import { useUser, useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";

const GPS_INTERVAL_MS = 15_000;
const GPS_TIMEOUT_MS = 5_000;

export interface DriverLocationData {
  lat: number;
  lng: number;
  timestamp: number;
  heading?: number;
  speed?: number;
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
          speed: pos.coords.speed || undefined,
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

  const sendLocation = useCallback(
    async (location: DriverLocationData) => {
      if (!firestore || !user?.uid) return;
      try {
        const userRef = doc(firestore, "users", user.uid);
        await updateDocumentNonBlocking(userRef, {
          currentLocation: {
            lat: location.lat,
            lng: location.lng,
            timestamp: location.timestamp,
            heading: location.heading,
            speed: location.speed,
          },
          deliveryActive: true,
          deliveryStoreId: storeId || null,
        });
      } catch {}
    },
    [firestore, user?.uid, storeId]
  );

  const startTracking = useCallback(() => {
    if (isTrackingRef.current || !user?.uid) return;
    isTrackingRef.current = true;
    getCurrentPosition().then(sendLocation).catch(() => {});
    intervalRef.current = setInterval(() => {
      getCurrentPosition().then(sendLocation).catch(() => {});
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
      updateDocumentNonBlocking(userRef, {
        deliveryActive: false,
        currentLocation: null,
        deliveryStoreId: null,
      });
    }
  }, [firestore, user?.uid]);

  useEffect(() => {
    if (enabled) startTracking();
    else stopTracking();
    return () => { stopTracking(); };
  }, [enabled, startTracking, stopTracking]);

  return { startTracking, stopTracking };
}