import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para identificar tipos de negocios con alto potencial de afiliación.
 */

export const identifyPartnersTool = ai.defineTool(
  {
    name: 'growth:identifyPartners',
    description: 'Identifica categorías de negocios desatendidas en una zona específica.',
    inputSchema: z.object({
      zoneName: z.string(),
      existingBusinessTypes: z.array(z.string()),
    }),
    outputSchema: z.array(z.object({
      category: z.string(),
      potentialProfit: z.string(),
      urgency: z.number(),
    })),
  },
  async (input) => {
    const allCategories = ['FARMACIAS', 'SUPERMERCADOS', 'LICORERIAS', 'MENSAJERIA', 'DARK_KITCHENS'];
    const missing = allCategories.filter(cat => !input.existingBusinessTypes.includes(cat));

    return missing.map(cat => ({
      category: cat,
      potentialProfit: 'ALTO',
      urgency: Math.floor(Math.random() * 5) + 1
    }));
  }
);
