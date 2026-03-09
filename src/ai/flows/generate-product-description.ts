'use server';
/**
 * @fileOverview A Genkit flow for generating attractive and detailed product descriptions using AI.
 *
 * - generateProductDescription - A function that handles the product description generation process.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('El nombre del producto.'),
  keyFeatures: z.array(z.string()).describe('Una lista de características clave del producto.'),
  existingDescription: z.string().optional().describe('Una descripción corta existente del producto, si la hay.'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  generatedDescription: z.string().describe('La descripción del producto generada por la IA.'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `Eres un experto en marketing y redacción de copias, especializado en crear descripciones de productos atractivas y optimizadas para la venta en español.

Genera una descripción detallada y persuasiva para el siguiente producto. La descripción debe resaltar las características clave y convencer al cliente de la calidad y el valor del producto.

Producto: {{{productName}}}

Características clave:
{{#each keyFeatures}}- {{{this}}}
{{/each}}

{{#if existingDescription}}Descripción existente (a mejorar y expandir): {{{existingDescription}}}{{/if}}

Crea una descripción que capture la atención y motive la compra, utilizando un lenguaje vibrante y centrado en los beneficios para el cliente.`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
