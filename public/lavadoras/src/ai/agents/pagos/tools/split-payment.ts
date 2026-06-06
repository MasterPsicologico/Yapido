import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para calcular la división de fondos (Split logic).
 */

export const splitPaymentTool = ai.defineTool(
  {
    name: 'pagos:splitPayment',
    description: 'Calcula la división exacta del dinero entre tienda, repartidor y plataforma.',
    inputSchema: z.object({
      totalAmount: z.number(),
      deliveryFee: z.number(),
    }),
    outputSchema: z.object({
      storeAmount: z.number(),
      driverAmount: z.number(),
      platformCommission: z.number(),
      promoFund: z.number(),
    }),
  },
  async (input) => {
    const storeAmount = input.totalAmount - input.deliveryFee;
    const driverAmount = Math.round(input.deliveryFee * 0.70);
    const platformCommission = Math.round(input.deliveryFee * 0.25);
    const promoFund = Math.round(input.deliveryFee * 0.05);

    return {
      storeAmount,
      driverAmount,
      platformCommission,
      promoFund
    };
  }
);
