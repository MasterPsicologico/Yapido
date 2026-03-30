
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para analizar el rendimiento de zonas y actores.
 */

export const analyzePerformanceTool = ai.defineTool(
  {
    name: 'analytics:analyzePerformance',
    description: 'Analiza el rendimiento por zonas y clasifica tiendas y repartidores.',
    inputSchema: z.object({
      zoneData: z.array(z.any()),
      storeData: z.array(z.any()),
    }),
    outputSchema: z.object({
      topZones: z.array(z.any()),
      topStores: z.array(z.any()),
      hotHours: z.array(z.any()),
    }),
  },
  async (input) => {
    // Simulación de análisis agregado
    return {
      topZones: [
        { zoneName: 'Centro', orderCount: 150, classification: 'ALTA_GANANCIA' },
        { zoneName: 'Norte', orderCount: 85, classification: 'OPORTUNIDAD_MARKETING' }
      ],
      topStores: [
        { storeName: 'Panadería El Sol', salesVolume: 2500000, status: 'TOP_SELLER' },
        { storeName: 'TecnoMundo', salesVolume: 1200000, status: 'NORMAL' }
      ],
      hotHours: [
        { hour: 12, volume: 45, label: 'Almuerzo' },
        { hour: 19, volume: 60, label: 'Cena' }
      ]
    };
  }
);
