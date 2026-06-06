import { z } from 'genkit';

/**
 * @fileOverview Esquemas de datos para el Agente de Precios Dinámicos.
 */

export const PricingStateSchema = z.enum([
  'NORMAL_PRICE',
  'HIGH_DEMAND',
  'LOW_DEMAND',
  'DRIVER_INCENTIVE',
  'SURGE',
  'REPRICE'
]);

export const PricingAgentInputSchema = z.object({
  orderId: z.string(),
  distanceKm: z.number(),
  estimatedTimeMin: z.number(),
  demandLevel: z.enum(['low', 'normal', 'high', 'very_high']).default('normal'),
  availableDrivers: z.number(),
  weather: z.enum(['clear', 'rain', 'storm']).default('clear'),
  trafficLevel: z.number().default(1.0), // 1.0 a 2.0
  orderValue: z.number(),
  isRushHour: z.boolean().default(false),
  isFrequentCustomer: z.boolean().default(false),
});

export const PricingAgentOutputSchema = z.object({
  nextState: PricingStateSchema,
  totalDeliveryFare: z.number(),
  breakdown: z.object({
    driverEarnings: z.number(),
    platformCommission: z.number(),
    promoFund: z.number(),
  }),
  appliedMultipliers: z.object({
    demand: z.number(),
    weather: z.number(),
    traffic: z.number(),
  }),
  message: z.string(),
});

export type PricingAgentInput = z.infer<typeof PricingAgentInputSchema>;
export type PricingAgentOutput = z.infer<typeof PricingAgentOutputSchema>;
