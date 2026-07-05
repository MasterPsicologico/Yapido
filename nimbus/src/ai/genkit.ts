import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { groq } from 'genkitx-groq';
import { nvidiaChat, nvidiaGenerateText, NvidiaAuthError, NvidiaRateLimitError } from './nvidia-client';

// Plugins registrados para que genkit pueda usar Groq y Gemini cuando los llamamos expl├¡citamente.
const plugins: any[] = [];

if (process.env.GROQ_API_KEY) {
  plugins.push(groq({ apiKey: process.env.GROQ_API_KEY }));
}

if (process.env.GOOGLE_GENAI_API_KEY) {
  plugins.push(googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }));
}

// =============================================================================
// MODEL HIERARCHY (rotaci├│n autom├ítica)
// =============================================================================
// 1. NVIDIA NIM  ÔåÆ llama-3.3-70b-instruct (gratis, JSON natural limpio)
//    ÔÇö Tambi├®n m3 disponible, pero cuelga con prompts largos
// 2. Google AI   ÔåÆ gemini-2.5-flash (cuando NVIDIA falla)
// 3. Groq        ÔåÆ llama-3.3-70b-versatile (cuando los anteriores fallan)
//
// Esta jerarqu├¡a se consulta en `generateWithFallback` Y en `safeGenerate`
// (cuando un flow hace `ai.generate()` directamente).
// =============================================================================

const PRIMARY_MODEL = 'minimaxai/minimax-m2.7';

export const ai = genkit({
  plugins,
  model: process.env.GOOGLE_GENAI_API_KEY
    ? 'googleai/gemini-2.5-flash'
    : process.env.GROQ_API_KEY
      ? 'groq/llama-3.3-70b-versatile'
      : 'googleai/gemini-2.5-flash',
});

// NOTA: defaultModel solo aplica a definePrompt SIN model expl├¡cito. Como el
// monkey-patch de ai.generate() rota entre NVIDIA ÔåÆ Gemini ÔåÆ Groq, este default
// es en esencia un fallback ambiguo. Los flows tienen rotaci├│n de respaldo.

// =============================================================================
// MONKEY-PATCH GLOBAL: ai.generate() ahora rota modelos automaticamente.
// =============================================================================
// Antes: ai.generate() usaba estrictamente el `defaultModel` global.
//   Si Gemini se ca├¡a por quota/rate, TODOS los `definePrompt()` fallaban
//   porque internamente invocan ai.generate().
// Ahora: ai.generate() intenta el modelo solicitado/default ÔåÆ si falla por
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
  // (parseo de output.schema, validaci├│n Zod). Si falla por modelo o por
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

        // Si HAY schema, parseamos manualmente con Zod. Si falla la validaci├│n,
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
          // Forzar el comportamiento de rotaci├│n devolviendo una "excepci├│n"
          // sint├®tica ÔÇö el loop exterior la capturar├í y seguir├í al pr├│ximo modelo.
          throw new Error(`NVIDIA schema parse failed: ${errMsg.substring(0, 150)}`);
        }

        return {
          text: result.text,
          usage: result.usage,
          finishReason: 'stop',
          output: parsedOutput,
        };
      }

      // Para todos los dem├ís modelos (Gemini, Groq): usar el genkit original
      // que ya parsea el schema correctamente.
      // CR├ìTICO: NO pasar `opts.model` al genkit original ÔÇö solo pasamos los
      // modelos que s├¡ est├ín registrados como plugins. Si opts.model ven├¡a con
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
 * Lista ordenada de modelos desde el m├ís preferido al m├ís degradado.
 * Solo se incluyen los modelos para los que existe API key.
 */
export function getFallbackChain(): string[] {
  // ORDEN PRIORIZADO POR INTELIGENCIA (no por velocidad):
  // 1. minimaxai/minimax-m2.7 — GRATIS, IQ ~38, el más inteligente libre
  // 2. nvidia/nemotron-4-340b-instruct — 340B, muy capaz
  // 3. nvidia/llama-3.3-nemotron-super-49b-v1.5 — 49B optimizado
  // 4. googleai/gemini-2.5-flash — buen razonamiento
  // 5. groq/llama-3.3-70b-versatile — funciona, menos inteligente pero rápido
  // 6. meta/llama-3.3-70b-instruct — último recurso NVIDIA (a veces cuelga)
  const chain: string[] = [];
  if (process.env.NVIDIA_API_KEY) {
    chain.push('minimaxai/minimax-m2.7');
    chain.push('nvidia/nemotron-4-340b-instruct');
    chain.push('nvidia/llama-3.3-nemotron-super-49b-v1.5');
    chain.push('meta/llama-3.3-70b-instruct');
  }
  if (process.env.GOOGLE_GENAI_API_KEY) chain.push('googleai/gemini-2.5-flash');
  if (process.env.GROQ_API_KEY) chain.push('groq/llama-3.3-70b-versatile');
  return chain;
}

function shouldRotateToNext(error: any): boolean {
  if (!error) return false;
  const msg = String(error?.message || error);
  // Errores transitorios que justifican rotaci├│n entre modelos
  return (
    error instanceof NvidiaAuthError ||
    error instanceof NvidiaRateLimitError ||
    /429|rate.?limit|quota|exhausted|token.?limit|timeout|ETIMEDOUT|503|502|500/i.test(msg) ||
    /model.?not.?found|model.?unavailable/i.test(msg) ||
    // Si la respuesta de NVIDIA parse├│ pero su JSON no cumple Zod (el modelo
    // se equivoc├│ en el formato, p.ej. confidence num├®rico en vez de string),
    // rotamos al siguiente modelo para intentar mejor formato.
    /schema.?parse.?failed/i.test(msg)
  );
}

async function callNvidia(model: string, options: { prompt: string; config?: any }): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000); // 15s hard timeout
  try {
    const result = await nvidiaChat({
      model,
      messages: [{ role: 'user', content: options.prompt }],
      temperature: options.config?.temperature,
      topP: options.config?.topP,
      maxTokens: options.config?.maxOutputTokens ?? options.config?.max_tokens ?? 2048,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return result.text;
  } catch (e: any) {
    clearTimeout(timeout);
    // Transform AbortError into timeout error for shouldRotateToNext
    if (e?.name === 'AbortError' || /aborted/i.test(e?.message || '')) {
      throw new Error(`NVIDIA timeout after 15s`);
    }
    throw e;
  }
}

function isNvidiaModel(model: unknown): boolean {
  if (typeof model !== 'string') return false;
  return (
    model.startsWith('minimaxai/') ||
    model.startsWith('nvidia/') ||
    model.startsWith('meta/') ||
    model.startsWith('mistralai/') ||
    model.startsWith('qwen/') ||
    model.startsWith('deepseek-ai/') ||
    model === PRIMARY_MODEL
  );
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
 * Generaci├│n universal con rotaci├│n autom├ítica entre modelos.
 *  1. NVIDIA minimax-m2.7 (gratis y capaz)
 *  2. googleai/gemini-2.5-flash (alto IQ)
 *  3. groq/llama-3.3-70b-versatile (r├ípido)
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
