
'use server';
import { z } from 'genkit';

/**
 * @fileOverview Esquemas de datos para el Agente de Rutas.
 */

export const RoutingStateSchema = z.enum([
  'CALCULATING_ROUTE',
  'ROUTE_READY',
  'DRIVER_MOVING',
  'TRAFFIC_DETECTED',
  'RECALCULATING',
  'DELAY_DETECTED',
  'ROUTE_OPTIMIZED'
]);

export const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional()
});

export const RoutingAgentInputSchema = z.object({
  orderId: z.string(),
  driverLocation: LocationSchema,
  storeLocation: LocationSchema,
  customerLocation: LocationSchema,
  currentState: RoutingStateSchema.default('CALCULATING_ROUTE'),
  context: z.object({
    trafficLevel: z.number().default(1.0), // 1.0 = normal, 1.5 = tráfico alto
    weather: z.string().default('clear'),
    isMultiOrder: z.boolean().default(false),
    additionalStops: z.array(LocationSchema).optional(),
  }).optional(),
});

export const RoutingAgentOutputSchema = z.object({
  nextState: RoutingStateSchema,
  estimatedTravelTimeMinutes: z.number(),
  optimizedPath: z.array(LocationSchema),
  distanceKm: z.number(),
  recommendation: z.string(),
  trafficImpactFactor: z.number(),
});

export type RoutingAgentInput = z.infer<typeof RoutingAgentInputSchema>;
export type RoutingAgentOutput = z.infer<typeof RoutingAgentOutputSchema>;
