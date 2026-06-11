/* ========================================================================
   APP — UI Controller
   - Wizard 8 pasos
   - Canvas synapse background
   - Report rendering (gauge, timeline, semáforo, stack)
   - Share, email, print
   ======================================================================== */

(() => {
  'use strict';

  // === STATE ===
  const state = {
    step: 1,
    totalSteps: 8,
    data: {
      age: 35,
      gender: null,
      weight: 70,
      goals: [],
      sleep: 5,
      energy: 5,
      stress: 5,
      diet: null,
      activity: null,
      alcohol: null,
      currentSupps: [],
      meds: [],
      conditions: [],
      budget: null,
    },
    report: null
  };

  // === CANVAS BACKGROUND (synapse network) ===
  function initCanvas() {
    const canvas = document.getElementById('synapse-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];
    let animId;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.r = Math.random() * 1.5 + 0.5;
        this.color = Math.random() > 0.7 ? '#00ffd1' : '#b8ff3c';
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function init() {
      const count = Math.min(60, Math.floor((w * h) / 25000));
      particles = [];
      for (let i = 0; i < count; i++) particles.push(new Particle());
    }
    init();
    window.addEventListener('resize', init);

    function drawLines() {
      const maxDist = 130;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * 0.25;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(184, 255, 60, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function loop() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => { p.update(); p.draw(); });
      drawLines();
      animId = requestAnimationFrame(loop);
    }
    loop();
  }

  // === WIZARD NAVIGATION ===
  function goToStep(n) {
    if (n < 1 || n > state.totalSteps) return;
    if (n > state.step && !validateStep(state.step)) {
      shakeStep();
      return;
    }
    document.querySelectorAll('.step').forEach(el => el.classList.add('hidden'));
    const next = document.querySelector(`.step[data-step="${n}"]`);
    if (next) {
      next.classList.remove('hidden');
      next.classList.remove('animate-slide-up');
      void next.offsetWidth;
      next.classList.add('animate-slide-up');
    }
    state.step = n;
    updateProgress();
    updateNav();
  }

  function validateStep(n) {
    const d = state.data;
    switch (n) {
      case 1: return true; // age always valid
      case 2: return d.gender !== null;
      case 3: return d.goals.length > 0;
      case 4: return true; // sliders always valid
      case 5: return d.diet !== null && d.activity !== null && d.alcohol !== null;
      case 6: return true; // supps optional
      case 7: return d.meds.length > 0 && d.conditions.length > 0;
      case 8: return d.budget !== null;
      default: return true;
    }
  }

  function shakeStep() {
    const container = document.getElementById('step-container');
    container.classList.remove('animate-slide-up');
    container.style.animation = 'none';
    void container.offsetWidth;
    container.style.animation = 'shake 0.4s';
    setTimeout(() => { container.style.animation = ''; }, 400);
  }

  function updateProgress() {
    const pct = Math.round((state.step - 1) / state.totalSteps * 100);
    document.getElementById('step-current').textContent = state.step;
    document.getElementById('step-total').textContent = state.totalSteps;
    document.getElementById('step-percent').textContent = pct;
    document.getElementById('progress-bar').style.width = `${pct}%`;

    // Update next button label
    const label = document.getElementById('btn-next-label');
    label.textContent = state.step === state.totalSteps ? 'Generar reporte' : 'Siguiente';

    // Back button visibility
    const back = document.getElementById('btn-back');
    if (state.step > 1) back.classList.remove('hidden');
    else back.classList.add('hidden');
  }

  function updateNav() {
    const valid = validateStep(state.step);
    document.getElementById('btn-next').disabled = !valid;
    const hint = document.getElementById('nav-hint');
    if (valid) hint.classList.add('hidden');
    else hint.classList.remove('hidden');
  }

  // === GOALS RENDERING ===
  function renderGoals() {
    const container = document.getElementById('goals-group');
    if (!container) return;
    container.innerHTML = '';
    window.GOALS_LIST.forEach(g => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.dataset.value = g.id;
      btn.innerHTML = `<span class="font-mono text-xs mr-1.5 text-faint">${g.icon}</span>${g.label}`;
      btn.addEventListener('click', () => toggleGoal(g.id, btn));
      container.appendChild(btn);
    });
  }

  function toggleGoal(id, btn) {
    const idx = state.data.goals.indexOf(id);
    if (idx >= 0) {
      state.data.goals.splice(idx, 1);
      btn.classList.remove('selected');
    } else {
      if (state.data.goals.length >= 4) {
        showToast('Máximo 4 objetivos. Enfócate = mejor stack.');
        return;
      }
      state.data.goals.push(id);
      btn.classList.add('selected');
    }
    document.getElementById('goals-count').textContent = state.data.goals.length;
    updateNav();
  }

  // === CHIPS GROUPS (gender, diet, activity, alcohol, meds, conditions, budget) ===
  function setupChipGroup(groupId, stateKey, multi = true, noneValue = 'none') {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.value;
        if (multi) {
          if (val === noneValue) {
            state.data[stateKey] = [noneValue];
            group.querySelectorAll('.chip').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
          } else {
            // Remove "none" if present
            state.data[stateKey] = state.data[stateKey].filter(v => v !== noneValue);
            const idx = state.data[stateKey].indexOf(val);
            if (idx >= 0) {
              state.data[stateKey].splice(idx, 1);
              btn.classList.remove('selected');
            } else {
              state.data[stateKey].push(val);
              btn.classList.add('selected');
            }
            // If empty, auto-select none
            if (state.data[stateKey].length === 0) {
              state.data[stateKey] = [noneValue];
              const noneBtn = group.querySelector(`[data-value="${noneValue}"]`);
              if (noneBtn) noneBtn.classList.add('selected');
            }
          }
        } else {
          state.data[stateKey] = val;
          group.querySelectorAll('.chip').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        }
        updateNav();
      });
    });
  }

  // === SUPPLEMENT SEARCH ===
  function setupSuppSearch() {
    const search = document.getElementById('supp-search');
    const results = document.getElementById('supp-results');
    const selected = document.getElementById('supp-selected');
    const skipBtn = document.getElementById('btn-skip-supp');

    function render() {
      const q = (search.value || '').toLowerCase();
      const filtered = window.SUPPLEMENTS_DB.filter(s => {
        if (state.data.currentSupps.includes(s.id)) return false;
        if (!q) return true;
        return s.name.toLowerCase().includes(q) || (s.aliases || []).some(a => a.includes(q));
      }).slice(0, 12);

      results.innerHTML = '';
      if (filtered.length === 0) {
        results.innerHTML = '<div class="p-3 text-xs text-faint font-mono">No encontrado. Prueba "magnesio", "ashwa"...</div>';
        return;
      }
      filtered.forEach(s => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'w-full text-left px-3 py-2 hover:bg-surface-2 flex items-center justify-between gap-2 text-sm border-b border-border/50 last:border-0';
        item.innerHTML = `
          <div>
            <div class="text-ink font-medium">${s.name}</div>
            <div class="text-[10px] font-mono text-faint">${s.dose} · ${s.timing.replace(/_/g, ' ')}</div>
          </div>
          <span class="text-lime text-lg font-mono">+</span>
        `;
        item.addEventListener('click', () => {
          state.data.currentSupps.push(s.id);
          search.value = '';
          renderSelected();
          render();
        });
        results.appendChild(item);
      });
    }

    function renderSelected() {
      selected.innerHTML = '';
      state.data.currentSupps.forEach(id => {
        const s = window.SUPPLEMENTS_DB.find(x => x.id === id);
        if (!s) return;
        const pill = document.createElement('span');
        pill.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-lime/10 border border-lime/30 text-lime text-xs font-mono';
        pill.innerHTML = `${s.name} <button type="button" class="hover:text-ink">×</button>`;
        pill.querySelector('button').addEventListener('click', () => {
          state.data.currentSupps = state.data.currentSupps.filter(x => x !== id);
          renderSelected();
          render();
        });
        selected.appendChild(pill);
      });
    }

    if (search) {
      search.addEventListener('input', render);
      render();
      renderSelected();
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        state.data.currentSupps = [];
        renderSelected();
        render();
      });
    }
  }

  // === SLIDERS BINDING ===
  function setupSliders() {
    const bindSlider = (id, displayId, stateKey) => {
      const slider = document.getElementById(id);
      const display = document.getElementById(displayId);
      if (!slider || !display) return;
      slider.addEventListener('input', e => {
        const v = +e.target.value;
        state.data[stateKey] = v;
        display.textContent = v;
      });
    };
    bindSlider('age', 'age-display', 'age');
    bindSlider('weight', 'weight-display', 'weight');
    bindSlider('sleep', 'sleep-display', 'sleep');
    bindSlider('energy', 'energy-display', 'energy');
    bindSlider('stress', 'stress-display', 'stress');
  }

  // === START WIZARD ===
  function startWizard() {
    document.getElementById('hero').classList.add('hidden');
    document.getElementById('wizard').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateProgress();
    updateNav();
  }

  // === SUBMIT (analyze) ===
  async function submit() {
    document.getElementById('wizard').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const log = document.getElementById('loading-log');
    const status = document.getElementById('loading-status');
    const addLog = (msg, type = 'info') => {
      const colors = { info: 'text-dim', ok: 'text-ok', warn: 'text-warn', danger: 'text-danger', accent: 'text-cyan' };
      const prefix = type === 'ok' ? '✓' : type === 'warn' ? '⚠' : type === 'danger' ? '✗' : '>';
      const line = document.createElement('div');
      line.className = colors[type] || colors.info;
      line.textContent = `${prefix} ${msg}`;
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
    };

    // Animate log
    addLog('Inicializando motor de reglas v1.0', 'info');
    await sleep(300);
    addLog(`Cargando DB: ${window.SUPPLEMENTS_DB.length} suplementos, ${window.INTERACTIONS_DB.length} interacciones`, 'info');
    await sleep(200);
    status.textContent = '> Cruzando perfil con base de datos';
    addLog(`Perfil: ${state.data.age} años, ${state.data.goals.length} objetivos, ${state.data.currentSupps.length} suplementos actuales`, 'info');
    await sleep(300);

    // Run engine
    const report = window.Engine.analyze(state.data);
    state.report = report;

    addLog('--- Análisis completado ---', 'accent');
    addLog(`Score: ${report.score}/100 (${report.tier})`, report.tierColor);
    addLog(`Interacciones críticas: ${report.criticalCount}`, report.criticalCount > 0 ? 'danger' : 'ok');
    addLog(`Advertencias: ${report.warningCount}`, report.warningCount > 0 ? 'warn' : 'ok');
    addLog(`Sinergias: ${report.synergyCount}`, 'ok');
    await sleep(300);
    addLog(`Esenciales generados: ${report.essentials.length}`, 'ok');
    addLog(`Opcionales generados: ${report.optionals.length}`, 'ok');
    addLog(`Costo estimado: $${report.cost.low}–$${report.cost.high}/mes`, 'info');
    await sleep(400);

    // Optional AI
    if (window.AI.isConfigured()) {
      status.textContent = '> Solicitando análisis a IA';
      addLog('API key detectada — llamando a LLM...', 'accent');
      const insight = await window.AI.getInsight(state.data, report);
      if (insight) {
        report.aiInsight = insight;
        addLog('IA devolvió análisis profundo ✓', 'ok');
      } else {
        addLog('IA no disponible — usando análisis local', 'warn');
      }
    } else {
      addLog('Sin API key — análisis local completo', 'info');
    }
    await sleep(300);

    status.textContent = '> Renderizando reporte...';
    await sleep(400);

    // Hide loading, show report
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('report').classList.remove('hidden');
    renderReport(report);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update URL for share
    updateShareUrl();
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // === RENDER REPORT ===
  function renderReport(report) {
    // 1) GAUGE
    renderGauge(report.score, report.tierColor);

    // 2) EXEC SUMMARY
    const summaryEl = document.getElementById('exec-summary');
    summaryEl.innerHTML = report.summary.map(b => `
      <div class="flex items-start gap-2.5">
        <span class="w-1.5 h-1.5 rounded-full bg-lime mt-2 flex-shrink-0"></span>
        <p>${b}</p>
      </div>
    `).join('');

    // 3) INTERACTIONS
    renderInteractions(report);

    // 4) TIMELINE
    renderTimeline(report.schedule);

    // 5) STACK
    renderStack(report);

    // 6) COST
    const costEl = document.getElementById('cost-estimate');
    costEl.querySelector('.text-lime').textContent = `$${report.cost.low} – $${report.cost.high}/mes`;

    // 7) AI INSIGHT
    if (report.aiInsight) {
      const aiSection = document.getElementById('ai-insight-section');
      const aiContent = document.getElementById('ai-insight');
      aiSection.classList.remove('hidden');
      aiContent.innerHTML = simpleMarkdown(report.aiInsight);
    }

    // 8) AFFILIATE CARDS
    renderAffiliate(report);
  }

  function renderGauge(score, color) {
    const container = document.getElementById('gauge-container');
    const radius = 90;
    const circumference = Math.PI * radius; // half circle
    const offset = circumference - (score / 100) * circumference;

    const colors = {
      ok: '#4dff7c',
      lime: '#b8ff3c',
      warn: '#ffb84d',
      danger: '#ff4d4d',
    };
    const stroke = colors[color] || colors.lime;

    container.innerHTML = `
      <svg viewBox="0 0 220 130" class="w-full h-full">
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="${stroke}" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="${stroke}" stop-opacity="1"/>
          </linearGradient>
        </defs>
        <!-- Track -->
        <path d="M 20 110 A ${radius} ${radius} 0 0 1 200 110" fill="none" stroke="#1a2820" stroke-width="14" stroke-linecap="round"/>
        <!-- Fill -->
        <path id="gauge-fill-path" d="M 20 110 A ${radius} ${radius} 0 0 1 200 110" fill="none" stroke="url(#gauge-grad)" stroke-width="14" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" style="filter: drop-shadow(0 0 8px ${stroke});"/>
        <!-- Ticks -->
        ${[0, 25, 50, 75, 100].map(v => {
          const angle = Math.PI - (v / 100) * Math.PI;
          const x1 = 110 + Math.cos(angle) * 105;
          const y1 = 110 - Math.sin(angle) * 105;
          const x2 = 110 + Math.cos(angle) * 115;
          const y2 = 110 - Math.sin(angle) * 115;
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2a3a30" stroke-width="1"/>`;
        }).join('')}
        <!-- Score text -->
        <text x="110" y="95" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="48" fill="${stroke}" id="gauge-num">0</text>
        <text x="110" y="115" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#5a6e62" letter-spacing="2">/ 100</text>
      </svg>
    `;

    // Animate
    setTimeout(() => {
      const fillPath = document.getElementById('gauge-fill-path');
      const numEl = document.getElementById('gauge-num');
      fillPath.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)';
      fillPath.style.strokeDashoffset = offset;

      // Count up
      let current = 0;
      const target = score;
      const duration = 1500;
      const start = Date.now();
      function tick() {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        current = Math.round(eased * target);
        numEl.textContent = current;
        if (progress < 1) requestAnimationFrame(tick);
      }
      tick();
    }, 100);

    // Tier
    const tierEl = document.getElementById('score-tier');
    tierEl.textContent = report_tierText(score);
    tierEl.style.color = stroke;
  }

  function report_tierText(score) {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Mejorable';
    return 'Necesita atención';
  }

  function renderInteractions(report) {
    const list = document.getElementById('interactions-list');
    const counter = document.getElementById('interactions-counter');
    const total = report.interactions.length;
    counter.innerHTML = `<span class="text-danger font-bold">${report.criticalCount}</span> críticas · <span class="text-warn font-bold">${report.warningCount}</span> adv. · <span class="text-ok font-bold">${report.synergyCount}</span> sinergias`;

    if (total === 0) {
      list.innerHTML = `
        <div class="interaction-item safe">
          <div class="interaction-icon">✓</div>
          <div>
            <div class="font-medium">Sin interacciones detectadas</div>
            <div class="text-xs text-dim mt-0.5">Tu stack actual no presenta conflictos conocidos en nuestra base de datos.</div>
          </div>
        </div>
      `;
      return;
    }

    list.innerHTML = report.interactions.map(i => {
      const icon = i.severity === 'critical' ? '!' : i.severity === 'warning' ? '⚠' : i.severity === 'safe' ? '+' : 'i';
      const cls = i.severity === 'safe' ? 'safe' : i.severity;
      const itemsLabel = (i.items || []).map(it => {
        const supp = window.SUPPLEMENTS_DB.find(s => s.id === it);
        return supp ? supp.name : it;
      }).join(' + ');
      return `
        <div class="interaction-item ${cls}">
          <div class="interaction-icon">${icon}</div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-ink">${i.title}</div>
            <div class="text-xs text-dim mt-0.5">${i.detail}</div>
            ${i.recommendation ? `<div class="text-xs text-cyan mt-1.5 font-mono">→ ${i.recommendation}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderTimeline(schedule) {
    const container = document.getElementById('timeline');
    if (!schedule || schedule.length === 0) {
      container.innerHTML = '<div class="text-dim text-sm">No hay suplementos para programar.</div>';
      return;
    }

    // Build horizontal timeline 0-24h
    const startHour = 6, endHour = 24;
    const totalSpan = endHour - startHour;
    const pxPerHour = 50; // total width
    const totalWidth = totalSpan * pxPerHour;

    const hourToPercent = (h) => ((h - startHour) / totalSpan) * 100;

    const hours = [];
    for (let h = startHour; h <= endHour; h++) {
      hours.push(h);
    }

    const now = new Date();
    const nowHour = now.getHours() + now.getMinutes() / 60;
    const showNow = nowHour >= startHour && nowHour <= endHour;
    const nowPct = hourToPercent(nowHour);

    const trackHtml = `
      <div class="timeline-track" style="width: ${totalWidth}px;">
        ${hours.map(h => {
          const pct = hourToPercent(h);
          return `<div class="timeline-hour" style="left: ${pct}%"></div><div class="timeline-hour-label" style="left: ${pct}%">${String(h).padStart(2, '0')}:00</div>`;
        }).join('')}
        ${showNow ? `<div class="timeline-now" style="left: ${nowPct}%"></div>` : ''}
      </div>
    `;

    // Pills
    const slotPositions = ['morning_empty', 'morning_with_fat', 'morning_with_food', 'morning_with_caffeine', 'anytime', 'anytime_with_food', 'afternoon', 'pre_workout', 'evening_with_food', 'evening', 'with_meals', '30min_before_bed'];
    const slotToTrack = { morning_empty: 0, morning_with_fat: 1, morning_with_food: 1, morning_with_caffeine: 1, anytime: 2, anytime_with_food: 2, afternoon: 2, pre_workout: 4, evening_with_food: 5, evening: 6, with_meals: 3, '30min_before_bed': 7 };
    const timeToHour = {
      morning_empty: 7, morning_with_fat: 8, morning_with_food: 8.5, morning_with_caffeine: 8,
      anytime: 12, anytime_with_food: 12, afternoon: 14, pre_workout: 17,
      evening_with_food: 19, evening: 21, with_meals: 13, '30min_before_bed': 22.5,
    };

    let pillsHtml = '';
    for (const slot of schedule) {
      const startH = timeToHour[slot.key] || 12;
      const endH = startH + 0.5;
      const leftPct = hourToPercent(startH);
      const widthPct = ((endH - startH) / totalSpan) * 100;

      const trackIdx = slotToTrack[slot.key] ?? 0;
      const topOffset = 8 + (trackIdx % 3) * 24;

      for (const pill of slot.pills) {
        const cls = trackIdx < 2 ? 'morning' : trackIdx < 5 ? 'afternoon' : 'evening';
        pillsHtml += `
          <div class="timeline-pill ${cls}" style="position: absolute; left: ${leftPct}%; top: ${topOffset}px; max-width: ${widthPct}%;" title="${pill.name} — ${pill.dose}">
            <span class="truncate">${pill.name}</span>
          </div>
        `;
      }
    }

    container.innerHTML = `
      <div class="relative" style="height: 110px; padding-top: 4px; padding-bottom: 24px;">
        <div style="position: relative; height: 110px;">
          ${trackHtml}
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 24px;">
            ${pillsHtml}
          </div>
        </div>
      </div>
    `;
  }

  function renderStack(report) {
    const list = document.getElementById('stack-list');
    const all = [...report.essentials, ...report.optionals, ...report.toAvoid];

    if (all.length === 0) {
      list.innerHTML = '<div class="text-dim text-sm">No hay recomendaciones.</div>';
      return;
    }

    list.innerHTML = all.map(item => {
      const supp = item.supp;
      const reasonText = (item.reasons || []).map(r => {
        const goal = window.GOALS_LIST.find(g => g.id === r.goal);
        const goalLabel = goal ? goal.label : r.goal;
        return `<span class="text-cyan">${goalLabel}</span>`;
      }).join(' · ');

      if (item.tier === 'avoid') {
        return `
          <div class="stack-card avoid">
            <div class="flex items-start gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="badge">Evitar / Reemplazar</span>
                  <h3 class="font-display font-bold text-lg">${supp.name}</h3>
                </div>
                <div class="text-sm text-danger">${item.reason}</div>
                ${item.alternative ? `<div class="text-xs text-dim mt-1">→ Alternativa: <span class="text-ok">${item.alternative.name}</span></div>` : ''}
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="stack-card ${item.tier}">
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="badge">${item.tier === 'essential' ? 'Esencial' : 'Opcional'}</span>
                <h3 class="font-display font-bold text-lg">${supp.name}</h3>
                <span class="text-[10px] font-mono text-faint uppercase tracking-widest ml-auto">${supp.evidence} evidence</span>
              </div>
              <div class="text-sm text-ink mb-1"><span class="font-mono text-xs text-lime">${supp.dose}</span></div>
              <div class="text-xs text-dim mb-2">${supp.description}</div>
              ${reasonText ? `<div class="text-[10px] font-mono text-faint uppercase tracking-widest">// Por qué: ${reasonText}</div>` : ''}
              <div class="text-[10px] font-mono text-faint uppercase tracking-widest mt-1">// Timing: ${supp.timing.replace(/_/g, ' ')}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderAffiliate(report) {
    const container = document.getElementById('affiliate-list');
    const ids = [
      ...report.essentials.map(s => s.id),
      ...report.optionals.slice(0, 4).map(s => s.id)
    ];
    const cards = window.Affiliate.buildCards(ids, 9);

    if (cards.length === 0) {
      container.innerHTML = '<div class="text-dim text-sm col-span-full">No hay productos para mostrar.</div>';
      return;
    }

    container.innerHTML = cards.map(c => `
      <div class="aff-card">
        <div class="aff-card-img">${(c.name[0] || '?').toUpperCase()}</div>
        <div class="flex items-center gap-1.5">
          <span class="aff-card-store amazon">Amazon</span>
        </div>
        <div>
          <div class="font-display font-bold text-sm leading-tight">${c.brand}</div>
          <div class="text-xs text-dim mt-0.5 line-clamp-2">${c.name}</div>
        </div>
        <div class="text-[10px] font-mono text-faint">${window.SUPPLEMENTS_DB.find(s => s.id === c.id)?.dose || ''}</div>
        <a href="${c.amazonUrl}" target="_blank" rel="nofollow sponsored" class="aff-card-cta amazon">
          Ver en Amazon
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
        </a>
      </div>
    `).join('');
  }

  // === SIMPLE MARKDOWN ===
  function simpleMarkdown(text) {
    return text
      .replace(/###\s+(.+)/g, '<h3>$1</h3>')
      .replace(/##\s+(.+)/g, '<h2>$1</h2>')
      .replace(/#\s+(.+)/g, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>')
      .replace(/^-\s+(.+)$/gm, '<li>$1</li>')
      .replace(/^\*\s+(.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^([^<].*)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[1-3]>.*<\/h[1-3]>)<\/p>/g, '$1')
      .replace(/<p>(<ol>.*<\/ol>)<\/p>/gs, '$1')
      .replace(/<p>(<li>.*<\/li>)<\/p>/gs, '$1');
  }

  // === SHARE / PRINT / RETAKE ===
  function updateShareUrl() {
    try {
      const compressed = btoa(encodeURIComponent(JSON.stringify(state.data)));
      const url = new URL(window.location);
      url.searchParams.set('s', compressed);
      window.history.replaceState({}, '', url);
    } catch (e) {
      console.warn('Share URL update failed', e);
    }
  }

  function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('s');
    if (s) {
      try {
        const data = JSON.parse(decodeURIComponent(atob(s)));
        Object.assign(state.data, data);
        return true;
      } catch (e) {
        console.warn('Load from URL failed', e);
      }
    }
    return false;
  }

  async function shareReport() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi Radar de Suplementos',
          text: `Mi Stack Score: ${state.report.score}/100. Descubre el tuyo:`,
          url
        });
        return;
      } catch (e) { /* fallback */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copiado al portapapeles ✓');
    } catch (e) {
      showToast('Copia el link manualmente de la URL');
    }
  }

  function printReport() {
    window.print();
  }

  function retake() {
    state.data = {
      age: 35, gender: null, weight: 70, goals: [], sleep: 5, energy: 5, stress: 5,
      diet: null, activity: null, alcohol: null, currentSupps: [], meds: [], conditions: [], budget: null,
    };
    state.step = 1;
    state.report = null;
    document.getElementById('report').classList.add('hidden');
    document.getElementById('hero').classList.remove('hidden');
    // Reset UI
    document.querySelectorAll('.chip.selected').forEach(c => c.classList.remove('selected'));
    document.getElementById('supp-selected').innerHTML = '';
    document.getElementById('supp-search').value = '';
    document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
    document.querySelector('.step[data-step="1"]').classList.remove('hidden');
    // Reset sliders
    ['age', 'weight', 'sleep', 'energy', 'stress'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.dispatchEvent(new Event('input'));
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Clean URL
    const url = new URL(window.location);
    url.searchParams.delete('s');
    window.history.replaceState({}, '', url);
  }

  // === EMAIL GATE ===
  function setupEmailGate() {
    const btn = document.getElementById('btn-email-send');
    const input = document.getElementById('email-input');
    const status = document.getElementById('email-status');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const email = input.value.trim();
      if (!email || !email.includes('@')) {
        status.classList.remove('hidden');
        status.textContent = 'Email inválido';
        status.classList.add('text-danger');
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Enviando...';
      status.classList.remove('hidden');
      status.textContent = 'Generando PDF...';
      status.classList.remove('text-danger');
      status.classList.add('text-dim');

      try {
        // Try Formspree (replace with your endpoint)
        // Or just use mailto: as simple fallback
        const subject = encodeURIComponent(`Mi Radar de Suplementos — Score ${state.report.score}/100`);
        const body = encodeURIComponent(buildEmailBody());
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        status.textContent = '✓ Cliente de email abierto. Revisa tu bandeja.';
      } catch (e) {
        status.textContent = 'Hubo un error. Intenta de nuevo.';
      }
      btn.disabled = false;
      btn.textContent = 'Enviar reporte';
    });
  }

  function buildEmailBody() {
    const r = state.report;
    let body = `MI RADAR DE SUPLEMENTOS\nStack Score: ${r.score}/100 (${r.tier})\n\n`;
    body += `RESUMEN:\n${r.summary.join('\n')}\n\n`;
    body += `STACK ESENCIAL:\n`;
    r.essentials.forEach(s => {
      body += `- ${s.supp.name} (${s.supp.dose})\n`;
    });
    body += `\nTIMELINE:\n`;
    r.schedule.forEach(slot => {
      body += `${slot.time} (${slot.label}): ${slot.pills.map(p => p.name).join(', ')}\n`;
    });
    if (r.interactions.length > 0) {
      body += `\nINTERACCIONES:\n`;
      r.interactions.forEach(i => {
        body += `- [${i.severity}] ${i.title}\n`;
      });
    }
    body += `\n---\nDisclaimer: Esta herramienta provee información educativa. No es consejo médico.`;
    return body;
  }

  // === TOAST ===
  let toastTimeout;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toast-text');
    text.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.add('hidden'), 2500);
  }

  // === SHAKE KEYFRAME (injected) ===
  function injectShakeKeyframe() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }
    `;
    document.head.appendChild(style);
  }

  // === INIT ===
  function init() {
    injectShakeKeyframe();
    initCanvas();
    renderGoals();
    setupSliders();
    setupChipGroup('gender-group', 'gender', false);
    setupChipGroup('diet-group', 'diet', false);
    setupChipGroup('activity-group', 'activity', false);
    setupChipGroup('alcohol-group', 'alcohol', false);
    setupChipGroup('meds-group', 'meds', true);
    setupChipGroup('conditions-group', 'conditions', true);
    setupChipGroup('budget-group', 'budget', false);
    setupSuppSearch();
    setupEmailGate();

    document.getElementById('btn-start').addEventListener('click', startWizard);
    document.getElementById('btn-next').addEventListener('click', () => {
      if (state.step === state.totalSteps) submit();
      else goToStep(state.step + 1);
    });
    document.getElementById('btn-back').addEventListener('click', () => goToStep(state.step - 1));
    document.getElementById('btn-share').addEventListener('click', shareReport);
    document.getElementById('btn-print').addEventListener('click', printReport);
    document.getElementById('btn-retake').addEventListener('click', retake);

    // Initial state
    if (loadFromUrl()) {
      // Auto-submit if loaded from URL
      setTimeout(() => submit(), 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
