
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para calcular métricas financieras globales.
 */

export const calculateMetricsTool = ai.defineTool(
  {
    name: 'analytics:calculateMetrics',
    description: 'Calcula ingresos, costos y beneficios netos del periodo.',
    inputSchema: z.object({
      orderSummaries: z.array(z.object({
        total: z.number(),
        cost: z.number(),
        status: z.string(),
      })),
    }),
    outputSchema: z.object({
      revenue: z.number(),
      costs: z.number(),
      profit: z.number(),
      margin: z.number(),
    }),
  },
  async (input) => {
    const deliveredOrders = input.orderSummaries.filter(o => o.status === 'delivered');
    
    const revenue = deliveredOrders.reduce((acc, curr) => acc + curr.total, 0);
    const costs = deliveredOrders.reduce((acc, curr) => acc + curr.cost, 0);
    const profit = revenue - costs;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      revenue,
      costs,
      profit,
      margin: Math.round(margin * 100) / 100
    };
  }
);
