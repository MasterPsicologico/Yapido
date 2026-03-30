'use server';
/**
 * @fileOverview Agente Cliente - Orquestador Maestro de Pedidos.
 */
import { clienteAgentPrompt } from './prompts/main';
import { ClienteAgentInput, ClienteAgentOutput } from './schema';

export async function clienteAgent(input: ClienteAgentInput): Promise<ClienteAgentOutput> {
  const { output } = await clienteAgentPrompt(input);
  return output!;
}
