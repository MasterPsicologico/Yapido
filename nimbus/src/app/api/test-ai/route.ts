import { NextResponse } from 'next/server';
import { nvidiaChat } from '@/ai/nvidia-client';

export const runtime = 'nodejs';
export const maxDuration = 15;

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    nvidia: null,
    groq: null,
  };

  // Test NVIDIA with 8s timeout
  try {
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaKey) {
      results.nvidia = { ok: false, error: 'NVIDIA_API_KEY not set' };
    } else {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const start = Date.now();
        const resp = await nvidiaChat({
          model: 'meta/llama-3.3-70b-instruct',
          messages: [{ role: 'user', content: 'Say "OK" in 1 word.' }],
          maxTokens: 10,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        results.nvidia = {
          ok: true,
          model: 'meta/llama-3.3-70b-instruct',
          response: resp.text?.substring(0, 50),
          ms: Date.now() - start,
        };
      } catch (e: any) {
        clearTimeout(timeout);
        if (e?.name === 'AbortError' || /aborted/i.test(e?.message || '')) {
          results.nvidia = { ok: false, error: 'NVIDIA API timeout after 8s - likely network/auth issue' };
        } else {
          results.nvidia = {
            ok: false,
            error: e?.message?.substring(0, 200),
            name: e?.name,
          };
        }
      }
    }
  } catch (e: any) {
    results.nvidia = { ok: false, error: e?.message?.substring(0, 200) };
  }

  // Test Groq with 8s timeout
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      results.groq = { ok: false, error: 'GROQ_API_KEY not set' };
    } else {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const start = Date.now();
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Say "OK" in 1 word.' }],
            max_tokens: 10,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await resp.json();
        if (!resp.ok) {
          results.groq = { ok: false, status: resp.status, error: JSON.stringify(data).substring(0, 200) };
        } else {
          results.groq = {
            ok: true,
            model: 'llama-3.3-70b-versatile',
            response: data?.choices?.[0]?.message?.content?.substring(0, 50),
            ms: Date.now() - start,
          };
        }
      } catch (e: any) {
        clearTimeout(timeout);
        if (e?.name === 'AbortError' || /aborted/i.test(e?.message || '')) {
          results.groq = { ok: false, error: 'Groq API timeout after 8s' };
        } else {
          results.groq = { ok: false, error: e?.message?.substring(0, 200) };
        }
      }
    }
  } catch (e: any) {
    results.groq = { ok: false, error: e?.message?.substring(0, 200) };
  }

  return NextResponse.json(results);
}