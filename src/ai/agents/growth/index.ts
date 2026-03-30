
'use server';
/**
 * @fileOverview Agente Growth - El Arquitecto del Futuro.
 */
import { ai } from '@/ai/genkit';
import { growthAgentPrompt } from './prompts/main';
import { analyzeExpansionTool } from './tools/analyze-expansion';
import { identifyPartnersTool } from './tools/identify-partners';
import { GrowthAgentInputSchema, GrowthAgentOutputSchema } from './schema';

export async function growthAgent(input: any) {
  const result = await ai.generate({
    prompt: growthAgentPrompt(input),
    tools: [
      analyzeExpansionTool,
      identifyPartnersTool
    ],
    config: {
      temperature: 0.3, // Equilibrio entre ambición y realismo financiero
    }
  });

  return result.output as any;
}

export * from './schema';
