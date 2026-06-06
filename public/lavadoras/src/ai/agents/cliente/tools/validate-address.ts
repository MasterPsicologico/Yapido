import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para validar direcciones de entrega.
 */

export const validateAddressTool = ai.defineTool(
  {
    name: 'cliente:validateAddress',
    description: 'Valida si una dirección es apta para entrega y está dentro del rango de cobertura.',
    inputSchema: z.object({ address: z.string() }),
    outputSchema: z.object({ 
      isValid: z.boolean(), 
      formattedAddress: z.string(), 
      zoneId: z.string().optional(),
      reason: z.string().optional()
    }),
  },
  async (input) => {
    // Simulación de lógica de validación con coordenadas o API de mapas
    const isValid = input.address.length > 10; 
    return {
      isValid,
      formattedAddress: input.address.toUpperCase(),
      zoneId: isValid ? 'ZONE-CENTRO' : undefined,
      reason: isValid ? undefined : 'Dirección demasiado corta o ambigua.'
    };
  }
);
