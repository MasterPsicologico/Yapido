
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para calcular el ETA real.
 * Fórmula: T = (D / V) * Ft
 */

export const calculateETATool = ai.defineTool(
  {
    name: 'rutas:calculateETA',
    description: 'Calcula el tiempo estimado de llegada considerando distancia, velocidad y tráfico.',
    inputSchema: z.object({
      distanceKm: z.number(),
      averageSpeedKmh: z.number().default(30), // Promedio en ciudad para motos/bicis
      trafficFactor: z.number().default(1.0),
    }),
    outputSchema: z.object({
      estimatedMinutes: z.number(),
      reason: z.string(),
    }),
  },
  async (input) => {
    // T = (D / V) * 60 (para minutos) * Factor Tráfico
    const rawTime = (input.distanceKm / input.averageSpeedKmh) * 60;
    const estimatedMinutes = Math.round(rawTime * input.trafficFactor);

    let reason = "Tráfico fluido";
    if (input.trafficFactor > 1.4) reason = "Tráfico pesado detectado";
    else if (input.trafficFactor > 1.2) reason = "Tráfico moderado";

    return {
      estimatedMinutes,
      reason
    };
  }
);
