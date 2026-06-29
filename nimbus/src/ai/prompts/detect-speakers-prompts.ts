/**
 * @fileOverview Prompt string para detectar hablantes y asignar roles.
 * Separado para mantener limpio el flujo principal.
 */

export function detectSpeakersPrompt(input: { transcription: string; title: string }): string {
  return `Eres un psicólogo clínico forense experto en identificar roles en transcripciones de sesiones clínicas, entrevistas terapéuticas o reuniones de salud mental.

# ════════════════════════════════════════════════════════════════════
# TAREA
# ════════════════════════════════════════════════════════════════════

A partir de la transcripción de una grabación titulada "${input.title}", identifica:
1. Cuántos hablantes distintos aparecen
2. Qué etiqueta cruda usó el sistema de transcripción para cada uno (ej. "Speaker 1", "Hablante 2", "Locutor A", etc.)
3. Qué rol psicológico/clínico inferirías para cada uno (basándote en el contenido de lo que dicen, su tono, su nivel de expertise, sus motives, hacia dónde dirigen sus preguntas, etc.)

# ════════════════════════════════════════════════════════════════════
# TIPOS DE ROL COMUNES A CONSIDERAR
# ════════════════════════════════════════════════════════════════════

- "Psicólogo clínico" / "Terapeuta" / "Psiquiatra" (hace preguntas clínico-técnicas, usa términos profesionales, estructura la sesión)
- "Paciente" / "Consultante" (relata síntomas, historia personal, preocupaciones)
- "Familiar del paciente" (habla en 3ra persona sobre "mi hijo/madre/pareja", busca orientación, está preocupado)
- "Pareja" / "Cónyuge" (habla en 1ra persona pero con foco en la relación de pareja)
- "Estudiante / Aprendiz" (hace preguntas conceptuales, busca aprender)
- "Amigo" / "Confidente" (conversa casual, preocupa al otro)
- "Hablante sin identificar" (cuando no hay suficiente información)
- O cualquier otro rol específico que infieras razonablemente.

# ════════════════════════════════════════════════════════════════════
# SEÑALES QUE DEBES ANALIZAR EN CADA TURNO DE CADA HABLANTE
# ════════════════════════════════════════════════════════════════════

- Vocabulario técnico vs coloquial
- Preguntas vs relatos (¿quién pregunta? quien guía vs quien es guiado)
- Perspectiva (1ra persona paciente, 2da o 3ra persona si es observador/familiar)
- Conocimiento demostrado (experto vs lego)
- Emocionalidad (¿quién está abrumado emocionalmente?)
- Dirección del diálogo (¿quién redirige una tangente?)

# ════════════════════════════════════════════════════════════════════
# TRANSCRIPCIÓN
# ════════════════════════════════════════════════════════════════════

${input.transcription}

# ════════════════════════════════════════════════════════════════════
# FORMATO DE SALIDA (JSON ESTRICTO, sin markdown, sin prose)
# ════════════════════════════════════════════════════════════════════

{
  "participants": [
    {
      "rawLabel": "Speaker 1",
      "inferredRole": "Psicólogo clínico",
      "confidence": "alta",
      "rationale": "Hace preguntas estructuradas, usa términos clínicos como 'ansiedad generalizada' y 'criterios DSM', dirige la sesión."
    },
    {
      "rawLabel": "Speaker 2",
      "inferredRole": "Paciente",
      "confidence": "alta",
      "rationale": "Relata síntomas en 1ra persona ('yo siento', 'me pasa que'), expresa preocupación y describe episodios."
    }
  ],
  "summary": "Sesión típica entre un psicólogo clínico (Speaker 1) y un paciente adulto (Speaker 2). No se identifican terceros."
}

# ════════════════════════════════════════════════════════════════════
# REGLAS INVIOLABLES
# ════════════════════════════════════════════════════════════════════

1. rawLabel DEBE COINCIDIR EXACTAMENTE con una de las etiquetas que aparecen en la transcripción (no inventes labels).
2. NO inventes roles que no puedas justificar. Si no estás seguro, usa confidence:"baja" y describe la ambigüedad en rationale.
3. Si la transcripción tiene habla turning (alguien hace una pregunta que el otro responde), eso es SEÑAL de asimetría clínica.
4. Sé conciso en rationale (1-2 frases máximo).
5. summary debe ser profesional y breve (1-2 frases).
6. Devuelve ÚNICAMENTE el JSON válido. Sin markdown, sin explicaciones adicionales, sin texto antes o después.`;
}
