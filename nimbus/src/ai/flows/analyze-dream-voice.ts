'use server';

/**
 * @fileOverview Transcribes an audio message for the Dream Portal.
 *
 * Uses Groq Whisper directly (whisper-large-v3) instead of a chat LLM because
 * chat LLMs cannot process raw audio — they were returning
 * "I'm ready to transcribe... please provide the audio".
 *
 * Whisper returns the spoken text directly from the audio bytes (~5-10s
 * per recording on Groq's hosted inference).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { groqTranscribe, GroqAuthError, GroqRateLimitError } from '@/ai/groq-whisper-client';

const AnalyzeVoiceInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A recorded audio message, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeVoiceInput = z.infer<typeof AnalyzeVoiceInputSchema>;

const AnalyzeVoiceOutputSchema = z.object({
  transcription: z.string().describe('El texto transcrito del audio.'),
});
export type AnalyzeVoiceOutput = z.infer<typeof AnalyzeVoiceOutputSchema>;


export async function analyzeDreamVoice(
  input: AnalyzeVoiceInput
): Promise<AnalyzeVoiceOutput> {
  return analyzeDreamVoiceFlow(input);
}

const analyzeDreamVoiceFlow = ai.defineFlow(
  {
    name: 'analyzeDreamVoiceFlow',
    inputSchema: AnalyzeVoiceInputSchema,
    outputSchema: AnalyzeVoiceOutputSchema,
  },
  async (input) => {
      if (!input?.audioDataUri || input.audioDataUri.length < 50) {
        throw new Error("No se proporcionó un audio válido para transcribir.");
      }

      let result;
      try {
        result = await groqTranscribe({
          audioDataUri: input.audioDataUri,
          model: 'whisper-large-v3',
          responseFormat: 'json',
          language: 'es',
          prompt: 'Transcripción de un sueño relatado en español. Conserva el tono narrativo y los detalles.',
          temperature: 0.1,
        });
      } catch (err: any) {
        if (err instanceof GroqAuthError) {
          throw new Error("Servicio de transcripción no disponible (auth). Contacta al administrador.");
        }
        if (err instanceof GroqRateLimitError) {
          // Fallback a turbo model en caso de rate limit
          try {
            result = await groqTranscribe({
              audioDataUri: input.audioDataUri,
              model: 'whisper-large-v3-turbo',
              responseFormat: 'json',
              language: 'es',
              temperature: 0.1,
            });
          } catch (e2: any) {
            throw new Error("Límite de transcripciones alcanzado. Intenta de nuevo en unos segundos.");
          }
        } else {
          throw new Error(`La transcripción de audio falló: ${err?.message || 'desconocido'}`);
        }
      }

      const transcription = (result?.text || '').trim();
      if (!transcription) {
        throw new Error("No se detectó habla en el audio. Intenta grabar de nuevo.");
      }

      const parsed = AnalyzeVoiceOutputSchema.safeParse({ transcription });
      if (!parsed.success) {
        console.error("Dream transcription output validation failed:", parsed.error);
        throw new Error("La salida de la transcripción del sueño no tiene el formato esperado.");
      }

      return parsed.data;
  }
);
