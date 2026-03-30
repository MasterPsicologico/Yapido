'use server';
/**
 * @fileOverview Agente Asignador - Cerebro del Matchmaking Logístico.
 */
import { asignadorAgentPrompt } from './prompts/main';
import { AsignadorAgentInput, AsignadorAgentOutput } from './schema';

export async function asignadorAgent(input: AsignadorAgentInput): Promise<AsignadorAgentOutput> {
  const { output } = await asignadorAgentPrompt(input);
  return output!;
}
