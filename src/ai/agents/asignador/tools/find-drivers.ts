
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para buscar repartidores disponibles cerca de una ubicación.
 */

export const findDriversTool = ai.defineTool(
  {
    name: 'asignador:findDrivers',
    description: 'Busca en la base de datos de repartidores aquellos que están online y cerca.',
    inputSchema: z.object({
      lat: z.number(),
      lng: z.number(),
      radiusKm: z.number().default(5),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      name: z.string(),
      distanceKm: z.number(),
      rating: z.number(),
      currentOrders: z.number(),
      vehicle: z.string()
    })),
  },
  async (input) => {
    // Simulación de consulta geoespacial en Firestore
    return [
      { id: 'DRV-001', name: 'Juan Veloz', distanceKm: 1.2, rating: 4.9, currentOrders: 0, vehicle: 'motorcycle' },
      { id: 'DRV-002', name: 'Pedro Ruta', distanceKm: 0.5, rating: 4.2, currentOrders: 1, vehicle: 'bike' },
      { id: 'DRV-003', name: 'Maria Flash', distanceKm: 3.1, rating: 5.0, currentOrders: 0, vehicle: 'motorcycle' }
    ];
  }
);
