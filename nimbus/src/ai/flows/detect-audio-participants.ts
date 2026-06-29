/**
 * @fileOverview Detecta automáticamente cuántos hablantes hay en una transcripción
 * y asigna a cada uno un rol inferido (psicólogo, paciente, familiar, etc.).
 *
 * Usa safeGenerate() con rotación automática entre modelos (NVIDIA m2.7 → Gemini → Groq).
 *
 * Entrada:
 *   - transcription: texto de la transcripción con marcadores de speaker
 *   - title: contexto de la grabación
 *
 * Salida:
 *   - participants: lista de { rawLabel, inferredRole, confidence, rationale }
 *   - summary: resumen narrativo de los participantes detectados
 *
 * Si la rotación completa falla, devuelve un fallback con etiquetas genéricas.
 */

import { z } from 'genkit';
import { ai } from '@/ai/genkit';
import { safeGenerate } from '@/ai/genkit';
import { detectSpeakersPrompt } from '@/ai/prompts/detect-speakers-prompts';

const DetectParticipantsInputSchema = z.object({
  transcription: z.string().describe('Transcripción completa de la grabación, con marcadores de speaker.'),
  title: z.string().optional().describe('Título de la grabación para contexto adicional.'),
});

export type DetectParticipantsInput = z.infer<typeof DetectParticipantsInputSchema>;

export const DetectedParticipantSchema = z.object({
  rawLabel: z.string().describe('Etiqueta cruda del hablante en la transcripción (ej. "Speaker 1", "Hablante 2", "Locutor A").'),
  inferredRole: z.string().describe('Rol psicológico inferido del hablante.'),
  confidence: z.enum(['alta', 'media', 'baja']).describe('Confianza del LLM en la inferencia.'),
  rationale: z.string().optional().describe('Justificación corta de por qué se le asignó ese rol.'),
});

export const DetectParticipantsOutputSchema = z.object({
  participants: z.array(DetectedParticipantSchema),
  summary: z.string().describe('Resumen narrativo breve de la composición de la grabación.'),
});

export type DetectedParticipant = z.infer<typeof DetectedParticipantSchema>;
export type DetectParticipantsOutput = z.infer<typeof DetectParticipantsOutputSchema>;

function parseJsonOrThrow(raw: string, source: string): any {
  const trimmed = (raw || '').trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const json = fence ? fence[1] : trimmed;
  try {
    return JSON.parse(json);
  } catch (e: any) {
    throw new Error(`[detectAudioParticipants:${source}] invalid JSON: ${e?.message?.substring(0, 200)} | first 200 chars: ${json.slice(0, 200)}`);
  }
}

function buildFallbackFromLabels(transcription: string): DetectParticipantsOutput {
  const regex = /(?:Speaker|Hablante|Locutor|Interlocutor)[\s:]*([A-Z0-9]+)/gi;
  const labels = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = regex.exec(transcription)) !== null) {
    labels.add(`Speaker ${m[1].toUpperCase()}`);
  }
  const participants = [...labels].map((rawLabel) => ({
    rawLabel,
    inferredRole: 'Hablante sin identificar',
    confidence: 'baja' as const,
    rationale: 'No se pudo completar el análisis psicológico de roles; se conserva la etiqueta cruda.',
  }));
  return {
    participants: participants.length ? participants : [{ rawLabel: 'Speaker 1', inferredRole: 'Hablante sin identificar', confidence: 'baja', rationale: 'No se detectaron marcadores de speaker en la transcripción.' }],
    summary: 'Análisis automático de roles no disponible en esta transcripción; se conservan etiquetas genéricas.',
  };
}

export async function detectAudioParticipants(input: DetectParticipantsInput): Promise<DetectParticipantsOutput> {
  const { transcription, title } = input;

  // Truncar para no saturar al modelo — primeros ~6000 chars suelen bastar
  // para entender el contexto de cada hablante.
  const truncated = transcription.length > 6000 ? transcription.slice(0, 6000) + '\n\n[... transcripción truncada para análisis ...]' : transcription;

  const prompt = detectSpeakersPrompt({ transcription: truncated, title: title ?? '' });

  try {
    const { text } = await safeGenerate({
      prompt,
      config: { temperature: 0.3, topP: 0.9, maxOutputTokens: 1500 },
    });
    const parsed = parseJsonOrThrow(text || '{}', 'rotated-LLM');
    const validated = DetectParticipantsOutputSchema.parse(parsed);
    return validated;
  } catch (err: any) {
    console.warn('[Nimbus] detectAudioParticipants: rotación LLM falló, usando fallback:', err?.message?.substring(0, 200));
    return buildFallbackFromLabels(transcription);
  }
}
