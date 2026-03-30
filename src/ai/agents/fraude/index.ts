
'use server';
/**
 * @fileOverview Agente Antifraude - El Escudo de Seguridad de la Plataforma.
 */
import { ai } from '@/ai/genkit';
import { fraudAgentPrompt } from './prompts/main';
import { calculateRiskTool } from './tools/calculate-risk';
import { gpsCheckerTool } from './tools/gps-checker';

export async function fraudeAgent(input: any) {
  const result = await ai.generate({
    prompt: fraudAgentPrompt(input),
    tools: [
      calculateRiskTool,
      gpsCheckerTool
    ],
    config: {
      temperature: 0.0, // Cero tolerancia a la alucinación en seguridad
    }
  });

  return result.output as any;
}
