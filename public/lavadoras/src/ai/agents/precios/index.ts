'use server';
/**
 * @fileOverview Agente de Precios Dinámicos - El controlador de ingresos.
 */
import { pricingAgentPrompt } from './prompts/main';
import { PricingAgentInput, PricingAgentOutput } from './schema';

export async function preciosAgent(input: PricingAgentInput): Promise<PricingAgentOutput> {
  const { output } = await pricingAgentPrompt(input);
  return output!;
}
