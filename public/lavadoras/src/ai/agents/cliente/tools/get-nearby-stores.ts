import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para obtener tiendas cercanas.
 */

export const getNearbyStoresTool = ai.defineTool(
  {
    name: 'cliente:getNearbyStores',
    description: 'Busca vitrinas activas cerca de la ubicación del usuario.',
    inputSchema: z.object({ location: z.string().optional() }),
    outputSchema: z.array(z.object({ id: z.string(), name: z.string(), category: z.string() })),
  },
  async (input) => {
    // Simulación de búsqueda en Firestore
    return [
      { id: 'store-1', name: 'Panadería El Sol', category: 'Alimentos' },
      { id: 'store-2', name: 'TecnoMundo', category: 'Tecnología' }
    ];
  }
);
