
'use server';
/**
 * @fileOverview Agente de Pagos - El Controlador Financiero.
 */
import { ai } from '@/ai/genkit';
import { pagosAgentPrompt } from './prompts/main';
import { splitPaymentTool } from './tools/split-payment';
import { verifyPaymentTool } from './tools/verify-payment';

export async function pagosAgent(input: any) {
  const result = await ai.generate({
    prompt: pagosAgentPrompt(input),
    tools: [
      splitPaymentTool,
      verifyPaymentTool
    ],
    config: {
      temperature: 0.0, // Cero tolerancia al error en finanzas
    }
  });

  return result.output as any;
}
