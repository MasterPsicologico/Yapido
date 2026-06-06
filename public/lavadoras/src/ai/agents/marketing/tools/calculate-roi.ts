import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para calcular la rentabilidad de una promoción.
 */

export const calculateROITool = ai.defineTool(
  {
    name: 'marketing:calculateROI',
    description: 'Calcula el retorno de inversión estimado de una campaña publicitaria.',
    inputSchema: z.object({
      promoCost: z.number(),
      expectedOrders: z.number(),
      avgCommissionPerOrder: z.number(),
    }),
    outputSchema: z.object({
      estimatedProfit: z.number(),
      roiPercent: z.number(),
      isViable: z.boolean(),
    }),
  },
  async (input) => {
    const totalRevenue = input.expectedOrders * input.avgCommissionPerOrder;
    const profit = totalRevenue - input.promoCost;
    const roi = (profit / (input.promoCost || 1)) * 100;

    return {
      estimatedProfit: profit,
      roiPercent: Math.round(roi),
      isViable: profit > 0
    };
  }
);
