'use server';
/**
 * @fileOverview Agente de Soporte - El Resolutor de Conflictos.
 */
import { soporteAgentPrompt } from './prompts/main';
import { SupportAgentInput, SupportAgentOutput } from './schema';

export async function soporteAgent(input: SupportAgentInput): Promise<SupportAgentOutput> {
  const { output } = await soporteAgentPrompt(input);
  return output!;
}
