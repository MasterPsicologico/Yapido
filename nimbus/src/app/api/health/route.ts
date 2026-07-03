import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const env = {
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    NVIDIA_API_KEY: !!process.env.NVIDIA_API_KEY,
    GOOGLE_GENAI_API_KEY: !!process.env.GOOGLE_GENAI_API_KEY,
  };
  const allSet = Object.values(env).every(Boolean);
  return NextResponse.json(
    {
      ok: true,
      ts: new Date().toISOString(),
      env,
      ready: allSet,
      hint: allSet
        ? 'Todas las llaves de IA están configuradas. Si la transcripción falla, revisa el log del servidor en Vercel.'
        : 'Faltan llaves de IA. Configúralas en Vercel → Settings → Environment Variables.',
    },
    { status: 200 }
  );
}
