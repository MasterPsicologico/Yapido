import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para crear físicamente el pedido en la base de datos.
 */

export const createOrderTool = ai.defineTool(
  {
    name: 'cliente:createOrder',
    description: 'Registra un nuevo pedido en el sistema una vez validado todo.',
    inputSchema: z.object({ 
      userId: z.string(),
      storeId: z.string(),
      items: z.array(z.any()),
      total: z.number(),
      address: z.string(),
      paymentMethod: z.enum(['cash', 'digital'])
    }),
    outputSchema: z.object({ orderId: z.string(), success: z.boolean() }),
  },
  async (input) => {
    // Aquí iría la lógica real de Firestore addDoc
    const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    return { orderId, success: true };
  }
);
