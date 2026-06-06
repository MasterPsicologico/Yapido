'use server';
/**
 * @fileOverview Agente de Pagos - El Controlador Financiero.
 */
import { pagosAgentPrompt } from './prompts/main';
import { PagosAgentInput, PagosAgentOutput } from './schema';

export async function pagosAgent(input: PagosAgentInput): Promise<PagosAgentOutput> {
  const { output } = await pagosAgentPrompt(input);
  return output!;
}
