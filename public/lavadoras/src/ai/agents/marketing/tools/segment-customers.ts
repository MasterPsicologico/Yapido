import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para segmentar la base de datos de usuarios.
 */

export const segmentCustomersTool = ai.defineTool(
  {
    name: 'marketing:segmentCustomers',
    description: 'Clasifica a los usuarios según su frecuencia de compra y gasto total.',
    inputSchema: z.object({
      minOrders: z.number().optional(),
      daysInactive: z.number().optional(),
    }),
    outputSchema: z.object({
      count: z.number(),
      segmentName: z.string(),
      sampleUids: z.array(z.string()),
    }),
  },
  async (input) => {
    // Simulación de consulta analítica de usuarios
    return {
      count: 450,
      segmentName: input.daysInactive ? 'USUARIOS_INACTIVOS' : 'USUARIOS_GENERALES',
      sampleUids: ['USER-001', 'USER-002', 'USER-003']
    };
  }
);
