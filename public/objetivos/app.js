/* ════════════════════════════════════════════════════════════
   YAPIDO · PANEL DE OBJETIVOS — app.js
   Vanilla JS · localStorage + Firebase opcional
   ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Constantes del ecosistema ─────────────────────────
  const PROJECTS = [
    { id: 'general',   name: 'General',   icon: '🌐', color: '#c084fc', desc: 'Objetivos que abarcan todo el ecosistema Yapido' },
    { id: 'yapido',    name: 'Yapido',    icon: '🛒', color: '#6c5ce7', desc: 'Plataforma multi-rol: tiendas, lavadoras, delivery' },
    { id: 'cinestream',name: 'CineStream',icon: '🎬', color: '#fd79a8', desc: 'Catálogo y reproductor de películas' },
    { id: 'nimbus',    name: 'Nimbus',    icon: '🧠', color: '#ffeaa7', desc: 'Plataforma AI multi-herramienta' },
    { id: 'finanzas',  name: 'Finanzas',  icon: '💰', color: '#00cec9', desc: 'Gestión financiera personal con IA' },
    { id: 'movilidad', name: 'Movilidad', icon: '🛵', color: '#ff7e5f', desc: 'Yapido Movilidad (Aguachica, ride-sharing)' },
  ];

  // ─── Schemas de datos esperados por tipo de objetivo ───
  // Se usan para generar el formulario de "Confirmar completado"
  const EXPECTED_DATA_SCHEMAS = {
    generic: [
      { key: 'summary',     label: 'Resumen de lo logrado',  type: 'textarea', required: true },
      { key: 'kpi_value',   label: 'KPI / métrica lograda',   type: 'text' },
      { key: 'evidence',    label: 'URL o evidencia (opcional)', type: 'text' },
    ],
    integration_partner: [
      { key: 'partner_name',    label: 'Nombre del socio/proveedor', type: 'text', required: true },
      { key: 'contact',         label: 'Contacto (WhatsApp / email)', type: 'text', required: true },
      { key: 'items_count',     label: 'Cantidad de items / equipos / servicios', type: 'number', required: true },
      { key: 'location',        label: 'Ciudad / zona',               type: 'text' },
      { key: 'agreed_rate',     label: 'Tarifa / precio acordado',    type: 'text' },
      { key: 'start_date',      label: 'Fecha de inicio acordada',    type: 'date' },
      { key: 'notes',           label: 'Notas / términos especiales',type: 'textarea' },
    ],
    user_acquisition: [
      { key: 'user_name',     label: 'Nombre del usuario/conductor', type: 'text', required: true },
      { key: 'user_type',     label: 'Tipo', type: 'select', options: ['Conductor moto','Conductor auto','Pasajero','Tienda','Socio','Terapeuta','Creador'], required: true },
      { key: 'city',          label: 'Ciudad', type: 'text' },
      { key: 'phone',         label: 'Teléfono', type: 'text' },
      { key: 'signup_date',   label: 'Fecha de alta', type: 'date' },
      { key: 'kyc_status',    label: 'Estado KYC / verificación', type: 'select', options: ['Pendiente','En revisión','Aprobado','Rechazado'] },
      { key: 'notes',         label: 'Notas', type: 'textarea' },
    ],
    content_publish: [
      { key: 'title',         label: 'Título del contenido', type: 'text', required: true },
      { key: 'url',           label: 'URL publicada',         type: 'text' },
      { key: 'category',      label: 'Categoría',             type: 'text' },
      { key: 'word_count',    label: 'Palabras / duración',   type: 'text' },
      { key: 'time_spent',    label: 'Tiempo invertido',      type: 'text' },
      { key: 'notes',         label: 'Notas',                 type: 'textarea' },
    ],
    feature_release: [
      { key: 'feature_name',  label: 'Nombre de la funcionalidad', type: 'text', required: true },
      { key: 'changelog',     label: 'Cambios principales',        type: 'textarea' },
      { key: 'build_version', label: 'Versión / build',            type: 'text' },
      { key: 'deployed_at',   label: 'Fecha de despliegue',        type: 'date' },
      { key: 'users_affected',label: 'Usuarios afectados (estimado)', type: 'number' },
      { key: 'notes',         label: 'Notas / próximos pasos',     type: 'textarea' },
    ],
    app_store_setup: [
      { key: 'store',         label: 'Tienda', type: 'select', options: ['Google Play Store','Apple App Store','Huawei AppGallery','Amazon Appstore','Otra'], required: true },
      { key: 'account_email', label: 'Email de la cuenta de desarrollador', type: 'email' },
      { key: 'cost',          label: 'Costo de la cuenta (USD/COP)', type: 'text' },
      { key: 'status',        label: 'Estado actual', type: 'select', options: ['No iniciada','Cuenta creada','Verificación de identidad','Método de pago configurado','Primera app subida','Publicada'], required: true },
      { key: 'apps_listed',   label: 'Apps listadas (nombres)', type: 'text' },
      { key: 'opened_at',     label: 'Fecha de apertura', type: 'date' },
      { key: 'notes',         label: 'Notas / blockers', type: 'textarea' },
    ],
    marketing_campaign: [
      { key: 'campaign_name', label: 'Nombre de la campaña', type: 'text', required: true },
      { key: 'channel',       label: 'Canal principal', type: 'select', options: ['Facebook Ads','Instagram','Google Ads','TikTok','Radio local','Volantes','WhatsApp','Email','Otra'], required: true },
      { key: 'budget',        label: 'Presupuesto (COP)', type: 'text' },
      { key: 'reach',         label: 'Alcance / impresiones', type: 'text' },
      { key: 'start_date',    label: 'Fecha de inicio', type: 'date' },
      { key: 'end_date',      label: 'Fecha de fin', type: 'date' },
      { key: 'conversions',   label: 'Conversiones / leads / registros', type: 'text' },
      { key: 'notes',         label: 'Aprendizajes', type: 'textarea' },
    ],
    ai_improvement: [
      { key: 'flow_name',     label: 'Nombre del flujo IA', type: 'text', required: true },
      { key: 'improvement',   label: 'Mejora aplicada',      type: 'textarea', required: true },
      { key: 'metric_before', label: 'Métrica antes',       type: 'text' },
      { key: 'metric_after',  label: 'Métrica después',     type: 'text' },
      { key: 'cost_impact',   label: 'Impacto en costo (tokens/llamadas)', type: 'text' },
      { key: 'deployed_at',   label: 'Fecha de despliegue', type: 'date' },
    ],
    data_migration: [
      { key: 'source',        label: 'Origen de los datos',   type: 'text', required: true },
      { key: 'destination',   label: 'Destino (Firestore, etc.)', type: 'text', required: true },
      { key: 'records',       label: 'Cantidad de registros', type: 'number' },
      { key: 'date',          label: 'Fecha de migración',    type: 'date' },
      { key: 'validations',   label: 'Validaciones / checks', type: 'textarea' },
    ],
    finance: [
      { key: 'concept',       label: 'Concepto',           type: 'text', required: true },
      { key: 'amount',        label: 'Monto (COP)',         type: 'text', required: true },
      { key: 'category',      label: 'Categoría',           type: 'text' },
      { key: 'account',       label: 'Cuenta / método',     type: 'text' },
      { key: 'date',          label: 'Fecha',               type: 'date' },
      { key: 'notes',         label: 'Notas',               type: 'textarea' },
    ],
    operational: [
      { key: 'title',         label: 'Título',              type: 'text', required: true },
      { key: 'date',          label: 'Fecha',               type: 'date' },
      { key: 'attendees',     label: 'Participantes',       type: 'text' },
      { key: 'decisions',     label: 'Decisiones tomadas',  type: 'textarea' },
      { key: 'action_items',  label: 'Accionables / next steps', type: 'textarea' },
    ],
    bug_fix: [
      { key: 'description',   label: 'Descripción del bug',  type: 'textarea', required: true },
      { key: 'severity',      label: 'Severidad', type: 'select', options: ['Baja','Media','Alta','Crítica'], required: true },
      { key: 'root_cause',    label: 'Causa raíz',           type: 'textarea' },
      { key: 'fix_summary',   label: 'Solución aplicada',    type: 'textarea' },
      { key: 'pr_url',        label: 'PR / commit URL',      type: 'text' },
      { key: 'deployed_at',   label: 'Fecha de despliegue',  type: 'date' },
    ],
  };

  // ─── Defaults de objetivos por semana ──────────────────
  // Generador de "rituales" semanales + objetivos tácticos rotativos
  const WEEKLY_RITUALS = {
    yapido: [
      { title: 'Revisar métricas semanales', type: 'operational', effort: '30min', priority: 'medium',
        description: 'Revisar órdenes, repartos, lavadoras alquiladas, MRR. Detectar anomalías.' },
    ],
    cinestream: [
      { title: 'Verificar disponibilidad del catálogo', type: 'operational', effort: '15min', priority: 'medium',
        description: 'Asegurar que las películas top no tengan links rotos. Rate limiting OK.' },
    ],
    nimbus: [
      { title: 'Revisar uso de flujos IA', type: 'operational', effort: '30min', priority: 'medium',
        description: 'Chequear tokens consumidos, errores 5xx, feedback de usuarios en los flujos más usados.' },
    ],
    finanzas: [
      { title: 'Análisis de gastos de la semana', type: 'operational', effort: '30min', priority: 'medium',
        description: 'Resumen de gastos categorizados, alertas activas, presupuestos en riesgo.' },
    ],
    movilidad: [
      { title: 'Revisar KPIs de Aguachica', type: 'operational', effort: '30min', priority: 'high',
        description: 'Conductores online, tasa de aceptación, viajes completados, quejas.' },
    ],
    general: [
      { title: 'Reunión de alineación de los 4 proyectos', type: 'operational', effort: '1h', priority: 'high',
        description: 'Punto semanal con foco en dependencias cruzadas, blockers y KPIs unificados.' },
    ],
  };

  // Tareas tácticas por proyecto (rotan según la semana del año)
  const TACTICAL_POOL = {
    yapido: [
      { title: 'Onboarding de 1 nueva tienda al catálogo', type: 'user_acquisition', effort: '2h', priority: 'high',
        description: 'Contactar tendero, registrar productos, validar datos bancarios y publicar.' },
      { title: 'Publicar 1 producto/servicio destacado en home', type: 'content_publish', effort: '1h', priority: 'medium',
        description: 'Promoción semanal, banner, copy. Revisar conversión 7 días después.' },
      { title: 'Optimizar flujo de checkout', type: 'feature_release', effort: 'half-day', priority: 'medium',
        description: 'Reducir fricción en el paso de pago, especialmente móvil.' },
      { title: 'Auditar 5 repartos fallidos', type: 'operational', effort: '30min', priority: 'medium',
        description: 'Identificar causa raíz (repartidor, dirección, sistema).' },
      { title: 'Activar nuevo socio proveedor de lavadoras', type: 'integration_partner', effort: '2h', priority: 'high',
        description: 'Negociar tarifa, registrar inventario, publicar disponibilidad.' },
    ],
    cinestream: [
      { title: 'Cargar 20 nuevas películas al catálogo', type: 'data_migration', effort: '2h', priority: 'medium',
        description: 'Fuentes: YouTube (CC), Archive.org, Anime JSON. Validar subtítulos ES.' },
      { title: 'Mejorar filtros de búsqueda', type: 'feature_release', effort: '2h', priority: 'medium',
        description: 'Filtros combinados (género + año + tipo), ordenamiento, paginación.' },
      { title: 'Publicar 1 artículo/blog del catálogo', type: 'content_publish', effort: '1h', priority: 'low',
        description: 'Temática cine colombiano, recomendaciones destacadas.' },
      { title: 'Optimizar tiempo de carga del reproductor', type: 'feature_release', effort: '2h', priority: 'medium',
        description: 'Lazy load, preconnect, cache de metadata.' },
      { title: 'Auditar películas con links rotos', type: 'operational', effort: '30min', priority: 'medium',
        description: 'Buscar y reemplazar fuentes alternativas.' },
    ],
    nimbus: [
      { title: 'Mejorar 1 flujo IA con base en feedback', type: 'ai_improvement', effort: '2h', priority: 'high',
        description: 'Iterar prompt, agregar validaciones, medir latencia y costo en tokens.' },
      { title: 'Publicar 1 entrada en el blog', type: 'content_publish', effort: '2h', priority: 'medium',
        description: 'Artículo SEO sobre bienestar emocional, análisis de sueños o IA aplicada.' },
      { title: 'Onboarding de 1 terapeuta al marketplace', type: 'user_acquisition', effort: '2h', priority: 'medium',
        description: 'Validar credenciales, configurar perfil, publicar disponibilidad.' },
      { title: 'Lanzar 1 nueva herramienta beta', type: 'feature_release', effort: '1day', priority: 'medium',
        description: 'Ej: nueva categoría en /creator, integración con voz, etc.' },
      { title: 'Atender 5 conversaciones de prueba de usuarios', type: 'operational', effort: '1h', priority: 'low',
        description: 'Recoger feedback cualitativo sobre flujos principales.' },
    ],
    finanzas: [
      { title: 'Mejorar flujo de chat-registro-financiero', type: 'ai_improvement', effort: '2h', priority: 'high',
        description: 'Reducir ambigüedades en categorización, mejorar manejo de multi-idioma.' },
      { title: 'Publicar 1 tutorial en video', type: 'content_publish', effort: 'half-day', priority: 'medium',
        description: 'Corto, vertical, dirigido a usuarios nuevos. Distribuir en TikTok/Reels.' },
      { title: 'Integrar 1 banco o método de pago', type: 'feature_release', effort: '1day', priority: 'high',
        description: 'Pendiente integración real con pasarela (ver AGENTS.md features pendientes).' },
      { title: 'Refinar UX móvil de budgets', type: 'feature_release', effort: '2h', priority: 'medium',
        description: 'Mejorar visualización de progreso de presupuestos en pantallas pequeñas.' },
      { title: 'Probar notificaciones push', type: 'feature_release', effort: '1h', priority: 'medium',
        description: 'Activar flujo de alertas financieras en staging.' },
    ],
    movilidad: [
      { title: 'Onboarding de 1 nuevo conductor en Aguachica', type: 'user_acquisition', effort: '2h', priority: 'critical',
        description: 'KYC completo, vehículo validado, capacitación, primera prueba con pasajero fake.' },
      { title: 'Configurar cuenta de Google Play Console', type: 'app_store_setup', effort: '1h', priority: 'high',
        description: 'Pago de US$25, verificación de identidad, primer APK subido (conductor + pasajero).' },
      { title: 'Lanzar 1 campaña local en Aguachica', type: 'marketing_campaign', effort: '2h', priority: 'high',
        description: 'Facebook Ads geo-targeted + radio local + flyers en terminales.' },
      { title: 'Optimizar algoritmo de matching', type: 'feature_release', effort: 'half-day', priority: 'high',
        description: 'Ajustar pesos, radio de búsqueda, timeout de oferta. Medir tasa de aceptación.' },
      { title: 'Publicar changelog conductor v0.2', type: 'content_publish', effort: '1h', priority: 'medium',
        description: 'Mejoras onboarding, optimización de batería, nuevos incentivos.' },
    ],
    general: [
      { title: 'Análisis cruzado de KPIs (4 proyectos)', type: 'operational', effort: '1h', priority: 'high',
        description: 'Ver correlación entre uso de Finanzas ↔ retención en Yapido ↔ conversiones Nimbus. Detectar patrones de cross-sell.' },
      { title: 'Lanzar 1 campaña de marketing integrada', type: 'marketing_campaign', effort: '2h', priority: 'high',
        description: 'Mensaje unificado: "Yapido: tu vida digital en un ecosistema". Multi-canal, multi-producto.' },
      { title: 'Auditoría de seguridad básica', type: 'operational', effort: '2h', priority: 'medium',
        description: 'Revisar Firestore rules, tokens públicos, variables de entorno, CORS.' },
      { title: 'Decisión de pricing + comisión Movilidad', type: 'operational', effort: '1h', priority: 'high',
        description: 'Validar pricing piloto Aguachica, diseñar plan de incentivos a conductores.' },
      { title: 'Documentar arquitectura multi-zone', type: 'content_publish', effort: '1h', priority: 'low',
        description: 'Mantener AGENTS.md raíz, MANIFEST.md y diagramas al día.' },
    ],
  };

  // ─── Estado de la app ──────────────────────────────────
  const State = {
    currentWeekId: getISOWeek(new Date()),
    currentProject: 'all', // all | projectId
    currentFilter: 'all',  // all | pending | completed
    goals: {},             // goals[goalId] = Goal
    settings: {
      adminName: '',
      accessToken: '',
      firebaseConfig: null,
    },
    firebase: null,        // instancia firestore
    firebaseReady: false,
  };

  // ─── Storage layer ─────────────────────────────────────
  const Storage = {
    KEY_GOALS: 'yapido_objetivos_goals_v1',
    KEY_SETTINGS: 'yapido_objetivos_settings_v1',
    KEY_SEEDED: 'yapido_objetivos_seeded_v1',

    loadGoals() {
      try {
        const raw = localStorage.getItem(this.KEY_GOALS);
        return raw ? JSON.parse(raw) : {};
      } catch (e) { return {}; }
    },
    saveGoals(goals) {
      try { localStorage.setItem(this.KEY_GOALS, JSON.stringify(goals)); }
      catch (e) { console.error('No se pudo guardar', e); }
    },
    loadSettings() {
      try {
        const raw = localStorage.getItem(this.KEY_SETTINGS);
        return raw ? JSON.parse(raw) : {};
      } catch (e) { return {}; }
    },
    saveSettings(s) {
      try { localStorage.setItem(this.KEY_SETTINGS, JSON.stringify(s)); }
      catch (e) { console.error(e); }
    },
    isSeeded() { return localStorage.getItem(this.KEY_SEEDED) === '1'; },
    markSeeded() { localStorage.setItem(this.KEY_SEEDED, '1'); },
  };

  // ─── Utilidades de fecha / semana ISO ───────────────────
  function pad(n) { return String(n).padStart(2, '0'); }
  function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${pad(weekNum)}`;
  }
  function parseISOWeek(weekId) {
    const [year, w] = weekId.split('-W').map(Number);
    const simple = new Date(year, 0, 1 + (w - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = new Date(simple);
    if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
  }
  function addWeeks(weekId, n) {
    const d = parseISOWeek(weekId);
    d.setDate(d.getDate() + n * 7);
    return getISOWeek(d);
  }
  function weekRange(weekId) {
    const start = parseISOWeek(weekId);
    const end = new Date(start); end.setDate(end.getDate() + 6);
    const fmt = (d) => `${pad(d.getDate())} ${MONTHS_SHORT[d.getMonth()]}`;
    return `${fmt(start)} – ${fmt(end)} ${start.getFullYear()}`;
  }
  function isCurrentWeek(weekId) { return weekId === getISOWeek(new Date()); }
  const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  // ─── Generación de defaults por semana ──────────────────
  function uid() { return 'g_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36); }
  function pickByWeek(weekId, arr, count) {
    // Hash estable de la semana para rotar la selección
    const hash = weekId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const start = hash % arr.length;
    const out = [];
    for (let i = 0; i < count; i++) out.push(arr[(start + i) % arr.length]);
    return out;
  }
  function generateDefaultGoals(weekId) {
    const out = [];
    PROJECTS.forEach((p) => {
      const rituals = WEEKLY_RITUALS[p.id] || [];
      rituals.forEach((r) => {
        out.push(makeGoal(weekId, p.id, r));
      });
      const pool = TACTICAL_POOL[p.id] || [];
      const tacticals = pickByWeek(weekId + '_' + p.id, pool, 2);
      tacticals.forEach((t) => out.push(makeGoal(weekId, p.id, t)));
    });
    return out;
  }
  function makeGoal(weekId, projectId, def) {
    return {
      id: uid(),
      weekId,
      project: projectId,
      title: def.title,
      description: def.description,
      type: def.type || 'generic',
      priority: def.priority || 'medium',
      effort: def.effort || '1h',
      tags: def.tags || [],
      status: 'pending',
      createdAt: Date.now(),
      completedAt: null,
      completedBy: null,
      completionData: null,
      notes: null,
      source: 'system',
    };
  }

  // ─── Seed inicial ──────────────────────────────────────
  function ensureSeeded(forceReseed = false) {
    if (forceReseed || !Storage.isSeeded()) {
      const currentWeek = getISOWeek(new Date());
      const weeks = [
        addWeeks(currentWeek, -2),
        addWeeks(currentWeek, -1),
        currentWeek,
        addWeeks(currentWeek, 1),
        addWeeks(currentWeek, 2),
        addWeeks(currentWeek, 3),
      ];
      weeks.forEach((w) => {
        const goals = generateDefaultGoals(w);
        goals.forEach((g) => { State.goals[g.id] = g; });
      });
      Storage.markSeeded();
      Storage.saveGoals(State.goals);
    }
  }

  // ─── CRUD de goals ─────────────────────────────────────
  function addGoal(goal) {
    State.goals[goal.id] = goal;
    persistGoals();
  }
  function updateGoal(id, patch) {
    if (State.goals[id]) {
      State.goals[id] = { ...State.goals[id], ...patch };
      persistGoals();
    }
  }
  function deleteGoal(id) {
    delete State.goals[id];
    persistGoals();
  }
  function persistGoals() {
    Storage.saveGoals(State.goals);
    if (State.firebaseReady) syncToFirestore();
  }

  // ─── Firebase sync (opcional) ──────────────────────────
  function tryInitFirebase() {
    if (typeof firebase === 'undefined') return;
    const cfg = State.settings.firebaseConfig;
    if (!cfg || !cfg.apiKey) return;
    try {
      if (!firebase.apps.length) firebase.initializeApp(cfg);
      State.firebase = firebase.firestore();
      State.firebaseReady = true;
    } catch (e) {
      console.warn('Firebase init error', e);
      State.firebaseReady = false;
    }
  }
  async function syncToFirestore() {
    if (!State.firebaseReady) return;
    try {
      const batch = State.firebase.batch();
      Object.values(State.goals).forEach((g) => {
        const ref = State.firebase.collection('objetivos').doc(g.id);
        batch.set(ref, g, { merge: true });
      });
      await batch.commit();
    } catch (e) { console.warn('Sync error', e); }
  }
  async function loadFromFirestore() {
    if (!State.firebaseReady) return false;
    try {
      const snap = await State.firebase.collection('objetivos').get();
      const remote = {};
      snap.forEach((doc) => { remote[doc.id] = doc.data(); });
      // Merge: remote sobrescribe local si es más reciente
      Object.entries(remote).forEach(([id, g]) => {
        if (!State.goals[id] || (g.completedAt || 0) > (State.goals[id].completedAt || 0)) {
          State.goals[id] = g;
        }
      });
      Storage.saveGoals(State.goals);
      return true;
    } catch (e) { console.warn(e); return false; }
  }

  // ─── Render ────────────────────────────────────────────
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  function el(tag, props = {}, children = []) {
    const e = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'dataset') Object.assign(e.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') e.innerHTML = v;
      else e.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  function projectById(id) { return PROJECTS.find((p) => p.id === id); }

  function render() {
    renderHeader();
    renderTabs();
    renderSidebar();
    renderMain();
  }

  function renderHeader() {
    const week = State.currentWeekId;
    $('#weekLabel').textContent = isCurrentWeek(week) ? 'Semana actual' : `Semana ${week.split('-W')[1]}`;
    $('#weekRange').textContent = weekRange(week);
    $('#mainTitle').textContent = isCurrentWeek(week) ? 'Semana actual' : `Semana ${week.split('-W')[1]} · ${weekRange(week).split(' ').pop()}`;
    $('#mainSub').textContent = `Plan táctico · ${weekRange(week)}`;

    // Filter chips
    $$('#filterChips .chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.filter === State.currentFilter);
    });

    // Botón "Hoy" - solo habilitado si no estamos en la semana actual
    $('#jumpToday').classList.toggle('hidden', isCurrentWeek(week));
  }

  function renderTabs() {
    const tabs = $('#projectTabs');
    tabs.innerHTML = '';
    const allCount = goalsForCurrentWeek().length;
    const allItem = el('button', { class: 'ptab' + (State.currentProject === 'all' ? ' active' : ''), 'data-project': 'all' }, [
      el('span', { class: 'ptab-dot' }),
      'Todos',
      el('span', { class: 'ptab-count' }, String(allCount)),
    ]);
    allItem.addEventListener('click', () => { State.currentProject = 'all'; render(); });
    tabs.appendChild(allItem);

    PROJECTS.forEach((p) => {
      const count = goalsForCurrentWeek(p.id).length;
      const btn = el('button', { class: 'ptab' + (State.currentProject === p.id ? ' active' : ''), 'data-project': p.id, style: `--c:${p.color}` }, [
        el('span', {}, p.icon),
        p.name,
        el('span', { class: 'ptab-count' }, String(count)),
      ]);
      btn.addEventListener('click', () => { State.currentProject = p.id; render(); });
      tabs.appendChild(btn);
    });
  }

  function renderSidebar() {
    const list = $('#projectList');
    list.innerHTML = '';
    const allItem = el('button', { class: 'proj-item' + (State.currentProject === 'all' ? ' active' : '') }, [
      el('span', { class: 'proj-dot', style: 'background: linear-gradient(135deg, #c084fc, #6c5ce7)' }),
      el('span', { class: 'proj-name' }, 'Todos los proyectos'),
      el('span', { class: 'proj-count' }, String(goalsForCurrentWeek().length)),
    ]);
    allItem.addEventListener('click', () => { State.currentProject = 'all'; render(); });
    list.appendChild(allItem);

    PROJECTS.forEach((p) => {
      const count = goalsForCurrentWeek(p.id).length;
      const item = el('button', { class: 'proj-item' + (State.currentProject === p.id ? ' active' : ''), 'data-project': p.id }, [
        el('span', { class: 'proj-dot', style: `background: ${p.color}` }),
        el('span', { class: 'proj-name' }, p.name),
        el('span', { class: 'proj-count' }, String(count)),
      ]);
      item.addEventListener('click', () => { State.currentProject = p.id; render(); });
      list.appendChild(item);
    });

    // Stats
    const all = goalsForCurrentWeek();
    const done = all.filter((g) => g.status === 'completed').length;
    const prog = all.filter((g) => g.status === 'in_progress').length;
    const pct = all.length ? Math.round((done / all.length) * 100) : 0;
    $('#statTotal').textContent = all.length;
    $('#statDone').textContent = done;
    $('#statProg').textContent = prog;
    $('#statPct').textContent = `${pct}%`;
    $('#progressFill').style.width = `${pct}%`;
  }

  function renderMain() {
    const grid = $('#projectsGrid');
    const empty = $('#emptyState');
    grid.innerHTML = '';

    let projectsToShow = State.currentProject === 'all' ? PROJECTS : PROJECTS.filter((p) => p.id === State.currentProject);
    let totalShown = 0;

    projectsToShow.forEach((p) => {
      const goals = goalsForCurrentWeek(p.id);
      if (!goals.length) return;
      totalShown += goals.length;

      const section = renderProjectSection(p, goals);
      grid.appendChild(section);
    });

    empty.classList.toggle('hidden', totalShown > 0);
  }

  function renderProjectSection(p, goals) {
    const done = goals.filter((g) => g.status === 'completed').length;
    const pct = Math.round((done / goals.length) * 100);

    const section = el('section', { class: 'project-section' });
    const head = el('header', { class: 'project-head' });
    head.innerHTML = `
      <div class="project-head-icon" style="background: ${p.color}22; color: ${p.color}">${p.icon}</div>
      <div class="project-head-text">
        <div class="project-head-title">${p.name}</div>
        <div class="project-head-sub">${p.desc}</div>
      </div>
      <div class="project-head-progress">
        <span>${done}/${goals.length}</span>
        <span>·</span>
        <span>${pct}%</span>
      </div>
      <button class="project-head-toggle" aria-label="Expandir/contraer">▾</button>
    `;
    head.addEventListener('click', (e) => {
      if (e.target.closest('.project-head-toggle') || !e.target.closest('button')) {
        section.classList.toggle('collapsed');
      }
    });
    section.appendChild(head);

    const list = el('div', { class: 'goals-list' });
    goals.forEach((g) => list.appendChild(renderGoalCard(g)));
    section.appendChild(list);
    return section;
  }

  function renderGoalCard(g) {
    const card = el('article', { class: 'goal' + (g.status === 'completed' ? ' completed' : '') });

    const priority = el('div', { class: `goal-priority ${g.priority}` });

    const head = el('div', { class: 'goal-head' });
    const statusBtn = el('button', { class: 'goal-status', 'aria-label': g.status === 'completed' ? 'Reabrir' : 'Marcar completado' });
    statusBtn.innerHTML = g.status === 'completed' ? '✓' : '';
    statusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (g.status === 'completed') {
        if (confirm('¿Reabrir este objetivo?')) {
          updateGoal(g.id, { status: 'pending', completedAt: null, completedBy: null, completionData: null, notes: null });
          render();
          toast('Objetivo reabierto', 'info');
        }
      } else {
        openCompleteModal(g);
      }
    });
    head.appendChild(statusBtn);

    const body = el('div', { class: 'goal-body' });
    const title = el('div', { class: 'goal-title' }, g.title);
    const desc = el('div', { class: 'goal-desc' }, g.description || '');
    body.appendChild(title);
    body.appendChild(desc);
    head.appendChild(body);
    card.appendChild(head);

    const meta = el('div', { class: 'goal-meta' });
    meta.appendChild(el('span', { class: 'goal-effort' }, g.effort));
    meta.appendChild(el('span', { class: 'goal-type' }, g.type.replace(/_/g, ' ')));
    g.tags.forEach((t) => meta.appendChild(el('span', { class: 'goal-tag' }, '#' + t)));
    card.appendChild(meta);

    if (g.status === 'completed' && g.completionData) {
      const info = el('div', { class: 'goal-completion-info' });
      const summaryEntries = Object.entries(g.completionData).slice(0, 2);
      summaryEntries.forEach(([k, v]) => {
        if (v) {
          const label = EXPECTED_DATA_SCHEMAS[g.type]?.find((s) => s.key === k)?.label || k;
          info.appendChild(el('div', { class: 'gci-row' }, [
            el('span', {}, label + ':'),
            el('strong', {}, String(v).slice(0, 60)),
          ]));
        }
      });
      if (g.completedBy) {
        info.appendChild(el('div', { class: 'gci-row' }, [
          el('span', {}, 'Por:'),
          el('strong', {}, g.completedBy),
        ]));
      }
      card.appendChild(info);
    }

    const foot = el('div', { class: 'goal-foot' });
    const left = el('div', { class: 'goal-foot-left' });
    if (g.status !== 'completed') {
      const action = el('button', { class: 'goal-action' }, '✓ Completar');
      action.addEventListener('click', (e) => { e.stopPropagation(); openCompleteModal(g); });
      left.appendChild(action);
    } else {
      const action = el('button', { class: 'goal-action done' }, '✓ Hecho');
      left.appendChild(action);
    }
    foot.appendChild(left);

    const right = el('div', { class: 'goal-foot-right' });
    const edit = el('button', { class: 'goal-edit', 'aria-label': 'Editar', title: 'Editar' }, '✎');
    edit.addEventListener('click', (e) => { e.stopPropagation(); openGoalModal(g); });
    right.appendChild(edit);
    const del = el('button', { class: 'goal-edit', 'aria-label': 'Eliminar', title: 'Eliminar' }, '🗑');
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('¿Eliminar este objetivo? Esta acción no se puede deshacer.')) {
        deleteGoal(g.id);
        render();
        toast('Objetivo eliminado', 'info');
      }
    });
    right.appendChild(del);
    foot.appendChild(right);
    card.appendChild(foot);

    card.appendChild(priority);
    return card;
  }

  function goalsForCurrentWeek(projectId) {
    const week = State.currentWeekId;
    let list = Object.values(State.goals).filter((g) => g.weekId === week);
    if (projectId) list = list.filter((g) => g.project === projectId);
    if (State.currentFilter === 'pending') list = list.filter((g) => g.status !== 'completed');
    if (State.currentFilter === 'completed') list = list.filter((g) => g.status === 'completed');
    // Orden: pending primero, luego por prioridad
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    list.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
      return (order[a.priority] ?? 9) - (order[b.priority] ?? 9);
    });
    return list;
  }

  // ─── Modal: Nuevo/Editar objetivo ───────────────────────
  function openGoalModal(goal) {
    const isEdit = !!goal;
    const modal = $('#goalModal');
    $('#goalModalTitle').textContent = isEdit ? 'Editar objetivo' : 'Nuevo objetivo';
    const projectSel = $('#goalProject');
    projectSel.innerHTML = PROJECTS.map((p) => `<option value="${p.id}">${p.icon} ${p.name}</option>`).join('');
    $('#goalTitle').value = goal?.title || '';
    $('#goalDesc').value = goal?.description || '';
    $('#goalPriority').value = goal?.priority || 'medium';
    $('#goalEffort').value = goal?.effort || '1h';
    $('#goalType').value = goal?.type || 'generic';
    $('#goalTags').value = goal?.tags?.join(', ') || '';
    if (goal) projectSel.value = goal.project;
    else projectSel.value = State.currentProject !== 'all' ? State.currentProject : 'general';
    $('#goalForm').dataset.goalId = goal?.id || '';
    modal.classList.remove('hidden');
  }
  function closeGoalModal() { $('#goalModal').classList.add('hidden'); }

  $('#goalForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = e.currentTarget.dataset.goalId;
    const data = {
      project: $('#goalProject').value,
      title: $('#goalTitle').value.trim(),
      description: $('#goalDesc').value.trim(),
      priority: $('#goalPriority').value,
      effort: $('#goalEffort').value,
      type: $('#goalType').value,
      tags: $('#goalTags').value.split(',').map((s) => s.trim()).filter(Boolean),
    };
    if (!data.title) return toast('El título es obligatorio', 'error');
    if (id) {
      updateGoal(id, data);
      toast('Objetivo actualizado', 'success');
    } else {
      addGoal({ id: uid(), weekId: State.currentWeekId, status: 'pending', createdAt: Date.now(),
        completedAt: null, completedBy: null, completionData: null, notes: null, source: 'admin', ...data });
      toast('Objetivo creado', 'success');
    }
    closeGoalModal();
    render();
  });

  // ─── Modal: Confirmar completado ───────────────────────
  function openCompleteModal(g) {
    $('#completeGoalTitle').textContent = g.title;
    $('#adminName').value = State.settings.adminName || '';
    $('#completeNotes').value = '';
    const fields = EXPECTED_DATA_SCHEMAS[g.type] || EXPECTED_DATA_SCHEMAS.generic;
    const container = $('#completionDataFields');
    container.innerHTML = '';
    fields.forEach((f) => {
      const row = el('div', { class: 'form-row' });
      const id = `cd_${f.key}`;
      const label = el('label', { for: id }, f.label + (f.required ? ' *' : ''));
      row.appendChild(label);
      let input;
      if (f.type === 'textarea') input = el('textarea', { id, name: f.key, rows: 3, ...(f.required ? { required: 'true' } : {}) });
      else if (f.type === 'select') {
        input = el('select', { id, name: f.key, ...(f.required ? { required: 'true' } : {}) });
        const blank = el('option', { value: '' }, '— Selecciona —');
        input.appendChild(blank);
        (f.options || []).forEach((o) => input.appendChild(el('option', { value: o }, o)));
      } else {
        input = el('input', { id, name: f.key, type: f.type || 'text', ...(f.required ? { required: 'true' } : {}) });
      }
      row.appendChild(input);
      container.appendChild(row);
    });
    $('#completeForm').dataset.goalId = g.id;
    $('#completeForm').dataset.goalType = g.type;
    $('#completeModal').classList.remove('hidden');
  }
  function closeCompleteModal() { $('#completeModal').classList.add('hidden'); }

  $('#completeForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = e.currentTarget.dataset.goalId;
    const type = e.currentTarget.dataset.goalType;
    const form = e.currentTarget;
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = v; });
    const adminName = data.adminName || '';
    const notes = data.notes || '';
    delete data.notes; delete data.adminName;
    const goal = State.goals[id];
    if (!goal) return;
    updateGoal(id, {
      status: 'completed',
      completedAt: Date.now(),
      completedBy: adminName,
      completionData: data,
      notes: notes || null,
    });
    if (adminName) {
      State.settings.adminName = adminName;
      Storage.saveSettings(State.settings);
    }
    closeCompleteModal();
    openFeedbackModal(goal, data, notes, adminName);
    render();
  });

  // ─── Modal: Feedback inteligente post-completado ──────
  function openFeedbackModal(goal, data, notes, adminName) {
    const all = Object.values(State.goals);
    const weekGoals = all.filter((g) => g.weekId === State.currentWeekId);
    const weekDone = weekGoals.filter((g) => g.status === 'completed');
    const weekDoneNow = weekDone.filter((g) => g.id !== goal.id);
    const totalPct = weekGoals.length ? Math.round((weekDone.length / weekGoals.length) * 100) : 0;
    const project = projectById(goal.project);
    const projDone = all.filter((g) => g.project === goal.project && g.status === 'completed').length;
    const projTotal = all.filter((g) => g.project === goal.project).length;

    // Calcular racha: semanas seguidas con al menos 1 objetivo completado
    const weeksWithDone = new Set(all.filter((g) => g.status === 'completed').map((g) => g.weekId));
    let streak = 0; let cursor = getISOWeek(new Date());
    while (weeksWithDone.has(cursor)) { streak++; cursor = addWeeks(cursor, -1); }

    // Insights inteligentes según el tipo
    const insights = generateInsights(goal, data, weekDoneNow, weekGoals);

    const body = $('#feedbackBody');
    body.innerHTML = '';

    const summary = el('div', { class: 'feedback-summary' });
    summary.appendChild(el('div', { class: 'feedback-row' }, [
      el('span', { class: 'fr-key' }, 'Proyecto'),
      el('span', { class: 'fr-val' }, `${project.icon} ${project.name}`),
    ]));
    summary.appendChild(el('div', { class: 'feedback-row' }, [
      el('span', { class: 'fr-key' }, 'Tipo'),
      el('span', { class: 'fr-val' }, goal.type.replace(/_/g, ' ')),
    ]));
    summary.appendChild(el('div', { class: 'feedback-row' }, [
      el('span', { class: 'fr-key' }, 'Completado por'),
      el('span', { class: 'fr-val' }, adminName || '—'),
    ]));
    Object.entries(data).forEach(([k, v]) => {
      if (!v) return;
      const schema = (EXPECTED_DATA_SCHEMAS[goal.type] || []).find((s) => s.key === k);
      const label = schema?.label || k;
      summary.appendChild(el('div', { class: 'feedback-row' }, [
        el('span', { class: 'fr-key' }, label),
        el('span', { class: 'fr-val' }, String(v).slice(0, 120)),
      ]));
    });
    if (notes) {
      summary.appendChild(el('div', { class: 'feedback-row' }, [
        el('span', { class: 'fr-key' }, 'Notas'),
        el('span', { class: 'fr-val' }, notes),
      ]));
    }
    body.appendChild(summary);

    // Streak
    const streakEl = el('div', { class: 'feedback-streak' });
    streakEl.innerHTML = `
      <div class="fs-num">${streak}</div>
      <div class="fs-label">semanas seguidas con al menos un objetivo completado</div>
    `;
    body.appendChild(streakEl);

    // Progress semana
    body.appendChild(el('div', { class: 'feedback-row' }, [
      el('span', { class: 'fr-key' }, 'Progreso de la semana'),
      el('span', { class: 'fr-val' }, `${weekDone.length}/${weekGoals.length} · ${totalPct}%`),
    ]));
    body.appendChild(el('div', { class: 'feedback-row' }, [
      el('span', { class: 'fr-key' }, `Total en ${project.name}`),
      el('span', { class: 'fr-val' }, `${projDone}/${projTotal} completados`),
    ]));

    // Insight inteligente
    const insight = el('div', { class: 'feedback-insight' });
    insight.innerHTML = `<strong>💡 Insight</strong><ul>${insights.map((i) => `<li>${i}</li>`).join('')}</ul>`;
    body.appendChild(insight);

    $('#feedbackModal').classList.remove('hidden');
  }
  function closeFeedbackModal() { $('#feedbackModal').classList.add('hidden'); }

  function generateInsights(goal, data, weekDone, weekGoals) {
    const out = [];
    const project = projectById(goal.project);

    // Insight por tipo
    if (goal.type === 'integration_partner' && data.items_count) {
      out.push(`Sumaste <strong>${data.items_count}</strong> items al ecosistema. La red de socios de ${project.name} crece.`);
    }
    if (goal.type === 'user_acquisition') {
      out.push(`+1 usuario/conductor en <strong>${project.name}</strong>. Sigue sumando para alcanzar masa crítica.`);
    }
    if (goal.type === 'app_store_setup' && data.status) {
      out.push(`Tu cuenta en <strong>${data.store}</strong> está en estado: <strong>${data.status}</strong>. El siguiente paso es clave para llegar a los usuarios.`);
    }
    if (goal.type === 'content_publish' && data.title) {
      out.push(`Publicaste "<strong>${data.title}</strong>". Considera repartirlo en redes durante 7 días para máximo alcance.`);
    }
    if (goal.type === 'ai_improvement') {
      out.push(`Mejora de IA registrada. Mide el impacto en producción durante 7 días antes de iterar de nuevo.`);
    }
    if (goal.type === 'feature_release') {
      out.push(`Funcionalidad desplegada. Recuerda publicar changelog y notificar a usuarios clave.`);
    }
    if (goal.type === 'marketing_campaign' && data.budget) {
      out.push(`Campaña lanzada con presupuesto <strong>${data.budget}</strong>. Mide ROAS durante 14 días.`);
    }
    if (goal.type === 'operational' && data.action_items) {
      out.push(`Reunión registrada. Convierte los accionables en objetivos de la próxima semana.`);
    }
    if (goal.type === 'finance' && data.amount) {
      out.push(`Movimiento financiero de <strong>${data.amount}</strong> registrado. Categorízalo bien para análisis.`);
    }

    // Insight general según avance
    const totalDone = weekDone.length + 1; // +1 por el actual
    const totalGoals = weekGoals.length;
    if (totalDone === totalGoals) {
      out.push(`🏆 <strong>¡Semana completada al 100%!</strong> Excelente ejecución.`);
    } else if (totalDone >= totalGoals * 0.7) {
      out.push(`Vas por el <strong>${Math.round((totalDone / totalGoals) * 100)}%</strong> de la semana. Un último empujón.`);
    } else if (totalDone <= 2) {
      out.push(`Inicio de semana sólido. Define prioridades claras para los demás objetivos.`);
    }

    // Cross-project
    const all = Object.values(State.goals);
    const crossCompleted = all.filter((g) => g.status === 'completed').length;
    out.push(`Has completado <strong>${crossCompleted}</strong> objetivos en todo el ecosistema.`);

    return out;
  }

  // ─── Settings ──────────────────────────────────────────
  function openSettings() {
    $('#settingsName').value = State.settings.adminName || '';
    $('#settingsToken').value = State.settings.accessToken || '';
    $('#settingsFirebase').value = State.settings.firebaseConfig ? JSON.stringify(State.settings.firebaseConfig, null, 2) : '';
    $('#settingsModal').classList.remove('hidden');
  }
  function closeSettings() { $('#settingsModal').classList.add('hidden'); }

  $('#settingsSave')?.addEventListener('click', () => {
    State.settings.adminName = $('#settingsName').value.trim();
    State.settings.accessToken = $('#settingsToken').value.trim();
    const fbText = $('#settingsFirebase').value.trim();
    try {
      State.settings.firebaseConfig = fbText ? JSON.parse(fbText) : null;
    } catch (e) {
      return toast('JSON de Firebase inválido', 'error');
    }
    if ($('#settingsSeed').checked) {
      ensureSeeded(true);
    }
    Storage.saveSettings(State.settings);
    if (State.settings.firebaseConfig) {
      tryInitFirebase();
      loadFromFirestore().then((ok) => {
        if (ok) { render(); toast('Sincronizado desde Firestore', 'success'); }
      });
    }
    closeSettings();
    toast('Configuración guardada', 'success');
  });

  // ─── Import / Export ───────────────────────────────────
  function exportJSON() {
    const data = { exportedAt: new Date().toISOString(), goals: State.goals, settings: State.settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: `objetivos-${getISOWeek(new Date())}.json` });
    a.click();
    URL.revokeObjectURL(url);
    toast('Exportado correctamente', 'success');
  }
  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.goals) {
          Object.entries(data.goals).forEach(([id, g]) => {
            if (!State.goals[id] || (g.completedAt || 0) > (State.goals[id].completedAt || 0)) {
              State.goals[id] = g;
            }
          });
          Storage.saveGoals(State.goals);
          render();
          toast('Importado correctamente', 'success');
        }
      } catch (err) { toast('JSON inválido', 'error'); }
    };
    reader.readAsText(file);
  }

  // ─── Toast ──────────────────────────────────────────────
  function toast(msg, kind = 'info') {
    const c = $('#toastContainer');
    const t = el('div', { class: `toast ${kind}` }, msg);
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; }, 2400);
    setTimeout(() => t.remove(), 2800);
  }

  // ─── Token Gate ────────────────────────────────────────
  function checkToken() {
    const required = State.settings.accessToken;
    if (!required) return true;
    const url = new URL(window.location.href);
    const provided = url.searchParams.get('k') || sessionStorage.getItem('yapido_obj_token');
    return provided === required;
  }
  function showGate() {
    $('#gate').classList.remove('hidden');
    $('#app').classList.add('hidden');
    $('#gateToken')?.focus();
  }
  function hideGate() {
    $('#gate').classList.add('hidden');
    $('#app').classList.remove('hidden');
  }
  $('#gateSubmit')?.addEventListener('click', () => {
    const v = $('#gateToken').value;
    if (v === State.settings.accessToken) {
      sessionStorage.setItem('yapido_obj_token', v);
      hideGate();
    } else {
      $('#gateError').textContent = 'Token incorrecto';
    }
  });
  $('#gateToken')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#gateSubmit').click(); });

  // ─── Listeners globales ────────────────────────────────
  function bindEvents() {
    $('#prevWeek').addEventListener('click', () => { State.currentWeekId = addWeeks(State.currentWeekId, -1); render(); });
    $('#nextWeek').addEventListener('click', () => { State.currentWeekId = addWeeks(State.currentWeekId, 1); render(); });
    $('#jumpToday').addEventListener('click', () => { State.currentWeekId = getISOWeek(new Date()); render(); });

    $$('#filterChips .chip').forEach((c) => {
      c.addEventListener('click', () => { State.currentFilter = c.dataset.filter; render(); });
    });

    $('#btnSettings').addEventListener('click', openSettings);
    $$('[data-close-settings]').forEach((b) => b.addEventListener('click', closeSettings));

    const openNew = () => openGoalModal(null);
    $('#btnNewGoal').addEventListener('click', openNew);
    $('#btnNewGoal2').addEventListener('click', openNew);
    $('#btnNewGoal3').addEventListener('click', openNew);

    $$('[data-close-modal]').forEach((b) => b.addEventListener('click', closeGoalModal));
    $$('[data-close-complete]').forEach((b) => b.addEventListener('click', closeCompleteModal));
    $('[data-close-feedback]')?.addEventListener('click', closeFeedbackModal);
    $('#feedbackNext')?.addEventListener('click', closeFeedbackModal);

    $('#btnExport').addEventListener('click', exportJSON);
    $('#btnImport').addEventListener('click', () => $('#fileImport').click());
    $('#fileImport').addEventListener('change', (e) => { if (e.target.files[0]) importJSON(e.target.files[0]); });

    // Bottom nav (mobile)
    $$('.bnav').forEach((b) => {
      b.addEventListener('click', () => {
        const action = b.dataset.bnav;
        if (action === 'add') openGoalModal(null);
        else if (action === 'project') scrollToTabs();
        else if (action === 'stats') scrollToStats();
        else if (action === 'filter') cycleFilter();
        else if (action === 'settings') openSettings();
      });
    });

    // Esc para cerrar modales
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeGoalModal(); closeCompleteModal(); closeFeedbackModal(); closeSettings();
      }
    });

    // Swipe horizontal en topbar (mobile) para cambiar semana
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    document.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(dx) > 80 && e.target.closest('.main')) {
        if (dx > 0) { State.currentWeekId = addWeeks(State.currentWeekId, -1); render(); }
        else { State.currentWeekId = addWeeks(State.currentWeekId, 1); render(); }
      }
    }, { passive: true });
  }
  function scrollToTabs() { document.querySelector('.project-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function scrollToStats() { document.querySelector('.sidebar')?.scrollIntoView({ behavior: 'smooth' }); }
  function cycleFilter() {
    const order = ['all', 'pending', 'completed'];
    const idx = order.indexOf(State.currentFilter);
    State.currentFilter = order[(idx + 1) % order.length];
    render();
    toast(`Filtro: ${State.currentFilter}`, 'info');
  }

  // ─── Bootstrap ─────────────────────────────────────────
  function init() {
    // Cargar estado
    State.goals = Storage.loadGoals();
    State.settings = { ...State.settings, ...Storage.loadSettings() };

    // Inicializar Firebase si hay config
    tryInitFirebase();

    // Seed inicial
    ensureSeeded(false);
    if (State.firebaseReady) {
      loadFromFirestore().then(() => render());
    }

    // Gate
    if (!checkToken()) { showGate(); } else { hideGate(); }

    bindEvents();
    render();
  }

  // Esperar Firebase SDK (defer) antes de init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
