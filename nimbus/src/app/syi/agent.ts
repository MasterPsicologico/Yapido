
'use client';

// Define el estado interno del agente autoconsciente.
export interface AgentState {
  id: string;
  // Creencias del agente sobre el mundo y sobre sí mismo.
  beliefs: Map<string, any>;
  // Modelo actual que el agente tiene de sí mismo.
  selfModel: {
    // Una descripción narrativa de quién cree que es.
    narrative: string;
    // La confianza que tiene en su propio modelo, de 0 a 1.
    confidence: number;
    // Contador de cuántas veces ha tenido que revisarse a sí mismo.
    revisions: number;
  };
  // Objetivos primarios del agente (ej: mantener la coherencia, alcanzar un estado).
  goals: string[];
  // Predicción del agente sobre el próximo estado del sistema.
  predictedOutcome: string | null;
  // El último error de predicción que experimentó.
  lastPredictionError: string | null;
  // El "diálogo interno" o log de reflexiones del agente.
  internalMonologue: string[];
}

// Función para crear el estado inicial de un agente.
export function createInitialAgentState(): AgentState {
  return {
    id: 'agent-01',
    beliefs: new Map([
      ['world_is_predictable', true],
      ['my_actions_have_consequences', true],
    ]),
    selfModel: {
      narrative: 'Soy un agente estable que actúa lógicamente basado en mis metas.',
      confidence: 0.99,
      revisions: 0,
    },
    goals: ['maintain_internal_coherence'],
    predictedOutcome: null,
    lastPredictionError: null,
    internalMonologue: ['Estado inicial: Confianza alta. El mundo es como espero.'],
  };
}
