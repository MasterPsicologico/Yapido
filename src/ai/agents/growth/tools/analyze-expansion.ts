
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para calcular el potencial de expansión de una zona.
 */

export const analyzeExpansionTool = ai.defineTool(
  {
    name: 'growth:analyzeExpansion',
    description: 'Calcula el score de expansión basado en demanda proyectada y rentabilidad.',
    inputSchema: z.object({
      zoneName: z.string(),
      projectedOrders: z.number(),
      estimatedProfitPerOrder: z.number(),
      competitorDensity: z.number().describe('0.0 (baja) a 1.0 (alta)'),
    }),
    outputSchema: z.object({
      expansionScore: z.number(),
      priority: z.string(),
      viability: z.boolean(),
    }),
  },
  async (input) => {
    // Score = (Proyección * Ganancia) * (1 - Competencia)
    const baseScore = (input.projectedOrders * input.estimatedProfitPerOrder) / 100;
    const competitionPenalty = input.competitorDensity * 20;
    const finalScore = Math.min(Math.max(baseScore - competitionPenalty, 0), 100);

    return {
      expansionScore: Math.round(finalScore),
      priority: finalScore > 80 ? 'CRITICA' : finalScore > 50 ? 'ALTA' : 'MEDIA',
      viability: finalScore > 40
    };
  }
);
