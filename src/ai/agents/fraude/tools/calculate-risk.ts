'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para calcular el Score de Riesgo.
 * Fórmula: Score = (Refunds * 20) + (Cancellations * 15) + (LargeOrderWeight) - (AccountAgeWeight)
 */

export const calculateRiskTool = ai.defineTool(
  {
    name: 'fraude:calculateRisk',
    description: 'Calcula la probabilidad de fraude de una transacción basada en el historial del usuario.',
    inputSchema: z.object({
      refunds: z.number(),
      cancellations: z.number(),
      orderValue: z.number(),
      accountAgeDays: z.number(),
      isNewCard: z.boolean().default(false)
    }),
    outputSchema: z.object({
      score: z.number(),
      factors: z.array(z.string()),
    }),
  },
  async (input) => {
    let score = 10; // Base risk
    const factors = [];

    if (input.refunds > 2) {
      score += 30;
      factors.push('Historial alto de reembolsos');
    }

    if (input.accountAgeDays < 7 && input.orderValue > 150000) {
      score += 40;
      factors.push('Cuenta nueva con pedido de alto valor');
    }

    if (input.isNewCard) {
      score += 15;
      factors.push('Tarjeta de crédito no verificada');
    }

    if (input.cancellations > 5) {
      score += 20;
      factors.push('Frecuentes cancelaciones previas');
    }

    // Cap at 100
    score = Math.min(score, 100);

    return {
      score,
      factors
    };
  }
);
