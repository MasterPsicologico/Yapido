
'use server';
import { z } from 'genkit';

/**
 * @fileOverview Definición de esquemas y estados para el Agente Cliente.
 */

export const ClienteStateSchema = z.enum([
  'INIT',
  'BROWSING',
  'CART',
  'ADDRESS',
  'PAYMENT',
  'CONFIRM',
  'WAITING_STORE',
  'WAITING_DRIVER',
  'ON_THE_WAY',
  'DELIVERED',
  'CANCELLED',
  'SUPPORT'
]);

export const ClienteAgentInputSchema = z.object({
  userId: z.string(),
  query: z.string(),
  currentState: ClienteStateSchema.default('INIT'),
  context: z.object({
    cartItems: z.array(z.any()).optional(),
    address: z.string().optional(),
    storeId: z.string().optional(),
    paymentMethod: z.enum(['cash', 'digital']).optional(),
  }).optional(),
});

export const ClienteAgentOutputSchema = z.object({
  nextState: ClienteStateSchema,
  message: z.string(),
  actionTaken: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export type ClienteAgentInput = z.infer<typeof ClienteAgentInputSchema>;
export type ClienteAgentOutput = z.infer<typeof ClienteAgentOutputSchema>;
