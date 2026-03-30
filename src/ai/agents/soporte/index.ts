
'use server';
/**
 * @fileOverview Agente de Soporte - El Resolutor de Conflictos.
 */
import { ai } from '@/ai/genkit';
import { supportAgentPrompt } from './prompts/main';
import { createTicketTool } from './tools/create-ticket';
import { analyzeIssueTool } from './tools/analyze-issue';

export async function soporteAgent(input: any) {
  const result = await ai.generate({
    prompt: supportAgentPrompt(input),
    tools: [
      createTicketTool,
      analyzeIssueTool
    ],
    config: {
      temperature: 0.3, // Equilibrio entre empatía y reglas fijas
    }
  });

  return result.output as any;
}
