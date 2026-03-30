import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para analizar tendencias en el historial de órdenes.
 */

export const analyzeHistoryTool = ai.defineTool(
  {
    name: 'prediccion:analyzeHistory',
    description: 'Extrae patrones de comportamiento de los últimos 7 días.',
    inputSchema: z.object({
      daysToAnalyze: z.number().default(7),
      zone: z.string().optional(),
    }),
    outputSchema: z.object({
      topZones: z.array(z.string()),
      busiestHours: z.array(z.number()),
      avgGrowthRate: z.number(),
    }),
  },
  async (input) => {
    // Simulación de consulta analítica en Firestore
    return {
      topZones: ['Centro', 'Norte', 'Poblado'],
      busiestHours: [12, 13, 19, 20],
      avgGrowthRate: 0.15,
    };
  }
);
