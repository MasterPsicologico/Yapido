
'use server';
/**
 * @fileOverview Agente de Rutas - Orquestador de Navegación y Tiempos.
 */
import { ai } from '@/ai/genkit';
import { routingAgentPrompt } from './prompts/main';
import { calculateETATool } from './tools/calculate-eta';
import { getRouteTool } from './tools/get-route';
import { optimizeMultiRouteTool } from './tools/optimize-multi-route';

export async function rutasAgent(input: any) {
  const result = await ai.generate({
    prompt: routingAgentPrompt(input),
    tools: [
      calculateETATool,
      getRouteTool,
      optimizeMultiRouteTool
    ],
    config: {
      temperature: 0.1, // Precisión absoluta para navegación
    }
  });

  return result.output as any;
}
