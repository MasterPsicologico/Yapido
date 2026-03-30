'use server';
/**
 * @fileOverview Agente Marketing - El Motor de Crecimiento.
 */
import { marketingAgentPrompt } from './prompts/main';
import { MarketingAgentInput, MarketingAgentOutput } from './schema';

export async function marketingAgent(input: MarketingAgentInput): Promise<MarketingAgentOutput> {
  const { output } = await marketingAgentPrompt(input);
  return output!;
}
