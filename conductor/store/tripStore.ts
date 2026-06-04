/**
 * Store global del viaje (lado pasajero).
 * Integra XState + cache de datos.
 */

import { create } from 'zustand';
import { useMachine } from '@xstate/react';
import { tripMachine, type TripContext } from './tripMachine';
import type { LatLng, TripFare, Trip } from '@/lib/contracts';

type Snapshot = ReturnType<typeof useMachine>;

interface TripStore {
  snapshot: Snapshot | null;
  init: () => void;
  setFareEstimate: (fare: TripFare, eta?: number) => void;
  setPickup: (loc: LatLng, address: string) => void;
  setDropoff: (loc: LatLng, address: string) => void;
  requestTrip: (trip: Trip) => void;
  reset: () => void;
  // Exposición de context y estado actual para componentes
  context: TripContext;
  state: string;
  send: Snapshot extends [infer S, infer A, infer _] ? (e: S extends { value: any } ? any : any) => void : never;
}

// NOTA: useMachine es un hook; no se puede llamar fuera de un componente React.
// Por simplicidad, los stores de Zustand para state machine se manejan en componentes
// individuales. Este archivo expone helpers para acceder a context cuando ya hay un
// Provider arriba.

// Helpers para inicializar máquinas en componentes.
export const newTripMachine = () => tripMachine;
