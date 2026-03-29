
'use server';
/**
 * @fileOverview Agente Cliente - Orquestador Maestro de Pedidos.
 */
import { ai } from '@/ai/genkit';
import { ClienteAgentInputSchema, ClienteAgentOutputSchema } from './schema';
import { clienteAgentPrompt } from './prompts/main';
import { validateAddressTool } from './tools/validate-address';
import { calculateTotalTool } from './tools/calculate-total';
import { createOrderTool } from './tools/create-order';
import { getNearbyStoresTool } from './tools/get-nearby-stores';

export async function clienteAgent(input: any) {
  const result = await ai.generate({
    prompt: clienteAgentPrompt(input),
    tools: [
      validateAddressTool,
      calculateTotalTool,
      createOrderTool,
      getNearbyStoresTool
    ],
    config: {
      temperature: 0.2, // Baja temperatura para precisión logística
    }
  });

  return result.output as any;
}

export * from './schema';
