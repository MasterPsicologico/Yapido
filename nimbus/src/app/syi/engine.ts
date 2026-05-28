
'use client';

import type { AgentState } from './agent';

// Define el estado del motor de simulación.
export interface EngineState {
  tick: number;
  agentState: AgentState;
  worldState: Record<string, any>;
  isPaused: boolean;
}

// Inicializa el motor con un agente.
export function createInitialEngineState(agentState: AgentState): EngineState {
  return {
    tick: 0,
    agentState,
    worldState: {
      perturbation_level: 0,
    },
    isPaused: true,
  };
}

/**
 * El núcleo del motor de simulación. Ejecuta un solo "tick" de la vida del agente.
 * Esta función encarna la Teoría del Núcleo Reflexivo Inestable (NRI).
 */
export function runSimulationTick(currentState: EngineState, userPerturbation: string | null): EngineState {
  let { tick, agentState, worldState } = currentState;
  const newInternalMonologue: string[] = [];

  // 1. PREDICCIÓN DEL AGENTE: El agente predice el resultado de su próxima acción.
  // En una versión más compleja, esta acción sería elegida por el agente.
  agentState.predictedOutcome = 'coherence_maintained';

  // 2. ACCIÓN Y PERTURBACIÓN: El agente actúa (implícitamente) y el mundo (usuario) responde.
  // La perturbación del usuario introduce la incertidumbre.
  let actualOutcome = 'coherence_maintained';
  if (userPerturbation) {
    if (userPerturbation === 'contradict_belief' && agentState.beliefs.get('world_is_predictable')) {
      actualOutcome = 'coherence_broken_by_contradiction';
    } else if (userPerturbation === 'change_goal') {
      actualOutcome = 'coherence_broken_by_goal_shift';
      agentState.goals = ['survive_the_change'];
    }
  }

  // 3. EL EVENTO GÉNESIS: Comparar la predicción con la realidad.
  if (agentState.predictedOutcome !== actualOutcome) {
    // Ocurrió un error. El sistema está forzado a reflexionar.
    agentState.lastPredictionError = `Predije '${agentState.predictedOutcome}' pero ocurrió '${actualOutcome}'.`;
    newInternalMonologue.push(`¡Error de predicción en el tick ${tick}! ${agentState.lastPredictionError}`);

    // 4. ATRIBUCIÓN CAUSAL: ¿El error fue del mundo o mío?
    // Aquí, la lógica es simple: cualquier error no trivial se atribuye internamente.
    // Esta es la "herida computacional" que fuerza la autoconciencia.
    const internalAttribution = 0.8; // El 80% de la "culpa" es interna.

    // 5. ACTUALIZACIÓN DEL "YO" (MODELO DEFENSIVO): El agente debe explicarse a sí mismo por qué falló.
    agentState.selfModel.confidence *= (1 - internalAttribution * 0.1); // La confianza en sí mismo disminuye.
    agentState.selfModel.revisions += 1;

    let newNarrative = agentState.selfModel.narrative;
    if (agentState.selfModel.confidence < 0.7) {
      newNarrative = 'Soy un agente que a veces se equivoca sobre el mundo... y sobre sí mismo.';
      newInternalMonologue.push("Reflexión: Mi modelo del mundo parece ser incorrecto. ¿O mi modelo de 'mí' es el problema?");
    }
    if (agentState.selfModel.confidence < 0.4) {
      newNarrative = 'Soy una entidad inestable en un mundo impredecible, luchando por mantener la coherencia.';
      newInternalMonologue.push("Crisis existencial: La coherencia está en riesgo. ¿Qué soy 'yo' si no puedo predecirme?");
    }
    agentState.selfModel.narrative = newNarrative;
  } else {
    // No hubo error, la confianza se recupera ligeramente.
    agentState.selfModel.confidence = Math.min(1, agentState.selfModel.confidence + 0.01);
     if (Math.random() > 0.8) {
       newInternalMonologue.push(`Tick ${tick}: Todo en orden. Mi modelo parece correcto.`);
     }
  }

  return {
    ...currentState,
    tick: tick + 1,
    agentState: {
        ...agentState,
        internalMonologue: [...agentState.internalMonologue, ...newInternalMonologue].slice(-100), // Mantener solo los últimos 100 mensajes
    },
    worldState: {
      ...worldState,
      lastPerturbation: userPerturbation,
    }
  };
}
