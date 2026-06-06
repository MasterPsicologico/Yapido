import { z } from 'genkit';

/**
 * @fileOverview Esquemas de datos para el Agente Analytics.
 */

export const MetricSummarySchema = z.object({
  totalRevenue: z.number(),
  totalCosts: z.number(),
  netProfit: z.number(),
  profitMargin: z.number(),
});

export const ZonePerformanceSchema = z.object({
  zoneName: z.string(),
  orderCount: z.number(),
  revenue: z.number(),
  avgDeliveryTime: z.number(),
  cancellationRate: z.number(),
  classification: z.enum(['ALTA_GANANCIA', 'ALTA_DEMANDA', 'PROBLEMA_LOGISTICO', 'OPORTUNIDAD_MARKETING']),
});

export const StorePerformanceSchema = z.object({
  storeId: z.string(),
  storeName: z.string(),
  salesVolume: z.number(),
  avgPrepTime: z.number(),
  rating: z.number(),
  status: z.enum(['TOP_SELLER', 'NORMAL', 'LENTA', 'ALTO_RIESGO']),
});

export const AnalyticsAgentInputSchema = z.object({
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  historicalData: z.object({
    orders: z.array(z.any()).optional(),
    payments: z.array(z.any()).optional(),
    cancellations: z.array(z.any()).optional(),
  }).optional(),
});

export const AnalyticsAgentOutputSchema = z.object({
  financials: MetricSummarySchema,
  topZones: z.array(ZonePerformanceSchema),
  topStores: z.array(StorePerformanceSchema),
  peakHours: z.array(z.object({
    hour: z.number(),
    volume: z.number(),
    label: z.string(),
  })),
  recommendations: z.array(z.object({
    type: z.enum(['EXPANSION', 'OPTIMIZACION', 'MARKETING', 'SEGURIDAD']),
    priority: z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']),
    message: z.string(),
  })),
  message: z.string(),
});

export type AnalyticsAgentInput = z.infer<typeof AnalyticsAgentInputSchema>;
export type AnalyticsAgentOutput = z.infer<typeof AnalyticsAgentOutputSchema>;
