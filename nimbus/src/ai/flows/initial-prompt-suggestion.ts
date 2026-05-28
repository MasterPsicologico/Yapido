
'use server';

/**
 * @fileOverview A flow that suggests initial prompts to new users.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PromptSuggestionSchema = z.object({
  text: z.string().describe('Un prompt de inicio atractivo y que invite a la reflexión.'),
  category: z.enum([
      "Mente y Cognición",
      "Corazón y Emociones",
      "Relaciones y Vínculos",
      "Trabajo y Propósito",
      "Exploración Profunda",
      "Desahogo",
      "Ansiedad",
      "Autoestima",
      "Comunicación",
      "Duelo",
      "Productividad",
      "Hábitos"
  ]).describe('La categoría principal a la que pertenece el prompt.'),
});

const InitialPromptsOutputSchema = z.object({
  prompts: z.array(PromptSuggestionSchema).describe('Una lista de sugerencias de prompts para que el usuario pueda empezar.'),
});

export type InitialPromptsOutput = z.infer<typeof InitialPromptsOutputSchema>;

const promptTemplate = `Eres un asistente de IA útil. Tu tarea es generar una lista de prompts de inicio para un chatbot de psicología llamado Nimbus.
Los prompts deben ser diversos, atractivos, y cubrir un rango de temas como ansiedad, estrés, relaciones, autoestima, propósito, y desahogo emocional.
Debes generar exactamente la cantidad de prompts que se te pida.

Instrucción actual: "{{prompt}}"

Devuelve los prompts como un array JSON de objetos, donde cada objeto tiene los campos "text" y "category".

Asegúrate de que el array contenga la cantidad solicitada de sugerencias y que las categorías sean variadas.
`;

export const initialPromptSuggestionFlow = ai.defineFlow(
  {
    name: 'initialPromptSuggestionFlow',
    inputSchema: z.string(),
    outputSchema: InitialPromptsOutputSchema,
  },
  async (prompt) => {
    const { output } = await ai.generate({
        prompt: promptTemplate.replace('{{prompt}}', prompt),
        output: { schema: InitialPromptsOutputSchema },
        config: { temperature: 0.8 }
    });
    return output!;
  }
);
