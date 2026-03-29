'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para registrar un nuevo ticket de soporte en el sistema.
 */

export const createTicketTool = ai.defineTool(
  {
    name: 'soporte:createTicket',
    description: 'Registra un nuevo incidente en la base de datos de soporte.',
    inputSchema: z.object({
      orderId: z.string(),
      type: z.string(),
      priority: z.string(),
      description: z.string(),
      reportedBy: z.string(),
    }),
    outputSchema: z.object({
      ticketId: z.string(),
      status: z.string(),
    }),
  },
  async (input) => {
    const ticketId = `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    console.log(`[SOPORTE] Nuevo ticket creado: ${ticketId} para orden ${input.orderId}`);
    return {
      ticketId,
      status: 'OPEN'
    };
  }
);
