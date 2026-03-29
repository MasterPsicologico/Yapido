
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const processOrderFlow = ai.defineFlow(
  { name: 'cliente:processOrder', inputSchema: z.any(), outputSchema: z.any() },
  async (input) => {
    // Especialista en creación de pedidos
    return { success: true };
  }
);
