
'use server';
import { z } from 'genkit';

/**
 * @fileOverview Esquemas de datos para el Agente de Pagos.
 */

export const PaymentStateSchema = z.enum([
  'PAYMENT_PENDING',
  'PAYMENT_APPROVED',
  'PAYMENT_FAILED',
  'PAYMENT_SPLIT',
  'DRIVER_PAID',
  'STORE_PAID',
  'REFUND_PENDING',
  'REFUNDED'
]);

export const PayoutBreakdownSchema = z.object({
  totalAmount: z.number().describe('Monto total pagado por el cliente'),
  storeAmount: z.number().describe('Monto destinado a la tienda (valor productos)'),
  driverAmount: z.number().describe('Monto destinado al repartidor (70% del delivery fee)'),
  platformCommission: z.number().describe('Comisión neta de la plataforma'),
  promoFund: z.number().describe('Fondo para promociones y descuentos'),
});

export const PagosAgentInputSchema = z.object({
  orderId: z.string(),
  customerId: z.string(),
  paymentMethod: z.enum(['cash', 'digital', 'nequi', 'daviplata', 'pse', 'card']),
  totalAmount: z.number(),
  deliveryFee: z.number(),
  currentState: PaymentStateSchema.default('PAYMENT_PENDING'),
  context: z.object({
    isDelivered: z.boolean().default(false),
    isCancelled: z.boolean().default(false),
    transactionId: z.string().optional(),
  }).optional(),
});

export const PagosAgentOutputSchema = z.object({
  nextState: PaymentStateSchema,
  actionTaken: z.string(),
  breakdown: PayoutBreakdownSchema.optional(),
  transactionId: z.string().optional(),
  message: z.string(),
  requiresAction: z.boolean().default(false),
});

export type PagosAgentInput = z.infer<typeof PagosAgentInputSchema>;
export type PagosAgentOutput = z.infer<typeof PagosAgentOutputSchema>;
