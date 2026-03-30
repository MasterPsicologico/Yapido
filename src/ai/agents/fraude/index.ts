'use server';
/**
 * @fileOverview Agente Antifraude - El Escudo de Seguridad de la Plataforma.
 */
import { fraudAgentPrompt } from './prompts/main';
import { FraudAgentInput, FraudAgentOutput } from './schema';

export async function fraudeAgent(input: FraudAgentInput): Promise<FraudAgentOutput> {
  const { output } = await fraudAgentPrompt(input);
  return output!;
}
