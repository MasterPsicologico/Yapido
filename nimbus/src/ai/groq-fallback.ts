const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function groqChat(messages: Array<{ role: string; content: string }>, opts?: { maxTokens?: number; temperature?: number }): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: opts?.maxTokens || 4096,
      temperature: opts?.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export function isGeminiBlocked(error: any): boolean {
  const msg = String(error?.message || '');
  return (
    msg.includes('leaked') ||
    msg.includes('403') ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('forbidden')
  );
}
