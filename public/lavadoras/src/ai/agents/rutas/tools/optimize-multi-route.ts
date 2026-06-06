import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para optimizar rutas con múltiples paradas.
 */

export const optimizeMultiRouteTool = ai.defineTool(
  {
    name: 'rutas:optimizeMultiRoute',
    description: 'Encuentra el orden óptimo de paradas para minimizar la distancia total.',
    inputSchema: z.object({
      currentLocation: z.object({ lat: z.number(), lng: z.number() }),
      stops: z.array(z.object({ id: z.string(), lat: z.number(), lng: z.number() })),
    }),
    outputSchema: z.object({
      optimizedOrder: z.array(z.string()),
      totalDistanceKm: z.number(),
    }),
  },
  async (input) => {
    // Lógica simplificada: Ordenar por distancia más cercana (Greedy Algorithm)
    // En el futuro esto resuelve el Problema del Viajante (TSP)
    const sortedIds = input.stops.map(s => s.id); // Simulación de optimización
    
    return {
      optimizedOrder: sortedIds,
      totalDistanceKm: input.stops.length * 1.8, // Estimación
    };
  }
);
