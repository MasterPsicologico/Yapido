
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para verificar el estado de una transacción con pasarelas externas.
 */

export const verifyPaymentTool = ai.defineTool(
  {
    name: 'pagos:verifyPayment',
    description: 'Verifica con el procesador de pagos si el monto fue capturado exitosamente.',
    inputSchema: z.object({
      orderId: z.string(),
      amount: z.number(),
      method: z.string(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      transactionId: z.string().optional(),
      errorCode: z.string().optional(),
    }),
  },
  async (input) => {
    // Simulación de respuesta de pasarela (Nequi/PSE/Card)
    const isSuccessful = Math.random() > 0.05; // 95% de éxito en simulación
    
    return {
      success: isSuccessful,
      transactionId: isSuccessful ? `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined,
      errorCode: isSuccessful ? undefined : 'INSUFFICIENT_FUNDS'
    };
  }
);
