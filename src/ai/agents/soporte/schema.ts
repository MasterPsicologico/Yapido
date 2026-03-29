'use server';
import { z } from 'genkit';

/**
 * @fileOverview Esquemas de datos para el Agente de Soporte.
 */

export const SupportTicketStatusSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_RESPONSE',
  'RESOLVED',
  'CLOSED',
  'ESCALATED'
]);

export const SupportPrioritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
]);

export const SupportTicketTypeSchema = z.enum([
  'ORDER_NOT_RECEIVED',
  'INCORRECT_ORDER',
  'DAMAGED_ORDER',
  'DRIVER_ACCIDENT',
  'STORE_STOCK_ISSUE',
  'PAYMENT_ISSUE',
  'FRAUD_SUSPICION',
  'CUSTOMER_NOT_RESPONDING'
]);

export const SupportTicketSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  type: SupportTicketTypeSchema,
  createdBy: z.enum(['cliente', 'repartidor', 'tienda', 'sistema']),
  priority: SupportPrioritySchema,
  status: SupportTicketStatusSchema,
  description: z.string(),
  resolution: z.string().optional(),
  refundAmount: z.number().default(0),
  createdAt: z.string(),
  closedAt: z.string().optional(),
});

export const SupportAgentInputSchema = z.object({
  ticketId: z.string().optional(),
  orderId: z.string(),
  issueDescription: z.string(),
  reporterRole: z.enum(['cliente', 'repartidor', 'tienda', 'sistema']),
  context: z.object({
    orderData: z.any().optional(),
    gpsData: z.any().optional(),
    paymentStatus: z.string().optional(),
    customerHistory: z.any().optional(),
  }).optional(),
});

export const SupportAgentOutputSchema = z.object({
  nextState: SupportTicketStatusSchema,
  actionTaken: z.string(),
  recommendedRefund: z.number().optional(),
  messageToUser: z.string(),
  internalNote: z.string(),
  requiresHumanIntervention: z.boolean().default(false),
});

export type SupportAgentInput = z.infer<typeof SupportAgentInputSchema>;
export type SupportAgentOutput = z.infer<typeof SupportAgentOutputSchema>;
