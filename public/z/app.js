/* ==========================================================
   Yapido Store — App logic
   Render, search, filter, sort, theme, motion engine
   ========================================================== */

// --- 1. Catálogo de apps ------------------------------------
// Nota: La app Yapido (hub principal) se muestra en la sección Organizer abajo,
// no aquí como tarjeta para evitar que la página se llame a sí misma.
const APPS = [
  {
    id: "finanzas",
    name: "Finanzas",
    cat: "finanzas",
    catLabel: "Finanzas",
    tagline: "Tu dinero, con asistente de IA.",
    desc: "Gastos, ingresos, presupuestos y un chat inteligente que entiende tu economía personal.",
    rating: 4.7,
    installs: "8.4K+",
    price: "Gratis",
    size: "Next.js + Gemini",
    url: "https://yapido.click/finanzas",
    accent: "#10B981",
    icon: "finanzas",
  },
  {
    id: "nimbus",
    name: "Nimbus",
    cat: "ia",
    catLabel: "IA & Chat",
    tagline: "Chat IA con superpoderes.",
    desc: "Sueños, cómics, cursos, IA vs IA, perfil psicológico, código Torah y más de 10 herramientas.",
    rating: 4.9,
    installs: "21K+",
    price: "Gratis",
    size: "Genkit multi-tool",
    url: "https://yapido.click/nimbus",
    accent: "#8B5CF6",
    icon: "nimbus",
    badge: "Popular",
  },
  {
    id: "cinestream",
    name: "CineStream",
    cat: "entretenimiento",
    catLabel: "Entretenimiento",
    tagline: "Tu cine, a un click.",
    desc: "Catálogo de películas con búsqueda, filtros por género/año/tipo y reproductor personalizado.",
    rating: 4.5,
    installs: "5.2K+",
    price: "Gratis",
    size: "Vanilla JS + Firestore",
    url: "https://peliculas.yapido.click",
    accent: "#EF4444",
    icon: "cinestream",
  },
  {
    id: "objetivos",
    name: "Objetivos",
    cat: "productividad",
    catLabel: "Productividad",
    tagline: "OKR semanal del ecosistema.",
    desc: "Define, sigue y cierra objetivos por proyecto. 12 tipos predefinidos con formularios a medida.",
    rating: 4.6,
    installs: "1.1K+",
    price: "Gratis",
    size: "Vanilla JS · Privado",
    url: "https://organizar.yapido.click",
    accent: "#F59E0B",
    icon: "objetivos",
    badge: "Nuevo",
  },
  {
    id: "animaciones",
    name: "Animaciones",
    cat: "creatividad",
    catLabel: "Creatividad",
    tagline: "Motor 3D procedimental.",
    desc: "Convierte una idea en una escena 3D animada. Exporta a WebM, PNG o JSON reproducible.",
    rating: 4.8,
    installs: "3.7K+",
    price: "Gratis",
    size: "Vite · Three.js · GSAP",
    url: "https://animaciones.yapido.click",
    accent: "#06B6D4",
    icon: "animaciones",
    badge: "Beta",
  },
  {
    id: "lavadoras",
    name: "Lavadoras",
    cat: "comercio",
    catLabel: "Comercio & Logística",
    tagline: "Alquiler de lavadoras, sin fricción.",
    desc: "Reservas, calendario, tracking de equipos y panel logístico. Versión APK móvil vía Capacitor.",
    rating: 4.4,
    installs: "980+",
    price: "Gratis",
    size: "Next.js + Capacitor",
    url: "https://lavadoras.yapido.click",
    accent: "#3B82F6",
    icon: "lavadoras",
  },
  {
    id: "salud",
    name: "Salud",
    cat: "bienestar",
    catLabel: "Bienestar",
    tagline: "Tu radar de suplementos.",
    desc: "Analiza tu stack de suplementación, detecta interacciones y arma un horario óptimo de 24h.",
    rating: 4.7,
    installs: "2.3K+",
    price: "Gratis",
    size: "Motor de reglas local",
    url: "https://salud.yapido.click",
    accent: "#22C55E",
    icon: "salud",
    badge: "Nuevo",
  },
  {
    id: "z",
    name: "Premium Zone",
    cat: "media",
    catLabel: "Media & Brand",
    tagline: "La portada del ecosistema.",
    desc: "Landing editorial que presenta los productos del ecosistema como manifiesto de marca.",
    rating: 4.9,
    installs: "—",
    price: "Gratis",
    size: "Editorial Brutalism",
    url: "https://yapido.click/z",
    accent: "#111111",
    icon: "z",
    badge: "Editorial",
  },
];

// --- 2. Iconos SVG (inline) ---------------------------------
const ICONS = {
  finanzas: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  nimbus: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,
  cinestream: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m10 9 5 3-5 3V9z" fill="#fff"/></svg>`,
  objetivos: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="#fff"/></svg>`,
  animaciones: `<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>`,
  lavadoras: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="13" r="5"/><circle cx="12" cy="13" r="2"/><path d="M7 7h.01M11 7h.01"/></svg>`,
  salud: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  z: `<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14L5 19h14"/></svg>`,
};

const ICON_BG = {
  finanzas: "#10B981",
  nimbus: "#8B5CF6",
  cinestream: "#EF4444",
  objetivos: "#F59E0B",
  animaciones: "#F2FF00",
  lavadoras: "#3B82F6",
  salud: "#22C55E",
  z: "#F2FF00",
};

// --- 3. Estado de salud de las apps (verificación live) -----
// Mapeamos cada app a su URL raíz para hacer un HEAD check
const HEALTH_URLS = {
  finanzas: "https://yapido.click/finanzas",
  nimbus: "https://yapido.click/nimbus",
  cinestream: "https://peliculas.yapido.click",
  objetivos: "https://organizar.yapido.click",
  animaciones: "https://animaciones.yapido.click",
  lavadoras: "https://lavadoras.yapido.click",
  salud: "https://salud.yapido.click",
  z: "https://yapido.click/z",
};

// Caché de resultados de salud
const healthStatus = {};

async function checkHealth(id, url) {
  try {
    // Usamos no-cors para evitar bloqueos de CORS — si llega (opaque), está online
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { method: "HEAD", mode: "no-cors", signal: ctrl.signal });
    clearTimeout(timer);
    // En modo no-cors, fetch siempre "resuelve" si el servidor responde, type === "opaque"
    healthStatus[id] = "online";
  } catch {
    healthStatus[id] = "offline";
  }
  // Update badge on already-rendered cards
  const badge = document.querySelector(`[data-health="${id}"]`);
  if (badge) {
    badge.className = `card__status card__status--${healthStatus[id]}`;
    badge.innerHTML = `<span class="card__status-dot"></span>${healthStatus[id] === "online" ? "En línea" : "Sin conexión"}`;
  }
}

function initHealthChecks() {
  APPS.forEach((app) => {
    healthStatus[app.id] = "checking";
    checkHealth(app.id, HEALTH_URLS[app.id] || app.url);
  });
}

// --- 4. Estado local ----------------------------------------
const state = {
  cat: "all",
  query: "",
  sort: "rating",
};

// --- 5. Helpers ----------------------------------------------
const star = () =>
  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

const arrowOut = () =>
  `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>`;

function getStatusBadge(id) {
  const s = healthStatus[id];
  if (!s || s === "checking") {
    return `<span class="card__status" data-health="${id}" style="background:#f1f5f9;color:#94a3b8"><span class="card__status-dot" style="background:#94a3b8;animation:none"></span>Verificando…</span>`;
  }
  return `<span class="card__status card__status--${s}" data-health="${id}"><span class="card__status-dot"></span>${s === "online" ? "En línea" : "Sin conexión"}</span>`;
}

// --- 6. Render -----------------------------------------------
function renderChips() {
  const counts = { all: APPS.length };
  APPS.forEach((a) => {
    counts[a.cat] = (counts[a.cat] || 0) + 1;
  });
  Object.entries(counts).forEach(([k, v]) => {
    const el = document.getElementById(`count-${k}`);
    if (el) el.textContent = String(v).padStart(2, "0");
  });
}

function renderCards() {
  const wrap = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const list = filterAndSort();

  if (list.length === 0) {
    wrap.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  wrap.innerHTML = list
    .map(
      (app, i) => `
      <a
        class="card"
        href="${app.url}"
        target="_blank"
        rel="noopener noreferrer"
        role="listitem"
        data-cat="${app.cat}"
        style="--card-accent:${app.accent};--stagger:${i}"
      >
        <div class="card__top">
          <div class="card__icon" style="background:${ICON_BG[app.icon] || "#111"}">
            ${ICONS[app.icon] || ICONS.finanzas}
          </div>
          <div class="card__heading">
            <div class="card__name">
              ${app.name}
              ${app.badge ? `<span class="badge ${app.badge === "Nuevo" ? "badge--new" : app.badge === "Beta" ? "badge--beta" : ""}">${app.badge}</span>` : ""}
            </div>
            <div class="card__cat">${app.catLabel}</div>
          </div>
        </div>
        ${getStatusBadge(app.id)}
        <p class="card__desc">${app.desc}</p>
        <div class="card__meta">
          <span class="card__rating">${star()} ${app.rating.toFixed(1)}</span>
          <span>·</span>
          <span>${app.size}</span>
          <span class="card__installs">${app.installs}</span>
        </div>
        <div class="card__cta">
          <span class="card__price">${app.price}</span>
          <span class="card__open">
            Abrir
            ${arrowOut()}
          </span>
        </div>
        <div class="card__shine" aria-hidden="true"></div>
      </a>
    `
    )
    .join("");

  // Re-trigger entrance animation
  requestAnimationFrame(() => {
    document.querySelectorAll(".card").forEach((el) => {
      el.classList.add("is-in");
    });
  });
}

function filterAndSort() {
  const q = state.query.trim().toLowerCase();
  let list = APPS.filter((a) => {
    const inCat = state.cat === "all" || a.cat === state.cat;
    const inQuery =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.desc.toLowerCase().includes(q) ||
      a.catLabel.toLowerCase().includes(q) ||
      a.tagline.toLowerCase().includes(q);
    return inCat && inQuery;
  });

  switch (state.sort) {
    case "az":
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "new":
      list.sort((a, b) => (b.badge === "Nuevo" ? 1 : 0) - (a.badge === "Nuevo" ? 1 : 0));
      break;
    case "rating":
    default:
      list.sort((a, b) => b.rating - a.rating);
  }
  return list;
}

function render() {
  renderCards();
}

// --- 7. Motion engine ---------------------------------------
function initMotion() {
  // Tilt 3D sutil en hover (mouse position -> CSS vars)
  document.addEventListener("mousemove", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    card.style.setProperty("--mx", x.toFixed(3));
    card.style.setProperty("--my", y.toFixed(3));
  });

  document.addEventListener("mouseleave", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    card.style.setProperty("--mx", 0.5);
    card.style.setProperty("--my", 0.5);
  });

  // Reveal on scroll para el organizador
  const orgObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          orgObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  const org = document.querySelector(".organizer__card");
  if (org) orgObserver.observe(org);

  // Reveal on scroll para el storehead
  const shObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          shObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  const sh = document.querySelector(".storehead");
  if (sh) shObserver.observe(sh);

  // Counter de KPIs en storehead
  const kpiObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        animateKpis();
        kpiObserver.disconnect();
      }
    },
    { threshold: 0.4 }
  );
  const kpi = document.querySelector(".storehead__right");
  if (kpi) kpiObserver.observe(kpi);
}

function animateKpis() {
  document.querySelectorAll(".kpi__num").forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const dur = 1100;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// --- 8. Interacciones ----------------------------------------
document.getElementById("chips").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  document.querySelectorAll(".chip").forEach((c) =>
    c.classList.remove("chip--active")
  );
  btn.classList.add("chip--active");
  state.cat = btn.dataset.cat;
  // re-trigger animation
  document
    .querySelectorAll(".card")
    .forEach((el) => el.classList.remove("is-in"));
  render();
});

document.getElementById("search").addEventListener("input", (e) => {
  state.query = e.target.value;
  document
    .querySelectorAll(".card")
    .forEach((el) => el.classList.remove("is-in"));
  render();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const s = document.getElementById("search");
    if (s && document.activeElement === s) {
      s.value = "";
      state.query = "";
      render();
      s.blur();
    }
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    document.getElementById("search").focus();
  }
});

// Theme toggle
const themeBtn = document.getElementById("themeToggle");
const storedTheme = localStorage.getItem("mm-theme");
if (storedTheme) document.documentElement.setAttribute("data-theme", storedTheme);

themeBtn.addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme");
  const next = cur === "dark" ? "" : "dark";
  if (next) {
    document.documentElement.setAttribute("data-theme", next);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  localStorage.setItem("mm-theme", next);
});

// --- 9. Init -------------------------------------------------
renderChips();
render();
initMotion();
initHealthChecks();
