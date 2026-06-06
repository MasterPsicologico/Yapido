import { z } from 'genkit';

/**
 * @fileOverview Esquemas de datos para el Agente de Optimización.
 */

export const OptimizationTargetSchema = z.enum([
  'DELIVERY_TIME',
  'OPERATIONAL_COST',
  'PROFIT_MARGIN',
  'ORDER_VOLUME',
  'DRIVER_RETENTION',
  'CUSTOMER_SATISFACTION'
]);

export const OptimizationStateSchema = z.enum([
  'ANALYZING_INEFFICIENCIES',
  'SIMULATING_IMPROVEMENTS',
  'APPLYING_RULES',
  'TESTING_CHANGES',
  'MEASURING_IMPACT',
  'SYSTEM_OPTIMIZED'
]);

export const OptimizationAgentInputSchema = z.object({
  targetMetric: OptimizationTargetSchema.default('PROFIT_MARGIN'),
  currentMetrics: z.object({
    avgDeliveryTime: z.number(),
    costPerOrder: z.number(),
    revenuePerOrder: z.number(),
    cancellationRate: z.number(),
    activeDrivers: z.number(),
  }),
  context: z.object({
    busyZones: z.array(z.string()),
    delayedOrders: z.number(),
    trafficLevel: z.number(),
  }).optional(),
  currentState: OptimizationStateSchema.default('ANALYZING_INEFFICIENCIES'),
});

export const OptimizationAgentOutputSchema = z.object({
  nextState: OptimizationStateSchema,
  recommendations: z.array(z.object({
    area: z.string(),
    action: z.string(),
    expectedImpact: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
  })),
  batchingStrategy: z.object({
    enabled: z.boolean(),
    maxOrdersPerDriver: z.number(),
    maxRadiusKm: z.number(),
  }).optional(),
  driverRepositioning: z.array(z.object({
    fromZone: z.string(),
    toZone: z.string(),
    driverCount: z.number(),
  })).optional(),
  message: z.string(),
});

export type OptimizationAgentInput = z.infer<typeof OptimizationAgentInputSchema>;
export type OptimizationAgentOutput = z.infer<typeof OptimizationAgentOutputSchema>;
