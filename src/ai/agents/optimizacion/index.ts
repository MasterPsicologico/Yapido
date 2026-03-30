
'use server';
/**
 * @fileOverview Agente de Optimización - El motor de eficiencia del sistema.
 */
import { ai } from '@/ai/genkit';
import { optimizationAgentPrompt } from './prompts/main';
import { optimizeBatchingTool } from './tools/optimize-batching';
import { optimizeDriverPositionTool } from './tools/optimize-driver-position';

export async function optimizacionAgent(input: any) {
  const result = await ai.generate({
    prompt: optimizationAgentPrompt(input),
    tools: [
      optimizeBatchingTool,
      optimizeDriverPositionTool
    ],
    config: {
      temperature: 0.2, // Equilibrio entre lógica pura y búsqueda de soluciones creativas
    }
  });

  return result.output as any;
}
