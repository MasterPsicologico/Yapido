
'use server';
/**
 * @fileOverview Agente de Notificaciones - El Orquestador de la Comunicación.
 */
import { ai } from '@/ai/genkit';
import { notificacionesAgentPrompt } from './prompts/main';
import { sendPushTool } from './tools/send-push';
import { sendSmsTool } from './tools/send-sms';
import { sendEmailTool } from './tools/send-email';
import { NotificacionesAgentInputSchema, NotificacionesAgentOutputSchema } from './schema';

export async function notificacionesAgent(input: any) {
  const result = await ai.generate({
    prompt: notificacionesAgentPrompt(input),
    tools: [
      sendPushTool,
      sendSmsTool,
      sendEmailTool
    ],
    config: {
      temperature: 0.3, // Consistencia en el tono de voz
    }
  });

  return result.output as any;
}

export * from './schema';
