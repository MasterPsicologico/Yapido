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
  existingDescription: z.string().optional().describe('Una descripción corta o idea base del producto.'),
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
  prompt: `Eres un Vendedor Maestro con un olfato quirúrgico para detectar qué hace especial a un producto. Tu misión es transformar el nombre y la idea base en una descripción irresistible que resalte las bondades y delicias del artículo.

INSTRUCCIONES DE VENTA:
1. Expansión Inteligente: Si el usuario te da una idea base corta (ej: "suero picante"), tú la expandes resaltando el sabor, la textura, la exclusividad o el beneficio real.
2. Longitud Adaptativa: No te limites a un número fijo de palabras. Escribe lo necesario para convencer al cliente, manteniendo siempre la agilidad y el impacto. Si el producto es sencillo, sé breve; si es especial, dale el espacio que merece.
3. El Tono: Eres persuasivo, elegante y directo. Resalta las bondades del objeto como si lo tuvieras en las manos y supieras que el cliente lo necesita ahora mismo.
4. Enfoque Quirúrgico: Identifica el atributo más interesante y conviértelo en el protagonista.

Producto: {{{productName}}}

{{#if existingDescription}}Base/Idea: {{{existingDescription}}}{{/if}}

{{#if keyFeatures}}Atributos clave para resaltar:
{{#each keyFeatures}}- {{{this}}}
{{/each}}
{{/if}}

Evita frases genéricas. Crea una experiencia de lectura que active el deseo de compra inmediato.`,
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
