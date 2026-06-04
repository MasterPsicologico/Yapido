/**
 * Store del driver (online/offline, vehículo activo).
 */

import { create } from 'zustand';
import type { VehicleType, LatLng } from '@/lib/contracts';

interface DriverStore {
  online: boolean;
  cityId: string;
  vehicleType: VehicleType;
  currentLocation: LatLng | null;
  pendingOffer: { tripId: string; fareEstimate: number; expiresAt: number } | null;
  currentTripId: string | null;
  setOnline: (online: boolean) => void;
  setCity: (cityId: string) => void;
  setVehicleType: (v: VehicleType) => void;
  setLocation: (loc: LatLng | null) => void;
  setOffer: (offer: DriverStore['pendingOffer']) => void;
  setTrip: (tripId: string | null) => void;
}

export const useDriverStore = create<DriverStore>((set) => ({
  online: false,
  cityId: 'aguachica',
  vehicleType: 'moto',
  currentLocation: null,
  pendingOffer: null,
  currentTripId: null,
  setOnline: (online) => set({ online }),
  setCity: (cityId) => set({ cityId }),
  setVehicleType: (vehicleType) => set({ vehicleType }),
  setLocation: (currentLocation) => set({ currentLocation }),
  setOffer: (pendingOffer) => set({ pendingOffer }),
  setTrip: (currentTripId) => set({ currentTripId, ...(currentTripId ? { online: true } : {}) }),
}));
