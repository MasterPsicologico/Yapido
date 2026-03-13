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
  prompt: `Eres un experto en neuro-copywriting y ventas de respuesta directa. Tu misión es crear una descripción de producto QUIRÚRGICA: breve, potente y diseñada para cerrar la venta de inmediato.

ESTRUCTURA OBLIGATORIA:
1. El Gancho: Una primera frase que destaque el mayor beneficio emocional o práctico.
2. El Valor: Una segunda frase corta que resalte la calidad o exclusividad.
3. Límite: Máximo 30 palabras en total.

Producto: {{{productName}}}

{{#if keyFeatures}}Atributos clave:
{{#each keyFeatures}}- {{{this}}}
{{/each}}
{{/if}}

{{#if existingDescription}}Base: {{{existingDescription}}}{{/if}}

Evita adjetivos vacíos. Usa palabras que activen la decisión de compra. El cliente debe sentir que es la mejor opción de la tienda ahora mismo.`,
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
