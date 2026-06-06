import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para optimizar la agrupación de pedidos (Batching).
 */

export const optimizeBatchingTool = ai.defineTool(
  {
    name: 'optimizacion:optimizeBatching',
    description: 'Calcula la viabilidad de agrupar múltiples pedidos para un solo repartidor.',
    inputSchema: z.object({
      activeOrdersInZone: z.number(),
      avgDistanceBetweenOrders: z.number(),
      driverAvailability: z.number(),
    }),
    outputSchema: z.object({
      shouldBatch: z.boolean(),
      batchSize: z.number(),
      estimatedCostReductionPercent: z.number(),
      riskOfDelayPercent: z.number(),
    }),
  },
  async (input) => {
    // Lógica: Si hay muchos pedidos y están cerca, agrupar.
    const shouldBatch = input.activeOrdersInZone > 5 && input.avgDistanceBetweenOrders < 1.5;
    const reduction = shouldBatch ? 25 : 0;
    
    return {
      shouldBatch,
      batchSize: shouldBatch ? 2 : 1,
      estimatedCostReductionPercent: reduction,
      riskOfDelayPercent: shouldBatch ? 10 : 0
    };
  }
);
