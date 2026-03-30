
'use server';
import { z } from 'genkit';

/**
 * @fileOverview Esquemas de datos para el Agente de Marketing.
 */

export const CustomerSegmentSchema = z.enum([
  'NUEVO',
  'FRECUENTE',
  'VIP',
  'INACTIVO',
  'RIESGO_FUGA',
  'CAZADOR_OFERTAS'
]);

export const MarketingAgentInputSchema = z.object({
  analytics: z.object({
    ordersByZone: z.record(z.number()),
    activeUsers: z.number(),
    averageTicket: z.number(),
    topCategories: z.array(z.string()),
  }),
  budget: z.number().describe('Presupuesto disponible para la campaña actual'),
  context: z.object({
    time: z.string(),
    isRushHour: z.boolean(),
    weather: z.string().optional(),
    competitorActive: z.boolean().default(false),
  }),
});

export const MarketingAgentOutputSchema = z.object({
  campaignName: z.string(),
  strategy: z.string(),
  targetSegment: CustomerSegmentSchema,
  action: z.enum(['COUPON_GEN', 'FREE_DELIVERY', 'PUSH_NOTIFICATION', 'SMS_RECOVERY', 'CASHBACK_ACTIVATE']),
  couponDetails: z.object({
    code: z.string().optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    value: z.number().optional(),
    minOrderValue: z.number().optional(),
  }).optional(),
  estimatedROI: z.number(),
  message: z.string().describe('Mensaje persuasivo para el cliente'),
});

export type MarketingAgentInput = z.infer<typeof MarketingAgentInputSchema>;
export type MarketingAgentOutput = z.infer<typeof MarketingAgentOutputSchema>;
