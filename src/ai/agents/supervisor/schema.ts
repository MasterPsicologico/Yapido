
'use server';
import { z } from 'genkit';

/**
 * @fileOverview Esquemas de datos para el Agente Supervisor.
 */

export const SystemModeSchema = z.enum([
  'NORMAL',
  'HIGH_DEMAND',
  'LOW_SUPPLY',
  'EMERGENCY',
  'HIGH_FRAUD',
  'CRITICAL_WEATHER',
  'TRAFFIC_JAM'
]);

export const GlobalMetricsSchema = z.object({
  activeOrders: z.number().describe('Total de pedidos en curso'),
  availableDrivers: z.number().describe('Repartidores online y libres'),
  averageDeliveryTime: z.number().describe('Tiempo promedio de entrega actual'),
  cancellationRate: z.number().describe('Tasa de cancelaciones en la última hora'),
  fraudAlerts: z.number().describe('Alertas de fraude activas'),
  trafficLevel: z.number().default(1.0),
  weatherCondition: z.string().default('clear'),
});

export const SupervisorAgentInputSchema = z.object({
  metrics: GlobalMetricsSchema,
  currentMode: SystemModeSchema.default('NORMAL'),
  timestamp: z.string().optional(),
});

export const SupervisorAgentOutputSchema = z.object({
  nextMode: SystemModeSchema,
  recommendations: z.array(z.object({
    targetAgent: z.string(),
    action: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
  })),
  globalAdjustments: z.object({
    priceMultiplier: z.number().default(1.0),
    driverBonus: z.number().default(0),
    restrictZones: z.array(z.string()).optional(),
    enforcePIN: z.boolean().default(false),
  }),
  systemHealthScore: z.number().min(0).max(100),
  message: z.string(),
});

export type SupervisorAgentInput = z.infer<typeof SupervisorAgentInputSchema>;
export type SupervisorAgentOutput = z.infer<typeof SupervisorAgentOutputSchema>;
