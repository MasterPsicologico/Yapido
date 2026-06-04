/**
 * State machine del conductor.
 * Estados: offline → online (idle) → offering → onTrip → offline
 */

import { createMachine, assign } from 'xstate';
import type { LatLng, VehicleType } from '@/lib/contracts';

export type DriverContext = {
  online: boolean;
  currentCityId: string;
  vehicleType: VehicleType;
  currentLocation: LatLng | null;
  pendingOffer: {
    tripId: string;
    fareEstimate: number;
    pickupAddress: string;
    pickup: LatLng;
    expiresAt: number;
    distanceKm: number;
  } | null;
  currentTripId: string | null;
  errorMessage: string | null;
};

export type DriverEvent =
  | { type: 'GO_ONLINE'; cityId: string; vehicleType: VehicleType; loc: LatLng }
  | { type: 'GO_OFFLINE' }
  | { type: 'LOCATION_UPDATE'; loc: LatLng }
  | { type: 'OFFER_RECEIVED'; offer: NonNullable<DriverContext['pendingOffer']> }
  | { type: 'ACCEPT_OFFER'; tripId: string }
  | { type: 'REJECT_OFFER' }
  | { type: 'OFFER_EXPIRED' }
  | { type: 'TRIP_ASSIGNED'; tripId: string }
  | { type: 'TRIP_ARRIVED' }
  | { type: 'TRIP_STARTED' }
  | { type: 'TRIP_COMPLETED' }
  | { type: 'ERROR'; message: string };

const initialContext: DriverContext = {
  online: false,
  currentCityId: 'aguachica',
  vehicleType: 'moto',
  currentLocation: null,
  pendingOffer: null,
  currentTripId: null,
  errorMessage: null,
};

export const driverMachine = createMachine({
  id: 'driver',
  initial: 'offline',
  context: initialContext,
  types: {} as { context: DriverContext; events: DriverEvent },
  states: {
    offline: {
      on: {
        GO_ONLINE: {
          target: 'online',
          actions: assign(({ event }) => ({
            online: true,
            currentCityId: event.cityId,
            vehicleType: event.vehicleType,
            currentLocation: event.loc,
            errorMessage: null,
          })),
        },
        LOCATION_UPDATE: { actions: assign({ currentLocation: ({ event }) => event.loc }) },
      },
    },

    online: {
      on: {
        GO_OFFLINE: { target: 'offline', actions: assign(() => ({ ...initialContext })) },
        LOCATION_UPDATE: { actions: assign({ currentLocation: ({ event }) => event.loc }) },
        OFFER_RECEIVED: { target: 'offering', actions: assign({ pendingOffer: ({ event }) => event.offer }) },
        ERROR: { actions: assign({ errorMessage: ({ event }) => event.message }) },
      },
    },

    offering: {
      after: {
        12000: { target: 'online', actions: assign({ pendingOffer: () => null }) },
      },
      on: {
        ACCEPT_OFFER: {
          target: 'onTrip',
          actions: assign(({ event, context }) => ({
            currentTripId: event.tripId,
            pendingOffer: null,
          })),
        },
        REJECT_OFFER: { target: 'online', actions: assign({ pendingOffer: () => null }) },
        OFFER_EXPIRED: { target: 'online', actions: assign({ pendingOffer: () => null }) },
        LOCATION_UPDATE: { actions: assign({ currentLocation: ({ event }) => event.loc }) },
      },
    },

    onTrip: {
      on: {
        LOCATION_UPDATE: { actions: assign({ currentLocation: ({ event }) => event.loc }) },
        TRIP_ARRIVED: { /* sigue en onTrip, marca interno */ },
        TRIP_STARTED: { /* sigue */ },
        TRIP_COMPLETED: { target: 'online', actions: assign({ currentTripId: () => null }) },
        GO_OFFLINE: { target: 'offline', actions: assign(() => ({ ...initialContext, currentLocation: null })) },
      },
    },
  },
});
