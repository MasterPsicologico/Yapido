
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para agregar datos de todos los agentes.
 */

export const monitorSystemTool = ai.defineTool(
  {
    name: 'supervisor:monitorSystem',
    description: 'Recopila el estado actual de todos los departamentos operativos.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      logistics: z.string(),
      finance: z.string(),
      security: z.string(),
      support: z.string(),
    }),
  },
  async () => {
    // Simulación de agregación de estados de otros agentes
    return {
      logistics: 'Fluyendo con normalidad',
      finance: 'Conciliación al 98%',
      security: '2 alertas menores de GPS',
      support: 'Sin tickets críticos pendientes'
    };
  }
);
