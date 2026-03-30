'use server';
/**
 * @fileOverview Agente Analytics - El Cerebro de Datos.
 */
import { analyticsAgentPrompt } from './prompts/main';
import { AnalyticsAgentInput, AnalyticsAgentOutput } from './schema';

export async function analyticsAgent(input: AnalyticsAgentInput): Promise<AnalyticsAgentOutput> {
  const { output } = await analyticsAgentPrompt(input);
  return output!;
}
