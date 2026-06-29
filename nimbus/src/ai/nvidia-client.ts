/**
 * @fileOverview Cliente REST directo para NVIDIA NIM (integrate.api.nvidia.com).
 * Es OpenAI-compatible, así que hacemos una llamada manual y evitamos la dependencia
 * de un plugin genkit que no existe mantenido.
 *
 * Modelo principal: minimaxai/minimax-m2.7 (gratis, IQ ~38, chain-of-thought nativo).
 */

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export type NvidiaChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export interface NvidiaChatOptions {
  model?: string;
  messages: NvidiaChatMessage[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  responseFormat?: 'text' | 'json_object';
  systemPrompt?: string;
}

export interface NvidiaChatResponse {
  text: string;
  reasoning?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class NvidiaAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NvidiaAuthError';
  }
}

export class NvidiaRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NvidiaRateLimitError';
  }
}

/**
 * Llamada cruda al endpoint /v1/chat/completions de NVIDIA NIM.
 * Lanza errores tipados según sea auth, rate limit u otro.
 */
export async function nvidiaChat(options: NvidiaChatOptions): Promise<NvidiaChatResponse> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new NvidiaAuthError('NVIDIA_API_KEY is not set');
  }

// Default model probado: meta/llama-3.3-70b-instruct (JSON natural y estable)
const body: Record<string, any> = {
  model: options.model || 'meta/llama-3.3-70b-instruct',
  messages: options.messages,
  temperature: options.temperature ?? 0.7,
  top_p: options.topP ?? 0.95,
  max_tokens: options.maxTokens ?? 2048,
  stream: false,
};
  if (options.responseFormat) {
    body.response_format = { type: options.responseFormat };
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (response.status === 401 || response.status === 403) {
    throw new NvidiaAuthError(`NVIDIA auth failed: ${response.status}`);
  }
  if (response.status === 429) {
    const text = await response.text().catch(() => '');
    throw new NvidiaRateLimitError(`NVIDIA rate limited: ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`NVIDIA request failed: ${response.status} ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  const choice = data?.choices?.[0];
  const content = choice?.message?.content ?? '';
  const reasoning = choice?.message?.reasoning_content;

  return {
    text: content,
    reasoning,
    usage: data?.usage
      ? {
          promptTokens: data.usage.prompt_tokens ?? 0,
          completionTokens: data.usage.completion_tokens ?? 0,
          totalTokens: data.usage.total_tokens ?? 0,
        }
      : undefined,
  };
}

/**
 * Convierte un prompt crudo (string) en un único mensaje de usuario.
 * Útil para reemplazar ai.generate({ prompt }) sin tener que decidir formato.
 */
export async function nvidiaGenerateText(
  prompt: string,
  config: {
    model?: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {},
): Promise<string> {
  const messages: NvidiaChatMessage[] = [];
  if (config.systemPrompt) {
    messages.push({ role: 'system', content: config.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const result = await nvidiaChat({
    model: config.model,
    messages,
    temperature: config.temperature,
    topP: config.topP,
    maxTokens: config.maxTokens,
  });

  return result.text;
}
