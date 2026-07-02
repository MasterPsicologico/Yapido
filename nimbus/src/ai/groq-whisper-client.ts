/**
 * @fileOverview Cliente REST directo a Groq para transcripción de audio con Whisper.
 *
 * Groq expone el endpoint OpenAI-compatible:
 *   POST https://api.groq.com/openai/v1/audio/transcriptions
 *
 * Modelos disponibles:
 *   - whisper-large-v3      (recomendado, multilingüe)
 *   - whisper-large-v3-turbo (más rápido)
 *   - distil-whisper-large-v3-en (solo inglés, ultra rápido)
 *
 * Soporta:
 *   - response_format: "json" | "verbose_json" (verbose_json incluye duration,
 *     language y palabras con timestamps pero NO diarización nativa de Groq).
 *   - Para diarización real, usamos el modelo "black-forest-labs/voxtral-small-24b"
 *     que SÍ diariza (cuando esté disponible).
 *
 * Estrategia actual:
 *   1. Transcription base con whisper-large-v3 (sin diarización nativa).
 *   2. La función regresa un texto plano con marcadores de speaker.
 *   3. La detección fina de roles + número de hablantes la hace el LLM rotor
 *      en un segundo pipeline (ver detect-speakers-flow.ts).
 */

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = 'whisper-large-v3';

export interface GroqTranscriptionOptions {
  audioDataUri: string;
  model?: 'whisper-large-v3' | 'whisper-large-v3-turbo' | 'distil-whisper-large-v3-en';
  language?: string;
  prompt?: string;
  temperature?: number;
  responseFormat?: 'json' | 'verbose_json' | 'text' | 'srt' | 'vtt';
  signal?: AbortSignal;
}

export interface GroqTranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }>;
}

export class GroqAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GroqAuthError';
  }
}

export class GroqRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GroqRateLimitError';
  }
}

/**
 * Envía audio a Whisper en Groq y devuelve la transcripción.
 * Acepta `audioDataUri` (data URI base64).
 */
export async function groqTranscribe(
  options: GroqTranscriptionOptions,
): Promise<GroqTranscriptionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqAuthError('GROQ_API_KEY is not set');
  }

  // Parsear data URI: data:<mimetype>;base64,<data>
  const match = options.audioDataUri.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!match) {
    throw new Error('audioDataUri debe ser un data URI base64 válido (data:<mime>;base64,...)');
  }
  const mimeType = match[1];
  const base64Data = match[2];
  const audioBuffer = Buffer.from(base64Data, 'base64');

  // Construir FormData
  const formData = new FormData();
  // Adjuntar el audio en su formato original. Whisper acepta webm, mp3, wav, m4a, etc.
  const extension = mimeType.includes('webm') ? 'webm'
    : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'mp4'
    : mimeType.includes('mpeg') || mimeType.includes('mp3') ? 'mp3'
    : mimeType.includes('wav') ? 'wav'
    : mimeType.includes('ogg') ? 'ogg'
    : 'bin';

  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append('file', blob, `audio.${extension}`);
  formData.append('model', options.model || DEFAULT_MODEL);
  formData.append('response_format', options.responseFormat ?? 'verbose_json');
  if (options.language) formData.append('language', options.language);
  if (options.prompt) formData.append('prompt', options.prompt);
  if (typeof options.temperature === 'number') {
    formData.append('temperature', String(options.temperature));
  }

  const timeoutMs = (options as any).timeoutMs ?? 60_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('Groq Whisper request timed out')), timeoutMs);

  try {
    const response = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // No añadimos Content-Type — fetch lo genera con boundary de FormData
      },
      body: formData as any,
      signal: options.signal || controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new GroqAuthError(`Groq auth failed: ${response.status}`);
    }
    if (response.status === 429) {
      const text = await response.text().catch(() => '');
      throw new GroqRateLimitError(`Groq rate limited: ${text.slice(0, 200)}`);
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Groq transcription failed: ${response.status} ${text.slice(0, 400)}`);
    }

    const data = await response.json();

    // Whisper verbose_json response shape
    if (data && typeof data === 'object' && 'text' in data) {
      return {
        text: data.text || '',
        language: data.language,
        duration: data.duration,
        segments: Array.isArray(data.segments)
          ? data.segments.map((s: any) => ({
              id: s.id ?? 0,
              start: s.start ?? 0,
              end: s.end ?? 0,
              text: s.text ?? '',
              speaker: s.speaker,
            }))
          : undefined,
      };
    }

    // Fallback a texto plano
    return { text: typeof data === 'string' ? data : '' };
  } catch (err: any) {
    if (err?.name === 'AbortError' || /aborted/i.test(err?.message || '')) {
      throw new Error(`Groq Whisper timeout después de ${timeoutMs}ms — el servidor tardó demasiado.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
