import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para enviar mensajes SMS de emergencia.
 */

export const sendSmsTool = ai.defineTool(
  {
    name: 'notificaciones:sendSms',
    description: 'Envía un mensaje SMS crítico cuando no hay conexión o es un aviso urgente.',
    inputSchema: z.object({
      phoneNumber: z.string(),
      text: z.string(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
  },
  async (input) => {
    // Simulación de Twilio o similar
    console.log(`[SMS] Enviando a ${input.phoneNumber}: ${input.text}`);
    return { success: true };
  }
);
