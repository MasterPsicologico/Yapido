
'use server';

/**
 * @fileOverview A comprehensive flow to transcribe, diarize, and analyze an audio recording for diagnostic purposes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DiagnosticReportSchema, type DiagnosticReport } from '@/lib/types';

// --- SCHEMA DEFINITIONS ---

const AnalyzeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio recording, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  title: z.string().describe('The title of the recording, for context.'),
  roles: z.object({
      speakerOne: z.string().default('Hablante 1'),
      speakerTwo: z.string().default('Hablante 2')
  }).describe("Los roles de los hablantes para contextualizar el análisis.")
});

export type AnalyzeAudioInput = z.infer<typeof AnalyzeAudioInputSchema>;

const AnalyzeAudioOutputSchema = z.object({
    transcription: z.string().describe('The full, diarized transcription of the audio.'),
    report: DiagnosticReportSchema.describe('The structured diagnostic report generated from the transcription.'),
});

export type AnalyzeAudioOutput = z.infer<typeof AnalyzeAudioOutputSchema>;


// --- MAIN FLOW ---

export async function analyzeAudioRecording(input: AnalyzeAudioInput): Promise<AnalyzeAudioOutput> {
    return analyzeAudioRecordingFlow(input);
}


const analyzeAudioRecordingFlow = ai.defineFlow(
  {
    name: 'analyzeAudioRecordingFlow',
    inputSchema: AnalyzeAudioInputSchema,
    outputSchema: AnalyzeAudioOutputSchema,
  },
  async ({ audioDataUri, title, roles }) => {
    
    // Step 1: Transcribe the audio with speaker diarization
    const { text: transcription } = await ai.generate({
      prompt: [
        { text: `Tu única tarea es transcribir con extrema precisión el siguiente audio. Cada vez que un hablante cambie, identifícalo como '${roles.speakerOne}:' o '${roles.speakerTwo}:'. La transcripción debe estar en el idioma original del audio.` },
        { media: { url: audioDataUri, contentType: 'audio/webm' } },
      ],
      diarization: {
          enable: true,
          minSpeakerCount: 1,
          maxSpeakerCount: 2,
      },
    });

    if (!transcription || transcription.trim().length === 0) {
        throw new Error('La transcripción del audio ha fallado o está vacía.');
    }

    // Step 2: Analyze the transcription to generate a diagnostic report
    const reportGenerationPrompt = `
Eres un psicólogo clínico con un Doctorado, especializado en análisis de discurso y diagnóstico diferencial a través de entrevistas. Tu tarea es analizar la siguiente transcripción de una grabación titulada "${title}" entre "${roles.speakerOne}" y "${roles.speakerTwo}" y generar un informe estructural y riguroso.

**Transcripción Completa (con identificación de roles):**
<transcripcion>
${transcription}
</transcripcion>

**INSTRUCCIONES CRÍTICAS - INFORME DIAGNÓSTICO ESTRUCTURAL:**
Basándote EXCLUSIVAMENTE en la transcripción, completa de forma exhaustiva CADA UNO de los siguientes apartados del informe. Sé profesional, conciso y utiliza un lenguaje clínico.

1.  **reasonForConsultation (Motivo de consulta):** Resume en 1-2 frases la razón principal de la sesión, según lo expresado por el rol del 'paciente'.
2.  **mainSymptoms (Síntomas principales):** En formato de viñetas, lista los síntomas clave (emocionales, cognitivos, conductuales) mencionados.
3.  **courseAndEvolution (Curso y evolución):** Describe cómo han evolucionado los síntomas en el tiempo, su inicio y fluctuaciones, si se menciona.
4.  **riskAndProtectiveFactors (Factores de riesgo/protectores):** Identifica factores que aumentan la vulnerabilidad (ej. aislamiento) y las fortalezas o apoyos que ayudan a la persona.
5.  **riskAssessment (Evaluación de riesgo):** Evalúa el riesgo de daño a sí mismo o a otros. Si no hay evidencia, indica "No se observa riesgo autolítico o hacia terceros en el discurso".
6.  **clinicalHypothesis (Hipótesis clínica):** Formula una hipótesis explicativa que integre la información, explicando cómo los factores se relacionan para causar el malestar.
7.  **differentialDiagnosis (Diagnóstico diferencial):** Menciona 1-2 diagnósticos alternativos que podrían explicar los síntomas y justifica brevemente por qué la hipótesis principal es más probable.
8.  **diagnosticSynthesis (Síntesis diagnóstica):** Un resumen profesional y conciso de la presentación clínica, los temas clave y la impresión diagnóstica principal.
9.  **dsm5trTable (Tabla DSM-5-TR):** Una tabla que analiza los criterios diagnósticos relevantes del DSM-5-TR para tu hipótesis principal. Cada fila debe ser un objeto con 'criteria', 'evidence' (citas o resumen) y 'conclusion' ('Cumple', 'No se Cumple', 'Parcialmente').
10. **recommendedTreatments (Tratamientos recomendados):** Una lista de 2-3 enfoques de tratamiento, cada uno con 'name', 'description' y un 'timeline' de 3-5 pasos con 'step', 'title', 'description' y un 'icon' de lucide-react.
11. **interventionPlan (Plan de intervención):** Describe los primeros 3-4 pasos concretos recomendados para el tratamiento (ej. "1. Psicoeducación sobre ansiedad. 2. Introducción a técnicas de reestructuración cognitiva...").
12. **ethicalObservations (Observaciones éticas):** Menciona cualquier consideración ética relevante (ej. "Necesidad de evaluación presencial para confirmar diagnóstico", "Explorar red de apoyo del paciente").
`;

    const { output: report } = await ai.generate({
        prompt: reportGenerationPrompt,
        output: { schema: DiagnosticReportSchema },
    });

    if (!report) {
      throw new Error('La IA no pudo generar el informe diagnóstico a partir de la transcripción.');
    }

    // Step 3: Return the combined result
    return {
        transcription,
        report,
    };
  }
);
