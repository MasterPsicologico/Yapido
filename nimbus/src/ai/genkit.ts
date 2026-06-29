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
(ai as any).generate = async function (opts: any) {
  const explicitModel = opts?.model;
  const chain: any[] = [];
  if (explicitModel) chain.push(explicitModel);
  for (const m of getFallbackChain()) {
    if (explicitModel && typeof explicitModel === 'string' && m === explicitModel) continue;
    chain.push(m);
  }

  const hasOutputSchema = !!opts?.output?.schema;

  // Intentar primero con genkit (Gemini/Groq) preservando TODO el contrato
  // (parseo de output.schema, validación Zod). Si falla por modelo o por
  // output no parseado, pasamos al cliente NVIDIA directo (que devuelve texto
  // crudo y parseamos manualmente).
  for (const model of chain) {
    try {
      if (isNvidiaModel(model)) {
        // NVIDIA: usamos cliente directo porque no hay plugin genkit.
        // Renderizamos el prompt y parseamos el JSON manualmente si hay schema.
        const rendered = Array.isArray(opts?.messages)
          ? (opts.messages as any[]).map((m: any) => `${m.role}: ${m.content || ''}`).join('\n')
          : typeof opts?.prompt === 'string'
            ? opts.prompt
            : Array.isArray(opts?.prompt)
              ? (opts.prompt as any[]).map((p: any) => p.text || '').join('\n')
              : '';

        // Si hay output.schema, enriquece el prompt para que devuelva JSON estricto.
        let finalPrompt = rendered;
        // NVIDIA NO soporta response_format estable entre todos sus modelos,
        // y m2.7/m3 cuelgan cuando se les pide json_object forzado. Usamos
        // instrucciones de formato en el propio prompt y parseamos manualmente.

        const result = await nvidiaChat({
          model: model as string,
          messages: [{ role: 'user', content: finalPrompt }],
          temperature: opts?.config?.temperature,
          topP: opts?.config?.topP,
          maxTokens: opts?.config?.maxOutputTokens ?? 4096,
        });

        // Si NO hay schema, devolvemos solo text (compatible con genkit).
        if (!hasOutputSchema) {
          return {
            text: result.text,
            usage: result.usage,
            finishReason: 'stop',
          };
        }

        // Si HAY schema, parseamos manualmente con Zod. Si falla la validación,
        // devolvemos text crudo y output null para que genkit NO lance exception
        // y el caller decida (eso ya ocurre actualmente).
        const schema = opts.output.schema;
        let parsedOutput: any = null;
        let parseError: string | null = null;
        try {
          const trimmed = (result.text || '').trim();
          // Quitar fences markdown ```json ... ```
          const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
          const json = fence ? fence[1] : trimmed;
          parsedOutput = JSON.parse(json);
          if (schema && typeof schema.parse === 'function') {
            parsedOutput = schema.parse(parsedOutput);
          }
        } catch (e: any) {
          const errMsg = e?.message || String(e);
          parseError = errMsg;
          console.warn(`[Nimbus] NVIDIA ${model} schema parse failed (will rotate): ${errMsg.substring(0, 200)}`);
          // Forzar el comportamiento de rotación devolviendo una "excepción"
          // sintética — el loop exterior la capturará y seguirá al próximo modelo.
          throw new Error(`NVIDIA schema parse failed: ${errMsg.substring(0, 150)}`);
        }

        return {
          text: result.text,
          usage: result.usage,
          finishReason: 'stop',
          output: parsedOutput,
        };
      }

      // Para todos los demás modelos (Gemini, Groq): usar el genkit original
      // que ya parsea el schema correctamente.
      // CRÍTICO: NO pasar `opts.model` al genkit original — solo pasamos los
      // modelos que sí están registrados como plugins. Si opts.model venía con
      // un NVIDIA model inexistente en genkit, lo descartamos.
      const optsForGenkit = { ...opts };
      if (typeof optsForGenkit.model === 'string') {
        // Solo preservar model si es de un plugin instalado.
        if (!optsForGenkit.model.startsWith('googleai/') && !optsForGenkit.model.startsWith('groq/')) {
          delete optsForGenkit.model;
        }
      }
      return await _origGenerate(optsForGenkit);
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
  // Errores transitorios que justifican rotación entre modelos
  return (
    error instanceof NvidiaAuthError ||
    error instanceof NvidiaRateLimitError ||
    /429|rate.?limit|quota|exhausted|token.?limit|timeout|ETIMEDOUT|503|502|500/i.test(msg) ||
    /model.?not.?found|model.?unavailable/i.test(msg) ||
    // Si la respuesta de NVIDIA parseó pero su JSON no cumple Zod (el modelo
    // se equivocó en el formato, p.ej. confidence numérico en vez de string),
    // rotamos al siguiente modelo para intentar mejor formato.
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
