# Radar de Suplementos — Biohacker Lab

App web de una sola página que analiza rutinas de suplementación, detecta interacciones peligrosas y recomienda un stack personalizado. Diseñada para monetizar vía afiliación de Amazon/iHerb + email marketing.

**Ruta:** `public/salud/` → desplegable como subdominio `salud.yapido.click` o standalone.

---

## Stack

- HTML5 + CSS3 + Vanilla JS (sin build step)
- Tailwind CSS vía CDN
- Canvas nativo para fondo animado (sin libs externas pesadas)
- Google Fonts: Archivo / Inter / JetBrains Mono

## Estructura

```
public/salud/
├── index.html          # App principal (SPA, 3 vistas: hero / wizard / report)
├── styles.css          # Custom CSS (chips, sliders, gauge, timeline, print)
├── app.js              # UI controller: wizard, transiciones, render del reporte
├── engine.js           # Motor de reglas LOCAL (análisis instantáneo, sin API)
├── ai.js               # Wrapper IA opcional (Gemini / OpenAI-compatible)
├── affiliate.js        # Generador de URLs Amazon/iHerb con tags
├── data/
│   ├── supplements.js  # 36+ suplementos curados con dose/timing/synergies
│   ├── interactions.js # 40+ interacciones peligrosas (supp×supp / supp×med)
│   └── goals.js        # Mapeo objetivo → suplementos (13 objetivos)
├── README.md           # Este archivo
└── .gitignore
```

---

## 🚀 Deploy (5 minutos)

### Opción A: Vercel (recomendado)

```bash
cd public/salud
vercel --prod
```

Auto-detecta como static site. Listo.

### Opción B: Netlify

Arrastra la carpeta `public/salud` a [app.netlify.com/drop](https://app.netlify.com/drop).

### Opción C: Subdominio Yapido

Como parte del monorepo Yapido, esta app ya está bajo `public/salud/`. Para que se sirva desde `salud.yapido.click`, configura un subdominio en tu proveedor DNS que apunte al deploy de Vercel, y agrega el rewrite correspondiente en `vercel.json` (raíz del monorepo):

```json
{
  "rewrites": [
    { "source": "/salud", "destination": "https://salud.yapido.click" }
  ]
}
```

---

## 💰 Monetización paso a paso

### 1) Amazon Afiliados (PRINCIPAL — 90% de los ingresos)

1. Inscríbete en [affiliate-program.amazon.com](https://affiliate-program.amazon.com)
2. Espera aprobación (1-3 días)
3. Obtén tu **tag de asociado** (formato: `tunombre-20`)
4. En `affiliate.js`, línea 11, reemplaza:
   ```js
   tag: 'radarsuplemen-20', // <-- CAMBIAR por tu tag
   ```
5. **Comisión Amazon suplementos:** 4-10% por venta. Ticket promedio: $25-80.
6. Con 100K visitas/mes y CTR del 8% a productos, eso son ~8K clicks/mes. Tasa de conversión Amazon ~3% = 240 ventas/mes × $35 ticket × 6% = **~$500/mes** solo en Amazon.

### 2) iHerb Afiliados (SECUNDARIO — mejor comisión)

1. Inscríbete en [affiliate.iherb.com](https://affiliate.iherb.com)
2. Aceptan rápido (24-48h)
3. Obtén tu **rcode**
4. En `affiliate.js`, líneas 16-18:
   ```js
   affil: '', // <-- CAMBIAR por tu código
   enabled: true
   ```
5. **Comisión iHerb:** 5-15% + bonus por ventas. Mejor para suplementos que Amazon a veces no tiene o son más baratos.

### 3) Email Marketing (LTV — el verdadero dinero)

El "email gate" actual usa `mailto:` (no requiere backend). Para escalar:

**Opción 1: Formspree (gratis hasta 50 envíos/mes)**
```js
// En app.js, función setupEmailGate(), reemplaza window.location.href con:
fetch('https://formspree.io/f/TU_FORM_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, report: state.report })
});
```

**Opción 2: ConvertKit / Mailchimp API**
- Captura emails en ConvertKit
- Crea secuencia automática:
  - Email 1 (inmediato): "Tu reporte está aquí"
  - Email 2 (día 2): "Top 3 errores en suplementación"
  - Email 3 (día 5): "Por qué tu stack no funciona" (link afiliado)
  - Email 4 (día 8): "Protocolo de 90 días" (link afiliado)
  - Email 5 (día 14): Oferta especial marca patrocinada

### 4) Patrocinios directos (cuando tengas tráfico)

Cuando superes 50K visitas/mes, contacta marcas como:
- **Thorne** — tienen programa de afiliados propio (10-15%)
- **Nootropics Depot** — programa directo
- **Momentous** (la marca de Huberman) — partnerships
- **Levels / Whoop** — sponsorship de newsletter

Oferta: "$X/mes por featured placement en top 5 essential supplements" o "Sponsorship del reporte IA".

### 5) Tráfico (cómo llegar ahí)

**SEO Long-tail (gratis, 3-6 meses):**
- "interacciones entre suplementos" — 8K/mes
- "stack para dormir mejor" — 12K/mes
- "suplementos para energía" — 18K/mes
- "ashwagandha con antidepresivos" — 1.5K/mes (compra muy calificada)
- "creatina qué día tomar" — 6K/mes
- "omega 3 anticoagulantes" — 1K/mes (urgencia médica)

Crea 10-15 landing pages con palabras clave long-tail vinculadas al Radar.

**TikTok/Reels (rápido, viral):**
- "Haz este test y descubre si tus suplementos se cancelan entre sí"
- "Tu stack score es X/100 — esto significa que..."
- "Doctor me dijo que dejara X porque..." + redirect al Radar
- Target: 25-45 años, audiencia biohacking (Huberman, Attia, Sinclair followers)

**Reddit (medium, 1-2 meses):**
- r/Supplements, r/StackAdvice, r/Nootropics, r/Biohackers
- No spam. Aporta valor genuino. Menciona la app cuando sea útil.

**Twitter/X (rápido, 3-6 meses):**
- Build in public: comparte métricas, edge cases interesantes
- Target: founders + health optimizers
- Ghost posts / threads con stats reales

### 6) Proyección realista

| Tráfico mensual | CTR producto | Ventas | Ticket | Comisión | Email list | Valor lista/mes |
|-----------------|--------------|--------|--------|----------|------------|-----------------|
| 10K | 6% | 30 | $35 | $63 | 500 | $0 |
| 50K | 8% | 200 | $40 | $480 | 3K | $300 |
| 100K | 10% | 600 | $45 | $1,620 | 8K | $1,200 |
| 500K | 12% | 3.6K | $50 | $10,800 | 50K | $12,500 |

Con email marketing + 100K visitas: **~$3-5K/mes** en 6-12 meses.
Con 500K visitas + email + patrocinios: **$25-40K/mes**.

---

## 🤖 Configurar IA (opcional, sube calidad y conversion)

La app funciona 100% sin API. Pero añadir IA sube el valor percibido y el share rate. Configura una de estas:

### Google Gemini (GRATIS, recomendado para empezar)

1. Ve a [aistudio.google.com](https://aistudio.google.com) → Get API key
2. Crea archivo en raíz: `ai-config.js` (NO commitear, agregar a .gitignore):
   ```js
   window.RADAR_AI_CONFIG = {
     provider: 'gemini',
     apiKey: 'AIzaSy...'
   };
   ```
3. Agrega en `index.html` antes de `app.js`:
   ```html
   <script src="ai-config.js"></script>
   ```

### OpenAI / Together / Groq

```js
window.RADAR_AI_CONFIG = {
  provider: 'openai',  // o 'openai'
  apiKey: 'sk-...',
  model: 'gpt-4o-mini',  // o 'llama-3.1-70b' (Together/Groq)
  baseUrl: 'https://api.openai.com/v1'  // opcional
};
```

**Importante:** El config se guarda en `localStorage` también. Si quieres que se configure desde UI, añade un panel admin (no incluido para mantener la app simple).

---

## 🔒 Privacidad

- No hay backend. No se guarda nada en servidor.
- Los datos del usuario viven solo en su navegador (localStorage opcional al cargar el reporte compartible).
- El email gate usa `mailto:` por defecto (no third party).
- Compatible con GDPR, CCPA.

---

## 📊 Métricas para trackear (analytics)

Añade antes de `</head>` en `index.html`:

```html
<!-- Plausible (privacy-first, recomendado) -->
<script defer data-domain="salud.yapido.click" src="https://plausible.io/js/script.js"></script>
```

Eventos a trackear (custom events):
- `quiz_start` — click en "Iniciar análisis"
- `quiz_complete` — envío del wizard
- `product_click` — click en CTA de Amazon/iHerb
- `share_click` — click en compartir
- `email_submit` — email capturado

---

## 🧪 Customización rápida

### Cambiar paleta
Edita `styles.css` sección `:root` (líneas 1-13).

### Añadir suplementos
Edita `data/supplements.js`. Schema:
```js
{
  id: 'mi_supp',
  name: 'Mi Suplemento',
  aliases: ['alias1', 'alias2'],
  category: 'vitamin',  // vitamin, mineral, herb, amino_acid, etc.
  evidence: 'high',     // high, medium, low
  dose: '500mg',
  dose_min: 500, dose_max: 1000, dose_unit: 'mg',
  timing: 'morning_with_fat',  // ver engine.js slots
  price_usd: 20,
  tags: ['focus', 'energy'],
  good_for: ['focus', 'energy', 'longevity'],  // debe matchear GOALS_LIST
  description: '...',
  synergies: ['otro_id'],
  avoid_with: ['med_id'],
  warnings: ['condition_id'],
  priority: 2  // 1=esencial, 6=opcional
}
```

### Añadir interacciones
Edita `data/interactions.js`:
```js
{
  a: 'supp_id_1', b: 'supp_id_2',
  severity: 'critical',  // critical, warning, info, safe
  title: 'Título corto',
  detail: 'Explicación detallada',
  recommendation: 'Qué hacer'
}
```

### Añadir objetivos
Edita `data/supplements.js` final, `window.GOALS_LIST`:
```js
{ id: 'mi_objetivo', label: 'Mi Objetivo', icon: '+', desc: 'Descripción' }
```
Y en `data/goals.js`, `window.GOAL_MAPPING`, añade el array de suplementos con pesos.

---

## ⚠️ Disclaimer legal

**IMPORTANTE:** Esta herramienta provee información EDUCATIVA basada en investigación publicada. **NO es consejo médico.** Siempre incluye el disclaimer visible (ya está en el reporte).

En tu disclosure de afiliados (requerido por FTC):
> "Como asociado de Amazon y iHerb, gano comisiones por compras elegibles. El precio para ti no cambia. Solo recomendamos productos que creemos entregan valor real."

---

## 🛠 Troubleshooting

**El reporte no se ve después del wizard:**
- Abre DevTools → Console
- Verifica que `window.SUPPLEMENTS_DB`, `window.INTERACTIONS_DB`, `window.GOAL_MAPPING`, `window.GOALS_LIST` están cargados
- Verifica que no hay error en `Engine.analyze()`

**Los chips no responden:**
- Verifica que el HTML tiene los `data-value` correctos
- El `id` del grupo debe matchear el `stateKey`

**El gauge no anima:**
- El SVG se inyecta con `requestAnimationFrame`. Si hay muchos nodos puede tardar 100ms.

**Las imágenes de Amazon/iHerb fallan:**
- Solo se renderiza el fallback de texto. El link de compra sí funciona.
- Si quieres añadir imágenes, considera usar [SerpAPI](https://serpapi.com) o scraping propio (avanzado).

---

## 📜 Licencia

Privado / Comercial. Todo el contenido es tuyo.

---

## 🎯 Roadmap (mejoras opcionales)

- [ ] Añadir CSV export del stack
- [ ] Integrar con [Cronometer](https://cronometer.com) para sincronizar stack
- [ ] Modo "siguiendo protocolo Attia / Huberman / Sinclair" con presets
- [ ] Panel admin para cambiar tags de afiliado sin tocar código
- [ ] A/B testing de CTAs
- [ ] Multi-idioma (EN, PT, FR)
- [ ] Integración con [Supplement.com](https://supplement.com) para auto-verificar disponibilidad
- [ ] App nativa via Capacitor (re-uso de `public/lavadoras` template)

---

**Hecho con evidencia. Optimizado para tu wallet. 2026.**
