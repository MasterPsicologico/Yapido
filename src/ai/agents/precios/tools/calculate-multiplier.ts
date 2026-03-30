import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para calcular multiplicadores dinámicos.
 */

export const calculateMultiplierTool = ai.defineTool(
  {
    name: 'precios:calculateMultiplier',
    description: 'Calcula los multiplicadores de demanda, clima y tráfico.',
    inputSchema: z.object({
      demandLevel: z.string(),
      weather: z.string(),
      trafficLevel: z.number(),
      availableDrivers: z.number(),
    }),
    outputSchema: z.object({
      demandMult: z.number(),
      weatherMult: z.number(),
      trafficMult: z.number(),
      combinedMult: z.number(),
    }),
  },
  async (input) => {
    let demandMult = 1.0;
    if (input.demandLevel === 'low') demandMult = 0.8;
    if (input.demandLevel === 'high') demandMult = 1.3;
    if (input.demandLevel === 'very_high') demandMult = 1.6;
    if (input.availableDrivers < 3) demandMult += 0.2;

    let weatherMult = 1.0;
    if (input.weather === 'rain') weatherMult = 1.3;
    if (input.weather === 'storm') weatherMult = 1.8;

    const trafficMult = input.trafficLevel > 1.3 ? 1.15 : 1.0;

    return {
      demandMult,
      weatherMult,
      trafficMult,
      combinedMult: demandMult * weatherMult * trafficMult
    };
  }
);
