import { NextResponse } from 'next/server';
import { analyzeAudioRecording } from '@/ai/flows/analyze-audio-recording';

export const runtime = 'nodejs';
export const maxDuration = 90;
export const dynamic = 'force-dynamic';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  let body: any = null;
  try {
    body = await request.json();
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Cuerpo de la petición inválido (no es JSON válido).' },
      { status: 400 }
    );
  }

  const audioDataUri: string | undefined = body?.audioDataUri;
  const title: string | undefined = body?.title;

  if (!audioDataUri || typeof audioDataUri !== 'string') {
    return NextResponse.json(
      { error: 'audioDataUri es obligatorio.' },
      { status: 400 }
    );
  }

  if (!audioDataUri.startsWith('data:')) {
    return NextResponse.json(
      { error: 'audioDataUri debe ser un data URI válido (data:<mime>;base64,<...>).' },
      { status: 400 }
    );
  }

  if (audioDataUri.length > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: `El audio excede el límite permitido (${MAX_AUDIO_BYTES} bytes). Graba una sesión más corta o comprime el audio.` },
      { status: 413 }
    );
  }

  try {
    const result = await analyzeAudioRecording({
      audioDataUri,
      title: title?.trim() || 'Grabación sin título',
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const message = err?.message || 'Error desconocido durante el análisis.';
    console.error('[Nimbus API /analyze-recording] Fallo en el análisis:', {
      message,
      stack: err?.stack?.substring?.(0, 800),
    });

    const lowered = String(message).toLowerCase();
    const isTransient =
      /429|rate.?limit|quota|exhausted|timeout|timed.?out|503|502|500|all models failed|not found|unavailable|aborted/i.test(
        lowered
      );

    return NextResponse.json(
      {
        error: message,
        transient: isTransient,
        hint: isTransient
          ? 'Reintenta en unos segundos; si persiste, reduce la duración de la grabación.'
          : 'Verifica que las llaves de API (GROQ_API_KEY, NVIDIA_API_KEY, GOOGLE_GENAI_API_KEY) estén configuradas en el panel de Vercel.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: '/api/analyze-recording',
      method: 'POST',
      accepts: { audioDataUri: 'string', title: 'string' },
      maxSeconds: 90,
    },
    { status: 200 }
  );
}
