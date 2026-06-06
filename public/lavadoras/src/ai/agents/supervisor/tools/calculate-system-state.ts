import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para calcular el estado de salud del sistema global.
 * Fórmula: Score = (Disponibilidad * 0.4) + (Eficiencia * 0.3) - (Fraude * 0.3)
 */

export const calculateSystemStateTool = ai.defineTool(
  {
    name: 'supervisor:calculateSystemState',
    description: 'Calcula un puntaje de salud del sistema basado en métricas operativas.',
    inputSchema: z.object({
      activeOrders: z.number(),
      availableDrivers: z.number(),
      fraudAlerts: z.number(),
      cancellationRate: z.number(),
    }),
    outputSchema: z.object({
      healthScore: z.number(),
      status: z.string(),
      alertLevel: z.enum(['green', 'yellow', 'red']),
    }),
  },
  async (input) => {
    // Lógica simplificada de salud del sistema
    const driverRatio = input.availableDrivers / (input.activeOrders || 1);
    const availabilityScore = Math.min(driverRatio * 50, 100);
    const efficiencyScore = Math.max(100 - input.cancellationRate, 0);
    const fraudPenalty = input.fraudAlerts * 20;

    const healthScore = Math.max((availabilityScore * 0.4) + (efficiencyScore * 0.3) - (fraudPenalty * 0.3), 0);

    return {
      healthScore,
      status: healthScore > 80 ? 'EXCELENTE' : healthScore > 50 ? 'ESTABLE' : 'CRÍTICO',
      alertLevel: (healthScore > 80 ? 'green' : healthScore > 50 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red',
    };
  }
);
