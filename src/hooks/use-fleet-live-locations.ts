"use client";
import { useEffect, useRef, useState } from "react";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export interface DriverLiveLocation {
  id: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  deliveryActive: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: number;
    heading?: number;
    speed?: number;
  };
  deliveryStoreId?: string;
}

export function useFleetLiveLocations({
  storeId,
  driverUids,
  enabled = true,
}: {
  storeId?: string;
  driverUids?: string[];
  enabled?: boolean;
}) {
  const firestore = useFirestore();
  const [drivers, setDrivers] = useState<DriverLiveLocation[]>([]);
  const [isLive, setIsLive] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  const buildQuery = () => {
    if (!firestore || !enabled) return null;
    if (driverUids && driverUids.length > 0) {
      return query(
        collection(firestore, "users"),
        where("__name__", "in", driverUids.slice(0, 30))
      );
    }
    if (storeId) {
      return query(
        collection(firestore, "users"),
        where("deliveryStoreId", "==", storeId),
        where("deliveryActive", "==", true)
      );
    }
    return null;
  };

  const liveQuery = useMemoFirebase(buildQuery, [firestore, enabled, JSON.stringify(driverUids), storeId]);

  useEffect(() => {
    if (!liveQuery) {
      setDrivers([]);
      setIsLive(false);
      return;
    }
    setIsLive(true);
    const unsubscribe = onSnapshot(liveQuery, (snapshot) => {
      const driverData: DriverLiveLocation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.deliveryActive && data.currentLocation) {
          driverData.push({
            id: doc.id,
            displayName: data.displayName || "Repartidor",
            photoURL: data.photoURL,
            phoneNumber: data.phoneNumber,
            deliveryActive: data.deliveryActive,
            currentLocation: data.currentLocation,
            deliveryStoreId: data.deliveryStoreId,
          });
        }
      });
      setDrivers(driverData);
    });
    unsubRef.current = unsubscribe;
    return () => {
      unsubscribe();
      unsubRef.current = null;
      setIsLive(false);
    };
  }, [liveQuery]);

  return { drivers, isLive };
}