
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para enviar notificaciones Push.
 */

export const sendPushTool = ai.defineTool(
  {
    name: 'notificaciones:sendPush',
    description: 'Envía una notificación push al dispositivo móvil del usuario.',
    inputSchema: z.object({
      userId: z.string(),
      title: z.string(),
      body: z.string(),
      data: z.any().optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      messageId: z.string().optional(),
    }),
  },
  async (input) => {
    // Simulación de Firebase Cloud Messaging (FCM)
    console.log(`[PUSH] Enviando a ${input.userId}: ${input.title} - ${input.body}`);
    return {
      success: true,
      messageId: `PUSH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
  }
);
