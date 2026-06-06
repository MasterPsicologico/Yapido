'use server';
/**
 * @fileOverview Agente de Notificaciones - El Orquestador de la Comunicación.
 */
import { notificacionesAgentPrompt } from './prompts/main';
import { NotificacionesAgentInput, NotificacionesAgentOutput } from './schema';

export async function notificacionesAgent(input: NotificacionesAgentInput): Promise<NotificacionesAgentOutput> {
  const { output } = await notificacionesAgentPrompt(input);
  return output!;
}
