/* ========================================================================
   ENGINE — Análisis local basado en reglas
   No requiere API. Genera el reporte base que después la IA puede enriquecer.
   ======================================================================== */

window.Engine = (function() {

  /**
   * Main analysis function
   * @param {Object} input User input from wizard
   * @returns {Object} report
   */
  function analyze(input) {
    const {
      age, gender, weight,
      goals = [],
      sleep, energy, stress,
      diet, activity, alcohol,
      currentSupps = [],
      meds = [],
      conditions = [],
      budget
    } = input;

    const allSuppIds = currentSupps;
    const allContexts = [...meds, ...conditions];

    // 1) INTERACTIONS
    const interactions = window.checkInteractions(allSuppIds, conditions, meds);
    const criticalCount = interactions.filter(i => i.severity === 'critical').length;
    const warningCount = interactions.filter(i => i.severity === 'warning').length;
    const synergyCount = interactions.filter(i => i.severity === 'safe').length;

    // 2) GOAL COVERAGE (calibrated to be realistic)
    const goalCoverage = {};
    let totalGoalScore = 0;

    for (const goalId of goals) {
      const mapping = window.GOAL_MAPPING[goalId] || [];
      const sorted = [...mapping].sort((a, b) => b.weight - a.weight);

      // Top 3 high-impact supplements for this goal
      const top3 = sorted.slice(0, 3);
      const top3Weight = top3.reduce((s, m) => s + m.weight, 0);
      const top3Achieved = top3.filter(m => allSuppIds.includes(m.id)).reduce((s, m) => s + m.weight, 0);

      // Base coverage from top 3 (60% of the goal)
      let coverage = top3Weight > 0 ? (top3Achieved / top3Weight) * 0.6 : 0.6;

      // Bonus for having the #1 essential (top weighted) — 25%
      if (sorted[0] && allSuppIds.includes(sorted[0].id)) {
        coverage += 0.25;
      }

      // Bonus for having secondary supplements — 15%
      const secondaryCovered = sorted.slice(1, 4).filter(m => allSuppIds.includes(m.id)).length;
      coverage += (secondaryCovered / 3) * 0.15;

      // Cap at 0.95 (always room for improvement)
      coverage = Math.min(coverage, 0.95);

      const recommended = [];
      for (const m of sorted) {
        if (allSuppIds.includes(m.id)) continue;
        const supp = window.SUPPLEMENTS_DB.find(s => s.id === m.id);
        if (supp && !hasContraindication(supp, conditions, meds)) {
          recommended.push({
            id: m.id,
            weight: m.weight,
            note: m.note,
            alreadyTaking: false
          });
        }
      }

      const covered = sorted.filter(m => allSuppIds.includes(m.id)).length;
      goalCoverage[goalId] = {
        coverage,
        covered,
        total: sorted.length,
        recommended: recommended.sort((a, b) => b.weight - a.weight).slice(0, 4)
      };
      totalGoalScore += coverage;
    }

    // Convert coverage (0-1) to score (0-100), with bonus for "no goals selected" (maintenance)
    const goalScore = goals.length > 0
      ? (totalGoalScore / goals.length) * 100
      : 60; // baseline for users with no specific goal

    // 3) RECOMMEND NEW SUPPLEMENTS
    const recommendedNew = generateRecommendations(input, goalCoverage, allSuppIds);
    const essentials = recommendedNew.filter(s => s.tier === 'essential');
    const optionals = recommendedNew.filter(s => s.tier === 'optional');
    const toAvoid = buildAvoidList(input, allSuppIds);

    // 4) TIMING SCHEDULE
    const schedule = buildSchedule([...currentSupps, ...essentials.map(s => s.id)], input);

    // 5) COST — low = solo esenciales (respeta budget), high = essentials + optionals
    const sumPrices = (arr) => arr.reduce((sum, s) => {
      const supp = window.SUPPLEMENTS_DB.find(x => x.id === s.id);
      return sum + (supp?.price_usd || 0);
    }, 0);
    const costLow = sumPrices(essentials);
    const costHigh = sumPrices([...essentials, ...optionals]);

    // 6) GLOBAL SCORE (0-100) — calibrated for realism
    // Formula: 70% goal coverage + 30% safety/synergy bonus
    const safetyBonus = Math.max(0, 30 - (criticalCount * 12) - (warningCount * 4));
    const synergyBonus = Math.min(10, synergyCount * 2);
    let score = Math.round(goalScore * 0.7 + safetyBonus + synergyBonus);

    // State-based adjustments
    if (allSuppIds.length === 0 && goals.length > 0) score -= 5; // no supps but has goals
    if (age >= 50 && !allSuppIds.includes('coq10')) score -= 3;
    if (sleep < 5 && !allSuppIds.includes('magnesium')) score -= 2;
    if (energy < 5 && !allSuppIds.includes('b_complex') && !allSuppIds.includes('b12')) score -= 2;
    if (allSuppIds.length > 12) score -= 5; // too many, signal of stack confusion

    score = Math.max(5, Math.min(100, score)); // floor at 5 (always some positive signal)

    // 7) TIER
    let tier = 'Crítico';
    let tierColor = 'danger';
    if (score >= 80) { tier = 'Excelente'; tierColor = 'ok'; }
    else if (score >= 60) { tier = 'Bueno'; tierColor = 'lime'; }
    else if (score >= 40) { tier = 'Mejorable'; tierColor = 'warn'; }
    else { tier = 'Necesita atención'; tierColor = 'danger'; }

    // 8) EXEC SUMMARY
    const summary = buildSummary({
      score, tier, criticalCount, warningCount, synergyCount,
      goalCount: goals.length, currentCount: allSuppIds.length,
      recommendedCount: essentials.length, age, sleep, energy, stress,
      interactions
    });

    return {
      score,
      tier,
      tierColor,
      interactions,
      criticalCount,
      warningCount,
      synergyCount,
      goalCoverage,
      essentials,
      optionals,
      toAvoid,
      schedule,
      cost: { low: costLow, high: costHigh },
      summary,
      input
    };
  }

  function hasContraindication(supp, conditions, meds) {
    const avoid = new Set([...(supp.avoid_with || []), ...(supp.warnings || [])]);
    for (const ctx of [...conditions, ...meds]) {
      if (ctx === 'none') continue;
      if (avoid.has(ctx)) return true;
    }
    return false;
  }

  function generateRecommendations(input, goalCoverage, currentSupps) {
    const candidates = new Map();
    const { age, diet, conditions = [], meds = [], budget } = input;

    // From goal coverage
    for (const goalId in goalCoverage) {
      for (const rec of goalCoverage[goalId].recommended) {
        if (currentSupps.includes(rec.id)) continue;
        const supp = window.SUPPLEMENTS_DB.find(s => s.id === rec.id);
        if (!supp) continue;
        if (hasContraindication(supp, conditions, meds)) continue;

        const existing = candidates.get(rec.id) || { id: rec.id, score: 0, supp };
        existing.score += rec.weight;
        existing.score += supp.priority ? (6 - supp.priority) * 0.2 : 0;
        if (existing.reasons === undefined) existing.reasons = [];
        existing.reasons.push({ goal: goalId, note: rec.note, weight: rec.weight });
        candidates.set(rec.id, existing);
      }
    }

    // From lifestyle gaps
    if (diet && window.LIFESTYLE_GAPS[diet]) {
      for (const suppId of window.LIFESTYLE_GAPS[diet]) {
        if (currentSupps.includes(suppId)) continue;
        const supp = window.SUPPLEMENTS_DB.find(s => s.id === suppId);
        if (!supp) continue;
        if (hasContraindication(supp, conditions, meds)) continue;
        const existing = candidates.get(suppId) || { id: suppId, score: 0, supp };
        existing.score += 0.4;
        if (existing.reasons === undefined) existing.reasons = [];
        existing.reasons.push({ goal: 'lifestyle', note: `Necesario para dieta ${diet}`, weight: 0.4 });
        candidates.set(suppId, existing);
      }
    }

    // From age gaps
    if (age >= 30) {
      const brackets = [30, 40, 50, 60, 70];
      for (const b of brackets) {
        if (age >= b && window.AGE_GAPS[b]) {
          for (const suppId of window.AGE_GAPS[b]) {
            if (currentSupps.includes(suppId)) continue;
            const supp = window.SUPPLEMENTS_DB.find(s => s.id === suppId);
            if (!supp) continue;
            if (hasContraindication(supp, conditions, meds)) continue;
            const existing = candidates.get(suppId) || { id: suppId, score: 0, supp };
            existing.score += 0.5;
            if (existing.reasons === undefined) existing.reasons = [];
            existing.reasons.push({ goal: 'age', note: `Crítico a partir de ${b} años`, weight: 0.5 });
            candidates.set(suppId, existing);
          }
        }
      }
    }

    // Budget filter
    const budgetMap = { under50: 50, '50to100': 100, '100to200': 200, '200plus': 9999 };
    const maxCost = budgetMap[budget] || 100;

    // Sort by score and assign tiers
    const sorted = [...candidates.values()].sort((a, b) => b.score - a.score);

    let totalCost = 0;
    const essentials = [];
    const optionals = [];

    for (const c of sorted) {
      const cost = c.supp.price_usd || 0;
      if (c.score >= 0.7 && (totalCost + cost) <= maxCost) {
        essentials.push(c);
        totalCost += cost;
      } else if (c.score >= 0.4) {
        optionals.push(c);
      } else if (c.score >= 0.25) {
        optionals.push(c);
      }
    }

    // Cap essentials at 7 to keep it actionable (beginner-friendly per Attia)
    if (essentials.length > 7) {
      optionals.unshift(...essentials.splice(7));
    }

    return [...essentials, ...optionals].map(c => ({
      id: c.id,
      tier: essentials.includes(c) ? 'essential' : 'optional',
      score: c.score,
      reasons: c.reasons.slice(0, 3),
      supp: c.supp
    }));
  }

  function buildAvoidList(input, currentSupps) {
    const avoid = [];
    const { conditions = [], meds = [], age, gender } = input;

    for (const suppId of currentSupps) {
      const supp = window.SUPPLEMENTS_DB.find(s => s.id === suppId);
      if (!supp) continue;

      // Check contraindications
      for (const ctx of [...conditions, ...meds]) {
        if (ctx === 'none') continue;
        if ((supp.avoid_with || []).includes(ctx) || (supp.warnings || []).includes(ctx)) {
          avoid.push({
            id: suppId,
            supp,
            reason: `Interactúa con: ${ctx}`,
            severity: 'critical',
            alternative: findAlternative(suppId, input)
          });
        }
      }

      // Age-specific
      if (supp.id === 'melatonin' && age < 25 && !meds.includes('none')) {
        // OK for young people, but check doses
      }
    }

    return avoid;
  }

  function findAlternative(suppId, input) {
    const supp = window.SUPPLEMENTS_DB.find(s => s.id === suppId);
    if (!supp) return null;
    // Find similar category supplement
    return window.SUPPLEMENTS_DB.find(s =>
      s.id !== suppId &&
      s.category === supp.category &&
      !hasContraindication(s, input.conditions || [], input.meds || [])
    );
  }

  function buildSchedule(suppIds, input) {
    const slots = {
      morning_empty: { time: '07:00', label: 'AM en ayunas', pills: [] },
      morning_with_fat: { time: '08:00', label: 'AM con desayuno graso', pills: [] },
      morning_with_food: { time: '08:30', label: 'AM con comida', pills: [] },
      pre_workout: { time: '17:00', label: 'Pre-entreno', pills: [] },
      afternoon: { time: '14:00', label: 'Tarde', pills: [] },
      evening_with_food: { time: '19:00', label: 'Con cena', pills: [] },
      evening: { time: '21:00', label: 'Noche', pills: [] },
      with_meals: { time: '13:00', label: 'Con comidas', pills: [] },
      anytime_with_food: { time: '12:00', label: 'Cualquier momento', pills: [] },
      anytime: { time: '12:00', label: 'Sin restricción', pills: [] },
      '30min_before_bed': { time: '22:30', label: '30 min antes de dormir', pills: [] },
      morning_with_caffeine: { time: '08:00', label: 'Con el café', pills: [] },
    };

    for (const id of suppIds) {
      const supp = window.SUPPLEMENTS_DB.find(s => s.id === id);
      if (!supp) continue;
      const timing = supp.timing;
      if (slots[timing]) {
        slots[timing].pills.push({
          id: supp.id,
          name: supp.name,
          dose: supp.dose
        });
      } else {
        slots.anytime.pills.push({ id: supp.id, name: supp.name, dose: supp.dose });
      }
    }

    return Object.entries(slots)
      .map(([key, slot]) => ({ key, ...slot }))
      .filter(s => s.pills.length > 0)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  function buildSummary(ctx) {
    const bullets = [];

    // Score commentary
    if (ctx.score >= 80) {
      bullets.push(`Tu stack actual es <strong>sólido</strong>. Score ${ctx.score}/100 con cobertura fuerte en tus objetivos.`);
    } else if (ctx.score >= 60) {
      bullets.push(`Tu stack está <strong>bien encaminado</strong> (${ctx.score}/100), pero hay mejoras claras.`);
    } else if (ctx.score >= 40) {
      bullets.push(`Tu protocolo tiene <strong>lagunas importantes</strong>. Score ${ctx.score}/100 —optimizable.`);
    } else {
      bullets.push(`Tu stack actual necesita <strong>atención urgente</strong>. Score ${ctx.score}/100.`);
    }

    // Interactions
    if (ctx.criticalCount > 0) {
      bullets.push(`<strong class="text-danger">Detectamos ${ctx.criticalCount} interacción${ctx.criticalCount > 1 ? 'es' : ''} crítica${ctx.criticalCount > 1 ? 's' : ''}</strong> que requieren acción inmediata.`);
    } else if (ctx.warningCount > 0) {
      bullets.push(`Hay <strong class="text-warn">${ctx.warningCount} advertencia${ctx.warningCount > 1 ? 's' : ''}</strong> de precaución en tu stack.`);
    } else {
      bullets.push(`<strong class="text-ok">Sin interacciones críticas</strong> detectadas en tu protocolo actual.`);
    }

    // Synergies
    if (ctx.synergyCount > 0) {
      bullets.push(`<strong class="text-cyan">${ctx.synergyCount} sinergia${ctx.synergyCount > 1 ? 's' : ''}</strong> detectada${ctx.synergyCount > 1 ? 's' : ''} en tu stack.`);
    }

    // Recommendations
    if (ctx.recommendedCount > 0) {
      bullets.push(`Recomendamos añadir <strong>${ctx.recommendedCount} esencial${ctx.recommendedCount > 1 ? 'es' : ''}</strong> basado en tus objetivos.`);
    }

    // State commentary
    if (ctx.sleep < 5) bullets.push(`Tu sueño (${ctx.sleep}/10) sugiere priorizar <strong>magnesio + glicina + ashwagandha</strong>.`);
    if (ctx.energy < 5) bullets.push(`Energía baja (${ctx.energy}/10): considera <strong>creatina + B-complex + hierro</strong> (si hay déficit).`);
    if (ctx.stress > 7) bullets.push(`Estrés alto (${ctx.stress}/10): el stack <strong>ashwagandha + magnesio + L-teanina</strong> es el más efectivo.`);

    return bullets;
  }

  return { analyze };
})();
