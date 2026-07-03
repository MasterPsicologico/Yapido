/**
 * @fileOverview UN SOLO LLM call que:
 *   - Detecta hablantes y roles
 *   - Genera el informe clínico estructural
 *
 * Salida: SINGLE object con { transcription, detectedParticipants, detectedParticipantsSummary, report }.
 * Antes era 2 LLM calls (50s + 50s). Ahora 1 solo call (~15-30s).
 *
 * Usa safeGenerate() con rotación automática NVIDIA → Gemini → Groq,
 * y aprovecha response_format para JSON estricto (Genkit ya lo parsea).
 */

import { ai, safeGenerate } from '@/ai/genkit';
import { z } from 'genkit';
import { DiagnosticReportSchema, type DiagnosticReport } from '@/lib/types';

// Schema que combina detección + reporte en una sola salida
const DetectedParticipantSchema = z.object({
  rawLabel: z.string().describe('Etiqueta cruda del hablante (ej. "Psicólogo", "Paciente", "Speaker 1").'),
  inferredRole: z.string().describe('Rol psicológico/clínico inferido.'),
  // Aceptamos cualquier entrada (texto o número) y mapeamos al enum.
  confidence: z
    .union([z.string(), z.number()])
    .transform((v) => {
      if (typeof v === 'number') {
        if (v >= 0.85) return 'alta' as const;
        if (v >= 0.5) return 'media' as const;
        return 'baja' as const;
      }
      const s = String(v).toLowerCase().trim();
      if (['alta', 'alto', 'high', 'high confidence', 'a'].includes(s)) return 'alta' as const;
      if (['media', 'medio', 'medium', 'm'].includes(s)) return 'media' as const;
      return 'baja' as const;
    })
    .describe('Confianza de la inferencia: "alta" | "media" | "baja". Si el modelo emite un número (0-1) se mapea automáticamente al bucket.'),
  rationale: z.string().optional().describe('Justificación breve (1-2 frases).'),
});

const CombinedAnalysisSchema = z.object({
  transcription: z.string().describe('Transcripción limpia y verbatim del audio.'),
  participants: z.array(DetectedParticipantSchema).describe('Lista de hablantes detectados con sus roles.'),
  participantsSummary: z.string().describe('Resumen narrativo breve de la composición detectada.'),
  report: DiagnosticReportSchema.describe('Informe clínico estructural completo.'),
});

export type DetectedParticipant = z.infer<typeof DetectedParticipantSchema>;
export type CombinedAnalysis = z.infer<typeof CombinedAnalysisSchema>;

function buildCombinedPrompt(args: {
  audioTranscription: string;
  title: string;
}): string {
  return `Eres un psicólogo clínico senior con Doctorado, especializado en análisis del discurso, identificación de roles en sesiones clínicas y diagnóstico diferencial.

# ════════════════════════════════════════════════════════════════════
# TAREA (3 PASOS EN UNO)
# ════════════════════════════════════════════════════════════════════

A partir de la transcripción de una grabación titulada "${args.title}" DEBES producir UN ÚNICO objeto JSON con CUATRO bloques:

1. **transcription** → la transcripción limpia (verbatim, sin modificar lo que se dijo, con marcadores de speaker).
2. **participants[]** → lista de hablantes detectados (rawLabel + inferredRole + confidence + rationale).
3. **participantsSummary** → resumen narrativo breve de quién participa.
4. **report** → informe clínico estructural completo (ver schema).

# ════════════════════════════════════════════════════════════════════
# TIPOS DE ROL COMUNES A CONSIDERAR
# ════════════════════════════════════════════════════════════════════

- "Psicólogo clínico" / "Terapeuta" / "Psiquiatra" (hace preguntas clínico-técnicas, usa términos profesionales)
- "Paciente" / "Consultante" (relata síntomas en 1ra persona)
- "Familiar del paciente" (habla en 3ra persona o busca orientación)
- "Pareja" / "Cónyuge"
- "Estudiante" / "Aprendiz"
- "Amigo" / "Confidente"
- "Hablante sin identificar"

# ════════════════════════════════════════════════════════════════════
# ⚠️ FORMATO ESTRICTO — LEE ESTAS INSTRUCCIONES CON MÁXIMO CUIDADO ⚠️
# ════════════════════════════════════════════════════════════════════

Para el campo **confidence** en cada participante, DEBES usar EXCLUSIVAMENTE uno de estos tres valores LITERALES (string, en minúsculas, sin acentos):
  - "alta"
  - "media"
  - "baja"

NO uses números (0.8, 1, etc.), NO uses porcentajes, NO uses "Alta" ni "ALTA". SOLO uno de los tres strings literales arriba.

Si dudas entre dos, elige el inferior. Si la transcripción tiene muy poco contenido, elige "baja".

# ════════════════════════════════════════════════════════════════════
# SEÑALES A ANALIZAR EN CADA TURNO
# ════════════════════════════════════════════════════════════════════

- Vocabulario técnico vs coloquial
- Preguntas vs relatos (clínico guía vs paciente guiado)
- Perspectiva 1ra/2da/3ra persona
- Conocimiento demostrado
- Emocionalidad
- Dirección del diálogo

# ════════════════════════════════════════════════════════════════════
# INSTRUCCIONES PARA EL INFORME CLÍNICO (campo "report")
# ════════════════════════════════════════════════════════════════════

Sustituye SIEMPRE las etiquetas crudas de hablante por sus roles inferidos. Ejemplo: en vez de "Speaker 2 menciona que…", escribe "el paciente menciona que…". Completa EXHAUSTIVAMENTE todos los apartados del report:
- reasonForConsultation, mainSymptoms, courseAndEvolution, riskAndProtectiveFactors, riskAssessment, clinicalHypothesis, differentialDiagnosis, diagnosticSynthesis.
- dsm5trTable: array con criterios relevantes DSM-5-TR (criteria, evidence, conclusion ∈ {Cumple, No se Cumple, Parcialmente}).
- recommendedTreatments: array con name, description, timeline de 3-5 pasos (cada paso = {step, title, description, icon}, icon ∈ lucide-react: "Brain","Heart","BookHeart","Sparkles","CloudSun", etc.).
- interventionPlan, ethicalObservations.

# ════════════════════════════════════════════════════════════════════
# TRANSCRIPCIÓN (input Whisper)
# ════════════════════════════════════════════════════════════════════

<transcripcion_whisper>
${args.audioTranscription}
</transcripcion_whisper>

# ════════════════════════════════════════════════════════════════════
# IMPORTANTE — FORMATO FINAL
# ════════════════════════════════════════════════════════════════════

- Devuelve EXCLUSIVAMENTE el objeto JSON. Sin markdown, sin explicaciones, sin texto antes o después.
- Sé conciso pero completo — el reporte clínico NO debe estar vacío en ninguna sección.
- Si una sección no tiene info, infiere un valor razonable desde el contexto.
- confidence SIEMPRE como uno de los 3 strings literales especificados arriba.`;
}

export async function analyzeCombined(input: {
  audioTranscription: string;
  title: string;
}): Promise<CombinedAnalysis> {
  const prompt = buildCombinedPrompt(input);
  let lastError: any = null;

  // Orden optimizado para VELOCIDAD + fiabilidad:
  // 1. Gemini 2.5 Flash (Google) — el más rápido disponible en Vercel
  // 2. Groq Llama 3.3 70B — fallback rápido con JSON estricto
  // 3. NVIDIA NIM — solo como último recurso (a veces cuelga con prompts largos)
  const models = [
    'googleai/gemini-2.5-flash',
    'groq/llama-3.3-70b-versatile',
    'meta/llama-3.3-70b-instruct',
  ];

  for (const model of models) {
    try {
      // Empacamos la llamada en un timeout duro de 70s por modelo
      // para que un modelo colgado no tumbe toda la request.
      const { output } = await Promise.race([
        ai.generate({
          model,
          prompt,
          output: { schema: CombinedAnalysisSchema },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`analyzeCombined(${model}) timeout 70s`)), 70_000)
        ),
      ]);
      if (output) {
        console.log(`[Nimbus] analyzeCombined succeeded via ${model}`);
        return output as CombinedAnalysis;
      }
      console.warn(`[Nimbus] analyzeCombined ${model} returned null output`);
    } catch (e: any) {
      lastError = e;
      console.warn(`[Nimbus] analyzeCombined ${model} failed: ${e?.message?.substring(0, 200)}`);
      if (/429|rate.?limit|quota|exhausted|timeout|ETIMEDOUT|503|502|500|UNAVAILABLE|unavailable|aborted|all models failed/i.test(e?.message || '')) {
        continue;
      }
      throw e;
    }
  }

  throw lastError || new Error('All models failed in analyzeCombined');
}
