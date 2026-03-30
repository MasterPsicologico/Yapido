import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para detectar anomalías de ubicación (GPS Falso/Inconsistente).
 */

export const gpsCheckerTool = ai.defineTool(
  {
    name: 'fraude:gpsChecker',
    description: 'Valida si la posición del repartidor es consistente con el punto de entrega.',
    inputSchema: z.object({
      driverLat: z.number(),
      driverLng: z.number(),
      targetLat: z.number(),
      targetLng: z.number(),
      accuracyMeters: z.number().default(50)
    }),
    outputSchema: z.object({
      isConsistent: z.boolean(),
      distanceDiffMeters: z.number(),
      alert: z.boolean()
    }),
  },
  async (input) => {
    // Simulación de cálculo de distancia Haversine
    const dist = 120; // metros de diferencia simulados
    const isConsistent = dist < input.accuracyMeters;

    return {
      isConsistent,
      distanceDiffMeters: dist,
      alert: dist > 500 // Alerta si está a más de 500m del punto real
    };
  }
);
