
'use server';
/**
 * @fileOverview Agente Analytics - El Cerebro de Datos.
 */
import { ai } from '@/ai/genkit';
import { analyticsAgentPrompt } from './prompts/main';
import { calculateMetricsTool } from './tools/calculate-metrics';
import { analyzePerformanceTool } from './tools/analyze-performance';
import { AnalyticsAgentInputSchema, AnalyticsAgentOutputSchema } from './schema';

export async function analyticsAgent(input: any) {
  const result = await ai.generate({
    prompt: analyticsAgentPrompt(input),
    tools: [
      calculateMetricsTool,
      analyzePerformanceTool
    ],
    config: {
      temperature: 0.1, // Precisión analítica absoluta
    }
  });

  return result.output as any;
}
