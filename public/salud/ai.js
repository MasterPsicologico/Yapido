/* ========================================================================
   AI WRAPPER — Optional LLM enhancement
   Falls back to local engine if no API key configured.
   Supports: Google Gemini, OpenAI-compatible, Anthropic
   ======================================================================== */

window.AI = (function() {

  // Read config from localStorage or env
  function getConfig() {
    try {
      const stored = localStorage.getItem('radar_ai_config');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    // Optional: allow global window var
    if (window.RADAR_AI_CONFIG) return window.RADAR_AI_CONFIG;
    return null;
  }

  function isConfigured() {
    const cfg = getConfig();
    return !!(cfg && cfg.provider && cfg.apiKey);
  }

  /**
   * Build a rich prompt for the LLM
   */
  function buildPrompt(input, report) {
    const sysPrompt = `Eres un asistente experto en biohacking, suplementación basada en evidencia y longevidad.
Tu tono: científico, directo, accionable, sin marketing exagerado.
Respondes SIEMPRE en español, con markdown limpio.
NO das consejo médico, siempre recuerdas que el usuario debe consultar con un profesional.
Cita estudios o protocolos reconocidos (Huberman, Attia, Sinclair, Examine.com) cuando sea relevante.
Se conciso. Máximo 500 palabras.`;

    const userContext = `
## PERFIL DEL USUARIO
- Edad: ${input.age} años
- Género: ${input.gender}
- Peso: ${input.weight}kg
- Objetivos: ${input.goals.map(g => g).join(', ')}
- Calidad de sueño: ${input.sleep}/10
- Energía: ${input.energy}/10
- Estrés: ${input.stress}/10
- Dieta: ${input.diet}
- Actividad: ${input.activity}
- Alcohol: ${input.alcohol}
- Suplementos actuales: ${input.currentSupps.length > 0 ? input.currentSupps.join(', ') : 'ninguno'}
- Medicaciones: ${input.meds.filter(m => m !== 'none').join(', ') || 'ninguna'}
- Condiciones: ${input.conditions.filter(c => c !== 'none').join(', ') || 'ninguna'}
- Presupuesto: ${input.budget}

## ANÁLISIS DEL MOTOR
- Stack Score: ${report.score}/100 (${report.tier})
- Interacciones críticas: ${report.criticalCount}
- Advertencias: ${report.warningCount}
- Sinergias: ${report.synergyCount}
- Esenciales recomendados: ${report.essentials.map(s => s.supp.name).join(', ') || 'ninguno'}
- Opcionales: ${report.optionals.map(s => s.supp.name).join(', ') || 'ninguno'}

## TU TAREA
Genera un análisis personalizado en markdown con estas 3 secciones (markdown limpio, sin HTML, usa ## para títulos):

### ## Diagnóstico
2-3 frases evaluando su protocolo actual. ¿Qué patrones observas? ¿Qué está haciendo bien y qué falta?

### ## Plan de acción (90 días)
Una lista numerada con 3-4 acciones concretas, priorizadas. Sé específico con dosis, timing y marcas si aplica.

### ## Insight clave
Una sola frase memorable que resuma la conclusión más importante que debería记住.

NO inventes suplementos que no estén en la lista. NO recomiendes algo contraindicado por las condiciones/medicaciones.
Mantén el tono: científico, directo, con autoridad.`;

    return { sysPrompt, userContext };
  }

  /**
   * Call Google Gemini API
   */
  async function callGemini(apiKey, sysPrompt, userContext) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sysPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userContext }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Call OpenAI-compatible API (OpenAI, Together, Groq, etc.)
   */
  async function callOpenAICompatible(cfg, sysPrompt, userContext) {
    const base = cfg.baseUrl || 'https://api.openai.com/v1';
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`
      },
      body: JSON.stringify({
        model: cfg.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userContext }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Public: get AI insight or null if not configured
   */
  async function getInsight(input, report) {
    const cfg = getConfig();
    if (!cfg) return null;

    const { sysPrompt, userContext } = buildPrompt(input, report);
    try {
      let text;
      if (cfg.provider === 'gemini') {
        text = await callGemini(cfg.apiKey, sysPrompt, userContext);
      } else {
        text = await callOpenAICompatible(cfg, sysPrompt, userContext);
      }
      return text;
    } catch (e) {
      console.warn('AI call failed:', e);
      return null;
    }
  }

  /**
   * Save config
   */
  function setConfig(cfg) {
    localStorage.setItem('radar_ai_config', JSON.stringify(cfg));
  }

  return { isConfigured, getInsight, setConfig, getConfig };
})();
