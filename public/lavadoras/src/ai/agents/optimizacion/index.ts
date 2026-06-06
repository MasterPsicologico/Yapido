'use server';
/**
 * @fileOverview Agente de Optimización - El motor de eficiencia del sistema.
 */
import { optimizationAgentPrompt } from './prompts/main';
import { OptimizationAgentInput, OptimizationAgentOutput } from './schema';

export async function optimizacionAgent(input: OptimizationAgentInput): Promise<OptimizationAgentOutput> {
  const { output } = await optimizationAgentPrompt(input);
  return output!;
}
