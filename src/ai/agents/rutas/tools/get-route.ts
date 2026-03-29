
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para simular la obtención de una ruta desde una API de mapas.
 */

export const getRouteTool = ai.defineTool(
  {
    name: 'rutas:getRoute',
    description: 'Obtiene las coordenadas y la distancia total entre dos puntos.',
    inputSchema: z.object({
      origin: z.object({ lat: z.number(), lng: z.number() }),
      destination: z.object({ lat: z.number(), lng: z.number() }),
    }),
    outputSchema: z.object({
      distanceKm: z.number(),
      polyline: z.string(),
      estimatedBaseMinutes: z.number(),
    }),
  },
  async (input) => {
    // Simulación de cálculo de distancia Haversine o API Maps
    // En una implementación real, aquí llamaríamos a Google Directions API
    const mockDistance = 3.5; 
    return {
      distanceKm: mockDistance,
      polyline: "a~lE_p`u@...",
      estimatedBaseMinutes: Math.round(mockDistance * 3), // 3 min por KM base
    };
  }
);
