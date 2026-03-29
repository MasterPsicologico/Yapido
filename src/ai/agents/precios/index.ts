
'use server';
/**
 * @fileOverview Agente de Precios Dinámicos - El controlador de ingresos.
 */
import { ai } from '@/ai/genkit';
import { pricingAgentPrompt } from './prompts/main';
import { calculateMultiplierTool } from './tools/calculate-multiplier';
import { PricingAgentInputSchema, PricingAgentOutputSchema } from './schema';

export async function preciosAgent(input: any) {
  const result = await ai.generate({
    prompt: pricingAgentPrompt(input),
    tools: [
      calculateMultiplierTool
    ],
    config: {
      temperature: 0.1, // Precisión financiera
    }
  });

  return result.output as any;
}

export * from './schema';
