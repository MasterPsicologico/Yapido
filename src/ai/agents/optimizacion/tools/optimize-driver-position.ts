import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para recomendar el reposicionamiento preventivo de la flota.
 */

export const optimizeDriverPositionTool = ai.defineTool(
  {
    name: 'optimizacion:optimizeDriverPosition',
    description: 'Determina hacia dónde mover a los repartidores libres para balancear la carga.',
    inputSchema: z.object({
      zoneDemands: z.array(z.object({ zone: z.string(), demandScore: z.number(), driverCount: z.number() })),
    }),
    outputSchema: z.array(z.object({
      targetZone: z.string(),
      requiredDrivers: z.number(),
      priority: z.string(),
    })),
  },
  async (input) => {
    // Identificar zonas con (demandScore / driverCount) alto
    return input.zoneDemands
      .filter(z => (z.demandScore / (z.driverCount || 1)) > 1.5)
      .map(z => ({
        targetZone: z.zone,
        requiredDrivers: Math.ceil(z.demandScore / 2),
        priority: 'ALTA'
      }));
  }
);
