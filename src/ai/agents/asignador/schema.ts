
'use server';
import { z } from 'genkit';

/**
 * @fileOverview Esquemas de datos para el Agente Asignador.
 */

export const AsignadorStateSchema = z.enum([
  'NEW_ORDER',
  'SEARCHING_DRIVER',
  'DRIVER_ASSIGNED',
  'DRIVER_ACCEPTED',
  'DRIVER_REJECTED',
  'DRIVER_NOT_FOUND',
  'REASSIGNING',
  'PICKED_UP',
  'DELIVERED',
  'CANCELLED'
]);

export const DriverSchema = z.object({
  id: z.string(),
  location: z.object({ lat: z.number(), lng: z.number() }),
  status: z.enum(['available', 'busy', 'offline']),
  vehicleType: z.enum(['bike', 'motorcycle', 'car']),
  rating: z.number(),
  completedOrders: z.number(),
  currentOrders: z.number(),
});

export const AsignadorAgentInputSchema = z.object({
  orderId: z.string(),
  storeLocation: z.object({ lat: z.number(), lng: z.number() }),
  customerLocation: z.object({ lat: z.number(), lng: z.number() }),
  orderValue: z.number(),
  priorityLevel: z.number().default(1),
  currentState: AsignadorStateSchema.default('NEW_ORDER'),
  context: z.object({
    availableDrivers: z.array(DriverSchema).optional(),
    attempts: z.number().default(0),
    weather: z.string().optional(),
    isRushHour: z.boolean().default(false),
  }).optional(),
});

export const AsignadorAgentOutputSchema = z.object({
  nextState: AsignadorStateSchema,
  selectedDriverId: z.string().optional(),
  recommendedAction: z.string(),
  updatedPricing: z.number().optional(),
  message: z.string(),
});

export type AsignadorAgentInput = z.infer<typeof AsignadorAgentInputSchema>;
export type AsignadorAgentOutput = z.infer<typeof AsignadorAgentOutputSchema>;
