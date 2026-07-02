
'use server';

/**
 * @fileOverview Pipeline de análisis de audio OPTIMIZADO:
 *
 *   1. Transcripción robusta con Groq Whisper (whisper-large-v3) — ~5-10s.
 *   2. UN SOLO LLM call que:
 *      - Detecta hablantes y roles automáticamente.
 *      - Genera el informe clínico completo.
 *      — Antes eran 2 LLM calls separados (50s + 50s = 100s+). Ahora 1 solo (~15-30s).
 *
 * Sin inputs manuales de hablantes. Todo es automático.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  DiagnosticReportSchema,
  type DiagnosticReport,
} from '@/lib/types';
import { groqTranscribe } from '@/ai/groq-whisper-client';
import { analyzeCombined } from '@/ai/flows/analyze-combined';

// =============================================================================
// SCHEMAS DE ENTRADA/SALIDA
// =============================================================================

const AnalyzeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio recording, as data URI base64: 'data:<mimetype>;base64,<encoded_data>'.",
    ),
  title: z.string().describe('Title of the recording for context.'),
});

export type AnalyzeAudioInput = z.infer<typeof AnalyzeAudioInputSchema>;

const AnalyzeAudioOutputSchema = z.object({
  transcription: z.string(),
  report: DiagnosticReportSchema,
  detectedParticipants: z.array(
    z.object({
      rawLabel: z.string(),
      inferredRole: z.string(),
      confidence: z.enum(['alta', 'media', 'baja']),
      rationale: z.string().optional(),
    }),
  ),
  detectedParticipantsSummary: z.string(),
});

export type AnalyzeAudioOutput = z.infer<typeof AnalyzeAudioOutputSchema>;

// =============================================================================
// STEP 1: TRANSCRIPCIÓN CON WHISPER (GROQ)
// =============================================================================

async function transcribeWithFallback(audioDataUri: string): Promise<string> {
  const trimmedUri = audioDataUri.length > 100 ? audioDataUri.slice(0, 80) + '…' : audioDataUri;
  console.log(`[Nimbus] Transcribiendo audio: ${audioDataUri.length} bytes totales (data URI). Muestra: ${trimmedUri}`);

  try {
    const result = await groqTranscribe({
      audioDataUri,
      model: 'whisper-large-v3',
      responseFormat: 'verbose_json',
    });
    console.log(`[Nimbus] Whisper large-v3 OK. Texto: ${(result.text || '').length} chars.`);
    // Whisper devuelve un objeto con .text y a veces .segments con timestamps.
    // Si hay segmentos los formateamos con marcadores por turno (speaker_id
    // cuando lo proporciona Whisper). Si no, devolvemos el texto crudo igual.
    if (Array.isArray(result.segments) && result.segments.length > 0) {
      // Buscar segmentos con "speaker" nativo (no garantizado en whisper-large-v3
      // estándar). Si NO hay, usamos proximidad: pausas largas = cambio de turno.
      const segs = result.segments;
      const firstHasSpeaker = segs.some((s) => s.speaker);

      if (firstHasSpeaker) {
        return segs
          .map((s) => `${s.speaker ?? `Speaker ${(s.id ?? 0) + 1}`}: ${s.text.trim()}`)
          .join('\n');
      }

      // Sinonimos para diferenciar turnos por pausas largas (>2s entre fin del
      // anterior e inicio del nuevo)
      const lines: string[] = [];
      let speakerIdx = 0;
      const speakers = ['Hablante A', 'Hablante B'];
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        const prev = i > 0 ? segs[i - 1] : null;
        const gap = prev ? s.start - prev.end : 0;
        if (i === 0 || gap > 1.5) {
          speakerIdx = (speakerIdx + 1) % speakers.length;
        }
        lines.push(`${speakers[speakerIdx]}: ${s.text.trim()}`);
      }
      return lines.join('\n');
    }
    return result.text || '';
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn(`[Nimbus] Whisper large-v3 failed: ${errMsg.substring(0, 400)}. Probando whisper-large-v3-turbo…`);

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY no está configurada en el entorno de producción. Configúrala en el panel de Vercel > Settings > Environment Variables.');
    }

    try {
      const result = await groqTranscribe({
        audioDataUri,
        model: 'whisper-large-v3-turbo',
        responseFormat: 'verbose_json',
      });
      console.log(`[Nimbus] Whisper turbo OK. Texto: ${(result.text || '').length} chars.`);
      return result.text || '';
    } catch (err2: any) {
      const errMsg2 = err2?.message || String(err2);
      console.error(`[Nimbus] Whisper turbo también falló: ${errMsg2.substring(0, 400)}`);
      throw new Error(`La transcripción de audio falló en todos los modelos. Causa probable: ${errMsg.substring(0, 240)}`);
    }
  }
}

// =============================================================================
// MAIN FLOW
// =============================================================================

export async function analyzeAudioRecording(input: AnalyzeAudioInput): Promise<AnalyzeAudioOutput> {
  return analyzeAudioRecordingFlow(input);
}

const analyzeAudioRecordingFlow = ai.defineFlow(
  {
    name: 'analyzeAudioRecordingFlow',
    inputSchema: AnalyzeAudioInputSchema,
    outputSchema: AnalyzeAudioOutputSchema,
  },
  async ({ audioDataUri, title }) => {
    // -----------------------------------------------------------------
    // STEP 1: Transcripción
    // -----------------------------------------------------------------
    const transcription = await transcribeWithFallback(audioDataUri);

    if (!transcription || transcription.trim().length === 0) {
      throw new Error('La transcripción del audio ha fallado o está vacía.');
    }

    // -----------------------------------------------------------------
    // STEP 2: UN SOLO LLM call → detección de hablantes + reporte clínico
    // -----------------------------------------------------------------
    const combined = await analyzeCombined({
      audioTranscription: transcription,
      title,
    });

    return {
      transcription: combined.transcription || transcription,
      report: combined.report,
      detectedParticipants: combined.participants || [],
      detectedParticipantsSummary:
        combined.participantsSummary ||
        `La grabación contiene ${combined.participants?.length ?? 0} hablante(s).`,
    };
  },
);
