
'use server';
/**
 * @fileOverview Agente de Vision IA para escaneo de recibos y facturas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScanReceiptInputSchema = z.object({
  photoDataUri: z.string().describe("La foto del recibo como data URI base64."),
});

const ScanReceiptOutputSchema = z.object({
  items: z.array(z.object({
    description: z.string(),
    amount: z.number(),
    category: z.string().describe("Categoría sugerida para este ítem."),
  })),
  total: z.number(),
  currency: z.string().optional(),
});

export async function scanReceipt(input: { photoDataUri: string }) {
  const { output } = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    input: input,
    output: { schema: ScanReceiptOutputSchema },
    prompt: `Analiza esta foto de un recibo o factura financiera. 
    1. Extrae cada producto o servicio comprado con su precio.
    2. Asigna una categoría lógica de UNA SOLA PALABRA a cada ítem (ej: comida, transporte, salud, hogar).
    3. Calcula el total de la factura.
    
    Foto: {{media url=photoDataUri}}`,
  });
  return output!;
}
