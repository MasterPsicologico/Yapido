'use server';
/**
 * @fileOverview Agente de Rutas - Orquestador de Navegación y Tiempos.
 */
import { routingAgentPrompt } from './prompts/main';
import { RoutingAgentInput, RoutingAgentOutput } from './schema';

export async function rutasAgent(input: RoutingAgentInput): Promise<RoutingAgentOutput> {
  const { output } = await routingAgentPrompt(input);
  return output!;
}
