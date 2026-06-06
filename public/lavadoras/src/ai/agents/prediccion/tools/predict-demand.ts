import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para predecir la demanda futura.
 * Fórmula: D = f(H, Z, W, T)
 */

export const predictDemandTool = ai.defineTool(
  {
    name: 'prediccion:predictDemand',
    description: 'Calcula la probabilidad de demanda basada en hora, zona y clima.',
    inputSchema: z.object({
      hour: z.number(),
      zone: z.string(),
      isWeekend: z.boolean(),
      weather: z.string(),
    }),
    outputSchema: z.object({
      probability: z.number(),
      demandLevel: z.string(),
      expectedOrderVolume: z.number(),
    }),
  },
  async (input) => {
    let baseProb = 0.3;
    
    // Horas pico de comida
    if ((input.hour >= 11 && input.hour <= 14) || (input.hour >= 18 && input.hour <= 21)) {
      baseProb += 0.4;
    }

    if (input.weather === 'rain') baseProb += 0.2;
    if (input.isWeekend) baseProb += 0.1;

    const prob = Math.min(baseProb, 1.0);

    return {
      probability: prob,
      demandLevel: prob > 0.8 ? 'VERY_HIGH' : prob > 0.6 ? 'HIGH' : prob > 0.4 ? 'NORMAL' : 'LOW',
      expectedOrderVolume: Math.round(prob * 50) // Simulación de volumen
    };
  }
);
