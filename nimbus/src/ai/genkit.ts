import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { groq } from 'genkitx-groq';
import { nvidiaChat, nvidiaGenerateText, NvidiaAuthError, NvidiaRateLimitError } from './nvidia-client';

// Plugins registrados para que genkit pueda usar Groq y Gemini cuando los llamamos explícitamente.
const plugins: any[] = [];

if (process.env.GROQ_API_KEY) {
  plugins.push(groq({ apiKey: process.env.GROQ_API_KEY }));
}

if (process.env.GOOGLE_GENAI_API_KEY) {
  plugins.push(googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }));
}

// =============================================================================
// MODEL HIERARCHY (rotación automática)
// =============================================================================
// 1. NVIDIA NIM  → llama-3.3-70b-instruct (gratis, JSON natural limpio)
//    — También m3 disponible, pero cuelga con prompts largos
// 2. Google AI   → gemini-2.5-flash (cuando NVIDIA falla)
// 3. Groq        → llama-3.3-70b-versatile (cuando los anteriores fallan)
//
// Esta jerarquía se consulta en `generateWithFallback` Y en `safeGenerate`
// (cuando un flow hace `ai.generate()` directamente).
// =============================================================================

const PRIMARY_MODEL = 'meta/llama-3.3-70b-instruct';

export const ai = genkit({
  plugins,
  model: process.env.GOOGLE_GENAI_API_KEY
    ? 'googleai/gemini-2.5-flash'
    : process.env.GROQ_API_KEY
      ? 'groq/llama-3.3-70b-versatile'
      : 'googleai/gemini-2.5-flash',
});

// NOTA: defaultModel solo aplica a definePrompt SIN model explícito. Como el
// monkey-patch de ai.generate() rota entre NVIDIA → Gemini → Groq, este default
// es en esencia un fallback ambiguo. Los flows tienen rotación de respaldo.

// =============================================================================
// MONKEY-PATCH GLOBAL: ai.generate() ahora rota modelos automaticamente.
// =============================================================================
// Antes: ai.generate() usaba estrictamente el `defaultModel` global.
//   Si Gemini se caía por quota/rate, TODOS los `definePrompt()` fallaban
//   porque internamente invocan ai.generate().
// Ahora: ai.generate() intenta el modelo solicitado/default → si falla por
//   quota/rate/timeout, rota al siguiente en `getFallbackChain()`.
// Esto cubre transparentemente TODA la app: definePrompt, defineFlow,
//   getAIResponse, generate-user-profile, etc.
// =============================================================================
const _origGenerate = (ai as any).generate.bind(ai);
const DEFAULT_GENERATE_TIMEOUT = 70_000;

(ai as any).generate = async function (opts: any) {
  const explicitModel = opts?.model;
  const chain: any[] = [];
  if (explicitModel) chain.push(explicitModel);
  for (const m of getFallbackChain()) {
    if (explicitModel && typeof explicitModel === 'string' && m === explicitModel) continue;
    chain.push(m);
  }

  const hasOutputSchema = !!opts?.output?.schema;

  for (const model of chain) {
    try {
      if (isNvidiaModel(model)) {
        const rendered = Array.isArray(opts?.messages)
          ? (opts.messages as any[]).map((m: any) => `${m.role}: ${m.content || ''}`).join('\n')
          : typeof opts?.prompt === 'string'
            ? opts.prompt
            : Array.isArray(opts?.prompt)
              ? (opts.prompt as any[]).map((p: any) => p.text || '').join('\n')
              : '';

        const result = await nvidiaChat({
          model: model as string,
          messages: [{ role: 'user', content: rendered }],
          temperature: opts?.config?.temperature,
          topP: opts?.config?.topP,
          maxTokens: opts?.config?.maxOutputTokens ?? 4096,
        });

        if (!hasOutputSchema) {
          return {
            text: result.text,
            usage: result.usage,
            finishReason: 'stop',
          };
        }

        const schema = opts.output.schema;
        let parsedOutput: any = null;
        try {
          const trimmed = (result.text || '').trim();
          const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
          const json = fence ? fence[1] : trimmed;
          parsedOutput = JSON.parse(json);
          if (schema && typeof schema.parse === 'function') {
            parsedOutput = schema.parse(parsedOutput);
          }
        } catch (e: any) {
          const errMsg = e?.message || String(e);
          console.warn(`[Nimbus] NVIDIA ${model} schema parse failed (will rotate): ${errMsg.substring(0, 200)}`);
          throw new Error(`NVIDIA schema parse failed: ${errMsg.substring(0, 150)}`);
        }

        return {
          text: result.text,
          usage: result.usage,
          finishReason: 'stop',
          output: parsedOutput,
        };
      }

      const optsForGenkit = { ...opts };
      if (typeof optsForGenkit.model === 'string') {
        if (!optsForGenkit.model.startsWith('googleai/') && !optsForGenkit.model.startsWith('groq/')) {
          delete optsForGenkit.model;
        }
      }

      // Timeout duro global: si la llamada a genkit no responde en DEFAULT_GENERATE_TIMEOUT,
      // abortamos y rotamos al siguiente modelo. Esto evita hanging indefinido.
      const genkitResult = await Promise.race([
        _origGenerate(optsForGenkit),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`ai.generate(${model}) timeout after ${DEFAULT_GENERATE_TIMEOUT}ms`)),
            DEFAULT_GENERATE_TIMEOUT
          )
        ),
      ]);
      return genkitResult;
    } catch (error: any) {
      console.warn(`[Nimbus] ai.generate(${typeof model === 'string' ? model : '<ref>'}) failed: ${error?.message?.substring(0, 200)}`);
      if (shouldRotateToNext(error)) continue;
      throw error;
    }
  }
  throw new Error('All AI models failed in ai.generate()');
};

/**
 * Lista ordenada de modelos desde el más preferido al más degradado.
 * Solo se incluyen los modelos para los que existe API key.
 */
export function getFallbackChain(): string[] {
  const chain: string[] = [];
  if (process.env.NVIDIA_API_KEY) chain.push(PRIMARY_MODEL);
  if (process.env.GOOGLE_GENAI_API_KEY) chain.push('googleai/gemini-2.5-flash');
  if (process.env.GROQ_API_KEY) chain.push('groq/llama-3.3-70b-versatile');
  return chain;
}

function shouldRotateToNext(error: any): boolean {
  if (!error) return false;
  const msg = String(error?.message || error);
  return (
    error instanceof NvidiaAuthError ||
    error instanceof NvidiaRateLimitError ||
    /429|rate.?limit|quota|exhausted|token.?limit|timeout|timed.?out|ETIMEDOUT|503|502|500|UNAVAILABLE|unavailable|aborted|all models failed/i.test(msg) ||
    /model.?not.?found|model.?unavailable/i.test(msg) ||
    /schema.?parse.?failed/i.test(msg)
  );
}

async function callNvidia(model: string, options: { prompt: string; config?: any }): Promise<string> {
  const result = await nvidiaChat({
    model,
    messages: [{ role: 'user', content: options.prompt }],
    temperature: options.config?.temperature,
    topP: options.config?.topP,
    maxTokens: options.config?.maxOutputTokens ?? options.config?.max_tokens ?? 2048,
  });
  return result.text;
}

function isNvidiaModel(model: unknown): boolean {
  if (typeof model !== 'string') return false;
  return model === PRIMARY_MODEL || model.startsWith('minimaxai/');
}

async function callGenkitModel(modelRef: any, options: { prompt: string; config?: any }): Promise<string> {
  const callWithModel = (modelValue?: any) =>
    ai.generate({
      prompt: options.prompt,
      ...(modelValue ? { model: modelValue } : {}),
      ...(options.config ? { config: options.config } : {}),
    });
  const { text } = typeof modelRef === 'string' ? await callWithModel(modelRef) : await callWithModel(modelRef);
  return text || '';
}

/**
 * Generación universal con rotación automática entre modelos.
 *  1. NVIDIA minimax-m2.7 (gratis y capaz)
 *  2. googleai/gemini-2.5-flash (alto IQ)
 *  3. groq/llama-3.3-70b-versatile (rápido)
 */
export async function generateWithFallback(options: {
  prompt: string;
  model?: any;
  config?: any;
}): Promise<string> {
  const initialChain: any[] = [];
  if (options.model) initialChain.push(options.model);
  for (const m of getFallbackChain()) {
    if (typeof options.model === 'string' && m === options.model) continue;
    initialChain.push(m);
  }
  const chain = initialChain.length > 0 ? initialChain : getFallbackChain();

  let lastError: any = null;
  for (const model of chain) {
    try {
      console.log(`[Nimbus] Trying model: ${typeof model === 'string' ? model : '<model-ref>'}`);
      const text = isNvidiaModel(model)
        ? await callNvidia(model as string, options)
        : await callGenkitModel(model, options);
      if (text && text.trim().length > 0) {
        console.log(`[Nimbus] ${typeof model === 'string' ? model : '<model-ref>'} succeeded (${text.length} chars)`);
        return text;
      }
      console.warn(`[Nimbus] ${typeof model === 'string' ? model : '<model-ref>'} returned empty text`);
    } catch (error: any) {
      lastError = error;
      console.warn(`[Nimbus] ${typeof model === 'string' ? model : '<model-ref>'} failed: ${error?.message?.substring(0, 200)}`);
      if (shouldRotateToNext(error)) {
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('All AI models failed to generate a response');
}

/**
 * Wrapper seguro para `ai.generate({ prompt, model?, config? })` directo.
 * Si el modelo falla por rate limit, rota al siguiente.
 */
export async function safeGenerate(options: {
  prompt: string;
  model?: any;
  config?: any;
}): Promise<{ text: string }> {
  const defaultChainModel = getFallbackChain()[0] || PRIMARY_MODEL;
  const explicitModel = options.model || defaultChainModel;

  try {
    const text = isNvidiaModel(explicitModel)
      ? await callNvidia(explicitModel, options)
      : await callGenkitModel(explicitModel, options);
    return { text };
  } catch (error: any) {
    if (!shouldRotateToNext(error)) throw error;
    return {
      text: await generateWithFallback({
        prompt: options.prompt,
        config: options.config,
      }),
    };
  }
}

export async function generateWithGroqOnly(options: { prompt: string; config?: any }): Promise<string> {
  const { text } = await ai.generate({
    prompt: options.prompt,
    model: 'groq/llama-3.3-70b-versatile',
    ...(options.config ? { config: options.config } : {}),
  });
  return text || '';
}
