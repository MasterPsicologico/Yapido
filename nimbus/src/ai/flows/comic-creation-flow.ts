

'use server';

/**
 * @fileOverview A multi-step AI flow for generating a complete comic strip from a single story idea.
 * This version uses a two-step process: first, a detailed script and character analysis,
 * then sequential panel generation for a robust and professional result.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
    GenerateComicInputSchema,
    ComicAnalysisSchema,
    ComicPageSchema,
    ComicCharacterSchema,
    GeneratedComicPageSchema,
} from '@/lib/types';
import { generateImageX } from '@/ai/flows/generate-image-x';

// --- Flow 1: Analyze Story, Choose Style, and Create Professional Script ---

const analysisPrompt = ai.definePrompt({
    name: 'comicAnalysisPrompt',
    input: { schema: GenerateComicInputSchema },
    output: { schema: ComicAnalysisSchema.omit({ style: true, styleSeed: true }) },
    prompt: `
        Eres un equipo de guionistas y directores de cine expertos en cómics. Tu misión es transformar una historia en un guion visual profesional y un plan de rodaje (shot list) para cada página.

        Sigue estrictamente estos pasos:

        PASO 1 – Casting y Fichas de Personaje:
        - Identifica al menos 2-3 personajes clave (principales y secundarios).
        - Para CADA personaje, crea una ficha de personaje ULTRA-DETALLADA. Incluye nombre, edad, género, etnia, complexión, rasgos faciales, peinado, color de ojos y VESTIMENTA BASE. Esta vestimenta DEBE ser consistente.

        PASO 2 – Guion y Cinematografía (Escena por Escena):
        - Divide la historia en 12 a 21 escenas (viñetas).
        - Para CADA escena, escribe:
            1. sceneTitle: Un título breve (ej: "El Encuentro Inesperado").
            2. narration: Una narración corta que describa la acción o el contexto.
            3. dialogue: Diálogo CLARO Y DIRECTO. Si un personaje habla, debe ser una sola línea de texto. Ejemplo: "DANIEL: No puedo creerlo.". La claridad es MÁXIMA prioridad. Si no hay diálogo, deja el campo vacío.
            4. **visualDescription (CRÍTICO - Plan de Rodaje):** Describe la escena como un director de cine. SÉ EXPLÍCITO sobre:
                - **Tipo de Plano:** (Close-up, Medium Shot, Wide Shot, Over-the-shoulder, etc.).
                - **Acción del Personaje:** ¿Qué está haciendo? (Ej: "Daniel se arrodilla, tocando la flor. Su expresión es de asombro."). ¡NUNCA "mirando al frente"!
                - **Interacción:** ¿Cómo interactúa con el entorno u otros personajes? (Ej: "La Sombra se cierne sobre él, extendiendo una mano con garras.").
                - **Entorno y Fondo:** Describe el escenario con detalles que aporten a la atmósfera.

        PASO 3 – Maquetación de Páginas:
        - Agrupa las escenas en "páginas".
        - **Varía los diseños de página de forma DRÁSTICA.** Es obligatorio que incluyas una mezcla de:
            - **Páginas de Impacto:** Una página que contenga UNA SOLA escena grande para momentos culminantes.
            - **Páginas de Secuencia:** Páginas con múltiples paneles (de 2 a 6) para secuencias de acción o diálogo.
        - No todas las páginas pueden tener el mismo número de paneles. La variedad es esencial.
        - Cada objeto 'página' debe contener:
            1. pageNumber: El número de la página.
            2. panelLayout: Una descripción del diseño (ej: "Una viñeta grande arriba, dos pequeñas abajo", "Rejilla de 2x2", "Página completa de una sola viñeta").
            3. scenes: Un array de las escenas (del PASO 2) que componen esta página.

        ${'{{{directorNotes}}}' ? `**NOTAS DEL DIRECTOR (PRIORIDAD ALTA):** Utiliza estas notas como guía principal para la atmósfera, el estilo y las decisiones narrativas.\n{{{directorNotes}}}\n` : ''}
        
        Historia del Usuario:
        "{{{story}}}"

        Genera el análisis completo, incluyendo el desglose cinematográfico en la 'visualDescription' de cada escena.
    `,
});

export const generateComicAnalysisFlow = ai.defineFlow(
    {
        name: 'generateComicAnalysisFlow',
        inputSchema: GenerateComicInputSchema,
        outputSchema: ComicAnalysisSchema,
    },
    async ({ story, directorNotes }) => {
        // Step 1: Generate the script and character sheets
        const { output: script } = await analysisPrompt({ story, directorNotes });
        if (!script || !script.characters || !script.pages) {
            throw new Error('La IA no pudo analizar la historia para crear el guion.');
        }

        // Step 2: Choose the art style (this remains a simple, good implementation)
        const styleDirectorPrompt = ai.definePrompt({
            name: 'comicStyleDirectorPrompt_v2',
            input: { schema: z.object({ story: z.string() }) },
            output: { schema: z.object({ style: z.string(), styleSeed: z.string() }) },
            prompt: `You are an expert art director. Based on the story's theme and mood, choose the MOST FITTING visual style and create a unique style seed.

        **STYLES:**
        - **Cinematic Anime Style**: For emotional, epic stories.
        - **Modern Western Comic Realism**: For action, drama.
        - **Classic American Comic (Silver Age)**: For heroic, retro stories.
        - **Manga/Anime Shonen Style**: For high-energy action.
        - **Gritty Noir Comic Style**: For mystery, crime.
        - **Photorealistic Fantasy Art**: For high-fantasy.
        - **Dark Fantasy (Souls-like) Style**: For dark, atmospheric fantasy.
        - **Watercolor Illustrative Style**: For gentle, dream-like stories.
        - **Cyberpunk Glitch Art**: For sci-fi stories.

        **STORY:** "{{story}}"

        **YOUR TASK:**
        1.  Choose one style from the list.
        2.  Create a unique, complex, and descriptive "Style Seed" string (5-10 words) that encapsulates the chosen style to ensure visual consistency. Example seed for Noir: "heavy-inked shadows, high-contrast black and white, film grain texture, selective color pops".

        Respond with ONLY the JSON object containing "style" and "styleSeed".`,
        });

        const { output: styleChoice } = await styleDirectorPrompt({ story });
        if (!styleChoice || !styleChoice.style || !styleChoice.styleSeed) {
             throw new Error('El Director de Arte no pudo elegir un estilo visual o generar un ADN estilístico.');
        }

        // Step 3: Combine and return
        return {
            ...script,
            style: styleChoice.style,
            styleSeed: styleChoice.styleSeed,
        };
    }
);


// --- Flow 2: Generate a Single Comic Page Image ---

const imagePagePromptGenerator = (page: z.infer<typeof ComicPageSchema>, characters: z.infer<typeof ComicCharacterSchema>[], style: string, styleSeed: string, directorNotes?: string) => {
    const characterReference = characters.map(c => 
        `[Character: ${c.name}, DETAILED Appearance: Eyes: ${c.appearance.eyes}, Hair: ${c.appearance.hair}, Face: ${c.appearance.face}, Build: ${c.appearance.build}, Outfit: ${c.appearance.outfit}]`
    ).join('; ');

    // Check if it's a single-panel splash page
    if (page.scenes.length === 1) {
        const scene = page.scenes[0];
        const visualDescription = scene.visualDescription || `A visually stunning cinematic shot of ${scene.sceneTitle || 'the scene'}.`;
        return `
          **DIRECTIVE:** Generate ONE SINGLE, FULL-PAGE, BORDERLESS IMAGE representing a cinematic splash page for a comic. This is for a moment of high impact.

          **ART STYLE:** ${style}
          **STYLE SEED (Visual DNA - Use This):** ${styleSeed}

          **MANDATORY CHARACTER BLUEPRINT (NON-NEGOTIABLE CONSISTENCY):**
          ${characterReference}
          *AI INSTRUCTION: YOU MUST RENDER THE CHARACTERS EXACTLY AS DESCRIBED. THIS IS A CONTRACT. ANY DEVIATION FROM THIS BLUEPRINT IS A COMPLETE FAILURE.*
          
          ${directorNotes ? `**DIRECTOR'S NOTES (HIGHEST PRIORITY):** ${directorNotes}\n` : ''}

          **SCENE BLUEPRINT (EXECUTE PRECISELY):**
          - Shot Type: ${(visualDescription).match(/Close-up|Medium Shot|Wide Shot|Over-the-shoulder/)?.[0] || 'Dynamic'}
          - Visuals: ${visualDescription}
          - Context (DO NOT DRAW): Narration: "${scene.narration}" Dialogue: "${scene.dialogue || 'None'}"

          **ABSOLUTE RULES OF COMPOSITION:**
          1.  **NO PANELS:** This is a single, unified image. DO NOT render any panel borders or gutters.
          2.  **No Fourth Wall:** The character MUST interact with their environment. The character MUST NOT look directly at the camera/viewer. This is a critical failure.
          3.  **ZERO TEXT:** DO NOT RENDER ANY TEXT, SPEECH BUBBLES, OR SOUND EFFECTS inside the image.

          **FINAL QUALITY CHECK (MANDATORY):**
          Review the generated image. Does it follow all rules? Is character consistency 100%? Is the scene dynamic and impactful? Fix any errors before outputting.
        `;
    }

    // Existing logic for multi-panel pages
    const panelDescriptions = page.scenes.map((scene, index) => {
        const visualDescription = scene.visualDescription || `A visually stunning cinematic shot of ${scene.sceneTitle || `panel ${index + 1}`}.`;
        return `
      ---
      PANEL ${index + 1} (Shot Type: ${(visualDescription).match(/Close-up|Medium Shot|Wide Shot|Over-the-shoulder/)?.[0] || 'Dynamic'}):
      - Visuals: ${visualDescription}
      - Context (NO DIBUJAR): Narration: "${scene.narration}" Dialogue: "${scene.dialogue || 'None'}"
        `;
    }).join('\n');

    return `
      **DIRECTIVE:** Generate ONE SINGLE IMAGE representing a complete comic book page composed of multiple distinct panels.

      **ART STYLE:** ${style}
      **STYLE SEED (Visual DNA - Use This):** ${styleSeed}

      **MANDATORY CHARACTER BLUEPRINT (NON-NEGOTIABLE CONSISTENCY):**
      ${characterReference}
      *AI INSTRUCTION: YOU MUST RENDER THE CHARACTERS EXACTLY AS DESCRIBED. THIS IS A CONTRACT. ANY DEVIATION FROM THIS BLUEPRINT IS A COMPLETE FAILURE.*

       ${directorNotes ? `**DIRECTOR'S NOTES (HIGHEST PRIORITY):** ${directorNotes}\n` : ''}

      **PAGE LAYOUT BLUEPRINT:**
      - Panel Grid: ${page.panelLayout}
      - Total Panels: ${page.scenes.length}

      **PANEL-BY-PANEL SHOT LIST (EXECUTE PRECISELY):**
      ${panelDescriptions}

      **ABSOLUTE RULES OF COMPOSITION:**
      1.  **Draw Panel Borders:** Clearly render the borders and gutters between all panels. The final image must look like a professionally laid-out comic page.
      2.  **Unique Panels Only:** Each panel must be a unique scene based on its specific "Visuals" description. DO NOT duplicate characters or backgrounds unless the description explicitly calls for it.
      3.  **No Fourth Wall:** Characters MUST interact with their environment or other characters. NO character should be looking directly at the camera/viewer. This is a critical failure.
      4.  **Background Cohesion:** Ensure background elements are consistent if they appear in consecutive panels from different angles.
      5.  **ZERO TEXT:** DO NOT RENDER ANY TEXT, SPEECH BUBBLES, OR SOUND EFFECTS inside the image panels.

      **FINAL QUALITY CHECK (MANDATORY):**
      Review the generated page. Does it follow all rules? Is character consistency 100%? Are all panels unique and dynamic? Fix any errors before outputting.
    `;
};


export const generateComicPageFlow = ai.defineFlow(
    {
        name: 'generateComicPageFlow',
        inputSchema: z.object({
            page: ComicPageSchema,
            characters: z.array(ComicCharacterSchema),
            style: z.string(),
            styleSeed: z.string(),
            directorNotes: z.string().optional(),
        }),
        outputSchema: GeneratedComicPageSchema.pick({ imageUrl: true, postGenerationDescription: true }),
    },
    async ({ page, characters, style, styleSeed, directorNotes }) => {
        const imageGenPrompt = imagePagePromptGenerator(page, characters, style, styleSeed, directorNotes);
        const { imageUrl } = await generateImageX({ prompt: imageGenPrompt });

        if (!imageUrl) {
            throw new Error(`La IA no pudo generar la imagen para la página: ${page.pageNumber}`);
        }
        
        // Let an AI describe the generated image for continuity
        const descriptionPrompt = ai.definePrompt({
            name: 'describeComicPanelPrompt',
            input: { schema: z.object({ imageUrl: z.string() }) },
            output: { schema: z.object({ description: z.string() }) },
            prompt: `Objectively describe the following image in one sentence. Focus on character positions, actions, and key objects. Example: "A man in a gray shirt kneels in a dark cave, looking at a single glowing flower."

Image: {{media url=imageUrl}}`
        });

        const { output: descriptionOutput } = await descriptionPrompt({ imageUrl });

        return { 
            imageUrl,
            postGenerationDescription: descriptionOutput?.description || "No se pudo generar una descripción de continuidad."
        };
    }
);


export const continueComicStoryFlow = ai.defineFlow({
    name: 'continueComicStoryFlow',
    inputSchema: z.object({
        previousAnalysis: ComicAnalysisSchema,
    }),
    outputSchema: ComicAnalysisSchema.omit({ style: true, styleSeed: true, characters: true }), // These are preserved from the original
    prompt: `Eres un guionista experto continuando una novela gráfica. A continuación se muestra el análisis completo del capítulo anterior, incluyendo la descripción de cada escena generada.

Tu ÚNICA tarea es escribir el SIGUIENTE capítulo. Debe ser una continuación directa de la última escena.

**HISTORIAL DEL UNIVERSO (NO MODIFICAR):**
- Estilo Visual: {{{previousAnalysis.style}}}
- Personajes (CASTING INMUTABLE): {{{JSON.stringify previousAnalysis.characters}}}

**ÚLTIMO CAPÍTULO (CONTEXTO):**
{{{JSON.stringify previousAnalysis.pages}}}

**TU TRABAJO:**
1.  **Crea un título para este nuevo capítulo.**
2.  **Escribe un nuevo conjunto de 12-21 escenas** que continúen la historia.
3.  **Sigue EXACTAMENTE el mismo formato** para cada escena: 'sceneTitle', 'narration', 'dialogue' (opcional) y 'visualDescription'. La 'visualDescription' debe ser ULTRA detallada para el artista.
4.  **Agrupa estas nuevas escenas en páginas** con diseños variados (páginas de impacto y de secuencia).

No generes un final para la historia. Simplemente escribe el siguiente capítulo. Comienza directamente con el objeto JSON.
`
});
