'use server';
/**
 * @fileOverview Agente Growth - El Arquitecto del Futuro.
 */
import { growthAgentPrompt } from './prompts/main';
import { GrowthAgentInput, GrowthAgentOutput } from './schema';

export async function growthAgent(input: GrowthAgentInput): Promise<GrowthAgentOutput> {
  const { output } = await growthAgentPrompt(input);
  return output!;
}
