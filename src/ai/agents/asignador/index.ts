
'use server';
/**
 * @fileOverview Agente Asignador - Cerebro del Matchmaking Logístico.
 */
import { ai } from '@/ai/genkit';
import { asignadorAgentPrompt } from './prompts/main';
import { calculateScoreTool } from './tools/calculate-score';
import { findDriversTool } from './tools/find-drivers';

export async function asignadorAgent(input: any) {
  const result = await ai.generate({
    prompt: asignadorAgentPrompt(input),
    tools: [
      calculateScoreTool,
      findDriversTool
    ],
    config: {
      temperature: 0.1, // Máxima precisión matemática
    }
  });

  return result.output as any;
}

export * from './schema';
