
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para calcular el total de un pedido.
 */

export const calculateTotalTool = ai.defineTool(
  {
    name: 'cliente:calculateTotal',
    description: 'Calcula el subtotal, descuentos y total final de un pedido.',
    inputSchema: z.object({ 
      items: z.array(z.object({ price: z.number(), quantity: z.number() })),
      couponCode: z.string().optional()
    }),
    outputSchema: z.object({ 
      subtotal: z.number(), 
      discount: z.number(), 
      total: z.number() 
    }),
  },
  async (input) => {
    const subtotal = input.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    let discount = 0;
    if (input.couponCode === 'BIENVENIDO') discount = subtotal * 0.1;
    
    return {
      subtotal,
      discount,
      total: subtotal - discount
    };
  }
);
