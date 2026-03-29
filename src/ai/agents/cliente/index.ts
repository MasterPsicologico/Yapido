
'use server';
/**
 * @fileOverview Agente Cliente - Orquestador de solicitudes de usuario.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ClienteAgentInputSchema = z.object({
  userId: z.string(),
  query: z.string(),
  context: z.any().optional(),
});

export async function clienteAgent(input: z.infer<typeof ClienteAgentInputSchema>) {
  // Punto de entrada para la lógica que proveerá el usuario
  return { status: 'ready', agent: 'cliente' };
}
