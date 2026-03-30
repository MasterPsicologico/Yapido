'use server';
/**
 * @fileOverview Agente de Predicción - El Futuro de la Plataforma.
 */
import { predictionAgentPrompt } from './prompts/main';
import { PredictionAgentInput, PredictionAgentOutput } from './schema';

export async function prediccionAgent(input: PredictionAgentInput): Promise<PredictionAgentOutput> {
  const { output } = await predictionAgentPrompt(input);
  return output!;
}
