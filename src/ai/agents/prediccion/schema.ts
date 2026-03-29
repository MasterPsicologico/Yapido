
'use server';
import { z } from 'genkit';

/**
 * @fileOverview Esquemas de datos para el Agente de Predicción.
 */

export const PredictionStateSchema = z.enum([
  'COLLECTING_DATA',
  'ANALYZING',
  'PREDICTING',
  'SENDING_RESULTS',
  'LEARNING'
]);

export const PredictionInputSchema = z.object({
  currentContext: z.object({
    date: z.string().describe('Fecha actual para análisis estacional'),
    time: z.string().describe('Hora actual para detección de horas pico'),
    zone: z.string().optional().describe('Zona específica a analizar'),
    weather: z.enum(['clear', 'rain', 'storm', 'cloudy']).default('clear'),
    trafficLevel: z.number().default(1.0),
  }),
  historySummary: z.array(z.object({
    zone: z.string(),
    orderCount: z.number(),
    avgDeliveryTime: z.number(),
    timestamp: z.string(),
  })).optional(),
});

export const PredictionOutputSchema = z.object({
  nextState: PredictionStateSchema,
  predictedDemand: z.enum(['low', 'normal', 'high', 'very_high']),
  recommendedDriverPositioning: z.array(z.object({
    zone: z.string(),
    count: z.number(),
    priority: z.number(),
  })),
  hotZones: z.array(z.string()),
  estimatedSystemLatencyMinutes: z.number(),
  surgePricingRecommendation: z.number().describe('Multiplicador de precio sugerido'),
  message: z.string(),
});

export type PredictionAgentInput = z.infer<typeof PredictionInputSchema>;
export type PredictionAgentOutput = z.infer<typeof PredictionOutputSchema>;
