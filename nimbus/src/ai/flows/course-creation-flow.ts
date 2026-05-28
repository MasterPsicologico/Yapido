'use server';

/**
 * @fileOverview A multi-step AI flow for generating a complete, illustrated course from a single topic.
 * This version uses a sequential approach to avoid server timeouts and resource exhaustion.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CourseStructureSchema, ChapterContentInputSchema, ChapterContentOutputSchema, ImagePromptInputSchema, ImagePromptOutputSchema } from '@/lib/types';

// --- INPUT SCHEMA ---
const GenerateCourseInputSchema = z.object({
  topic: z.string().describe('El tema principal para el curso.'),
});


// --- 1. STRUCTURE GENERATION ---

const structureGenerationPrompt = ai.definePrompt({
  name: 'generateCourseStructurePrompt',
  input: { schema: GenerateCourseInputSchema },
  output: { schema: CourseStructureSchema },
  prompt: `Eres un diseñador instruccional experto. Tu tarea es tomar un tema y estructurarlo en un curso completo y coherente.

Tema: "{{topic}}"

Crea un plan de estudios detallado que incluya:
1.  Un título atractivo para el curso.
2.  Una lista de 3 a 5 módulos, cada uno cubriendo un aspecto fundamental del tema.
3.  Dentro de cada módulo, una lista de 3 a 5 capítulos específicos (solo títulos).

Asegúrate de que la progresión sea lógica, desde los fundamentos hasta los conceptos más avanzados. La salida debe ser un objeto JSON que se ajuste al esquema proporcionado.
`,
});

export const generateCourseStructure = ai.defineFlow({
    name: 'generateCourseStructureFlow',
    inputSchema: GenerateCourseInputSchema,
    outputSchema: CourseStructureSchema,
}, async ({ topic }) => {
    const { output } = await structureGenerationPrompt({ topic });
    if (!output) throw new Error('No se pudo generar la estructura del curso.');
    return output;
});


// --- 2. CONTENT GENERATION (FOR A SINGLE CHAPTER) ---

const contentGenerationPrompt = ai.definePrompt({
  name: 'generateChapterContentPrompt',
  input: { schema: ChapterContentInputSchema },
  output: { schema: ChapterContentOutputSchema },
  prompt: `Eres un educador y escritor experto. Tu tarea es escribir el contenido completo para un capítulo de un curso online. El texto debe ser claro, atractivo, informativo y estar en formato Markdown.

**Curso:** "{{courseTitle}}"
**Módulo:** "{{moduleTitle}}"
**Capítulo a desarrollar:** "{{chapterTitle}}"

Escribe un contenido completo de al menos 400 palabras para este capítulo. Incluye explicaciones detalladas, ejemplos claros y, si es apropiado, una pequeña actividad práctica al final. NO incluyas el título del capítulo en el contenido.`,
});

export const generateChapterContent = ai.defineFlow({
    name: 'generateChapterContentFlow',
    inputSchema: ChapterContentInputSchema,
    outputSchema: ChapterContentOutputSchema,
}, async (input) => {
    const { output } = await contentGenerationPrompt(input);
    if (!output) throw new Error('No se pudo generar el contenido del capítulo.');
    return output;
});


// --- 3. IMAGE PROMPT GENERATION ---

const imagePromptGenerationPrompt = ai.definePrompt({
    name: 'generateImagePromptForModule',
    input: { schema: ImagePromptInputSchema },
    output: { schema: ImagePromptOutputSchema },
    prompt: `Eres un director de arte conceptual. Tu tarea es crear un prompt para un modelo de generación de imágenes (estilo DALL-E, Midjourney) que represente visualmente un concepto educativo de forma abstracta y bella.

**Tema a ilustrar:** "{{title}}"
**Contexto:** {{context}}

Genera un prompt detallado, evocador y artístico. Piensa en metáforas visuales.
**Ejemplo:** Para "Introducción a los Sueños Lúcidos", un buen prompt sería: "Una silueta humana de cristal flotando en una nebulosa cósmica, con hilos de luz dorada conectando su mente a estrellas y planetas etiquetados como 'Conciencia', 'Control' y 'Memoria'. Estilo de renderizado 8k, fotorrealista, etéreo."
`,
});


export const generateImagePrompt = ai.defineFlow({
    name: 'generateImagePromptFlow',
    inputSchema: ImagePromptInputSchema,
    outputSchema: ImagePromptOutputSchema,
}, async (input) => {
    const { output } = await imagePromptGenerationPrompt(input);
    if (!output) throw new Error('No se pudo generar el prompt de imagen.');
    return output;
});
