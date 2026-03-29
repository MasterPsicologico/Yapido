
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para enviar correos electrónicos (Facturas/Reportes).
 */

export const sendEmailTool = ai.defineTool(
  {
    name: 'notificaciones:sendEmail',
    description: 'Envía un correo electrónico formal para facturación o resúmenes.',
    inputSchema: z.object({
      email: z.string(),
      subject: z.string(),
      htmlBody: z.string(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
  },
  async (input) => {
    // Simulación de SendGrid o Amazon SES
    console.log(`[EMAIL] Enviando a ${input.email}: ${input.subject}`);
    return { success: true };
  }
);
