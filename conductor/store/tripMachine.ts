/**
 * State machine del viaje (lado pasajero).
 * Estados:
 *   idle → searching → offered → accepted → arriving → in_progress → completed → rated
 * En cualquier estado, cancelBy* lleva a cancelled.
 */

import { createMachine, assign, type AnyEventObject } from 'xstate';
import type { LatLng, Trip, TripFare } from '@/lib/contracts';

export type TripContext = {
  trip: Trip | null;
  driverLocation: LatLng | null;
  eta: number | null;            // segundos
  fare: TripFare | null;
  pickup: LatLng | null;
  dropoff: LatLng | null;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  errorMessage: string | null;
  cancelReason: string | null;
};

export type TripEvent =
  | { type: 'SET_FARE_ESTIMATE'; fare: TripFare; eta?: number }
  | { type: 'REQUEST_TRIP'; trip: Trip }
  | { type: 'DRIVER_FOUND'; driver: NonNullable<Trip['driver']> }
  | { type: 'DRIVER_LOCATION'; loc: LatLng }
  | { type: 'ETA_UPDATE'; eta: number }
  | { type: 'DRIVER_ARRIVED' }
  | { type: 'TRIP_STARTED' }
  | { type: 'TRIP_COMPLETED'; fare: TripFare }
  | { type: 'RATE_SUBMITTED' }
  | { type: 'CANCEL'; by: 'passenger' | 'system'; reason?: string }
  | { type: 'NO_DRIVERS' }
  | { type: 'RESET' }
  | { type: 'ERROR'; message: string };

const initialContext: TripContext = {
  trip: null,
  driverLocation: null,
  eta: null,
  fare: null,
  pickup: null,
  dropoff: null,
  pickupAddress: null,
  dropoffAddress: null,
  errorMessage: null,
  cancelReason: null,
};

export const tripMachine = createMachine({
  id: 'trip',
  initial: 'idle',
  context: initialContext,
  types: {} as { context: TripContext; events: TripEvent },
  states: {
    idle: {
      on: {
        SET_FARE_ESTIMATE: {
          actions: assign(({ event }) => ({
            fare: event.fare,
            eta: event.eta ?? null,
          })),
        },
        REQUEST_TRIP: {
          target: 'searching',
          actions: assign(({ event }) => ({
            trip: event.trip,
            pickup: event.trip.pickup,
            dropoff: event.trip.dropoff,
            pickupAddress: event.trip.pickup.address,
            dropoffAddress: event.trip.dropoff.address,
            errorMessage: null,
            cancelReason: null,
          })),
        },
        RESET: { target: 'idle', actions: assign(() => initialContext) },
      },
    },

    searching: {
      on: {
        DRIVER_FOUND: {
          target: 'offered',
          actions: assign(({ context, event }) => ({
            trip: context.trip
              ? { ...context.trip, driver: event.driver, status: 'offered' }
              : null,
          })),
        },
        NO_DRIVERS: { target: 'noDrivers' },
        CANCEL: { target: 'cancelled', actions: assignCancel },
        ERROR: { target: 'error', actions: assignError },
      },
    },

    offered: {
      // El conductor tiene TIMEOUTS.OFFER_TO_DRIVER para aceptar.
      after: {
        12000: { target: 'searching', actions: assign({ errorMessage: () => 'Conductor no respondió, buscando otro...' }) },
      },
      on: {
        DRIVER_LOCATION: { actions: assign({ driverLocation: ({ event }) => event.loc }) },
        ETA_UPDATE: { actions: assign({ eta: ({ event }) => event.eta }) },
        // El sistema notifica cuando el conductor aceptó:
        TRIP_STARTED: { target: 'arriving' },  // reusamos TRIP_STARTED para "accepted→arriving"
        CANCEL: { target: 'cancelled', actions: assignCancel },
      },
    },

    accepted: {
      on: {
        DRIVER_LOCATION: { actions: assign({ driverLocation: ({ event }) => event.loc }) },
        ETA_UPDATE: { actions: assign({ eta: ({ event }) => event.eta }) },
        DRIVER_ARRIVED: { target: 'arriving' },
        CANCEL: { target: 'cancelled', actions: assignCancel },
      },
    },

    arriving: {
      on: {
        DRIVER_LOCATION: { actions: assign({ driverLocation: ({ event }) => event.loc }) },
        ETA_UPDATE: { actions: assign({ eta: ({ event }) => event.eta }) },
        TRIP_STARTED: { target: 'inProgress' },
        CANCEL: { target: 'cancelled', actions: assignCancel },
      },
    },

    inProgress: {
      on: {
        DRIVER_LOCATION: { actions: assign({ driverLocation: ({ event }) => event.loc }) },
        TRIP_COMPLETED: {
          target: 'completed',
          actions: assign(({ event }) => ({ fare: event.fare })),
        },
      },
    },

    completed: {
      on: {
        RATE_SUBMITTED: { target: 'rated' },
        RESET: { target: 'idle', actions: assign(() => initialContext) },
      },
      after: {
        // Auto-reset tras 5 min si el usuario no calificó
        300_000: { target: 'idle', actions: assign(() => initialContext) },
      },
    },

    rated: {
      on: {
        RESET: { target: 'idle', actions: assign(() => initialContext) },
      },
    },

    cancelled: {
      on: {
        RESET: { target: 'idle', actions: assign(() => initialContext) },
      },
    },

    noDrivers: {
      on: {
        REQUEST_TRIP: { target: 'searching', actions: assign(({ event }) => ({ trip: event.trip })) },
        RESET: { target: 'idle', actions: assign(() => initialContext) },
      },
    },

    error: {
      on: {
        RESET: { target: 'idle', actions: assign(() => initialContext) },
      },
    },
  },
  on: {
    RESET: { target: '.idle', actions: assign(() => initialContext) },
  },
});

// Helpers de acciones
function assignCancel({ event }: AnyEventObject) {
  return assign({
    cancelReason: () => (event.reason as string | undefined) ?? (event.by as string),
    trip: ({ context }: { context: TripContext }) =>
      context.trip
        ? {
            ...context.trip,
            status: 'cancelled' as const,
            timeline: {
              ...context.trip.timeline,
              cancelledAt: new Date(),
              cancelledBy: (event.by === 'passenger' ? 'passenger' : 'system') as 'passenger' | 'system',
              cancelReason: (event.reason as string | undefined) ?? null,
            },
          }
        : null,
  });
}

function assignError({ event }: AnyEventObject) {
  return assign({
    errorMessage: () => event.message as string,
  });
}

// Hook React-friendly (se exporta desde hooks/)
export type TripMachine = typeof tripMachine;
