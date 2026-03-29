
'use server';
/**
 * @fileOverview Agente de Predicción - El Futuro de la Plataforma.
 */
import { ai } from '@/ai/genkit';
import { predictionAgentPrompt } from './prompts/main';
import { predictDemandTool } from './tools/predict-demand';
import { analyzeHistoryTool } from './tools/analyze-history';
import { PredictionInputSchema, PredictionOutputSchema } from './schema';

export async function prediccionAgent(input: any) {
  const result = await ai.generate({
    prompt: predictionAgentPrompt(input),
    tools: [
      predictDemandTool,
      analyzeHistoryTool
    ],
    config: {
      temperature: 0.2, // Equilibrio entre precisión y detección de patrones
    }
  });

  return result.output as any;
}

export * from './schema';
