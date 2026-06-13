# Guía de juegos — HTML/CSS/JS standalone

> Una guía educativa interactiva que explica cómo se hace un videojuego:
> las 5 capas, las 7 fases de producción, las herramientas, los costos
> reales y el roadmap concreto para Naruto Clash.

## Cómo abrirla

**Opción 1 — Doble click:**
Abre `index.html` directamente en tu navegador (Chrome, Firefox, Edge, Safari).
No necesita servidor.

**Opción 2 — Servidor local (recomendado):**
```bash
# con Python
python -m http.server 8080

# con Node
npx serve .
```

Luego visita `http://localhost:8080`.

**Opción 3 — VSCode Live Server:**
Instala la extensión "Live Server" y haz click derecho en `index.html`
→ "Open with Live Server".

## Estructura

```
guide/
├── index.html      ← markup completo, 12 secciones
├── styles.css      ← sistema de diseño editorial (paper/ink/acid)
├── app.js          ← loader, smooth scroll, reveals, calculadora
└── README.md       ← este archivo
```

## Contenido (12 secciones)

1. **Mito vs realidad** — 4 mitos comunes desmontados
2. **La regla 30/30/20/20** — cómo se divide el trabajo real
3. **Las 5 capas** — código, visual, audio, diseño, negocio
4. **Las 7 fases de producción** — concepto → Gold Master
5. **Stack tecnológico** — herramientas por capa con precios
6. **Cómo se hace un juego de lucha 2D** — frame data, hitboxes, IA
7. **Roadmap Naruto Clash** — 24 semanas divididas en 8 hitos
8. **Equipo y costos** — 7 roles + 3 escenarios
9. **Calculadora interactiva** — mueve los sliders
10. **10 errores comunes** — con fixes
11. **Recursos para aprender** — libros, canales, comunidades
12. **Tu siguiente paso** — el único que tienes que dar hoy

## Interactividad

- **Loader** con contador 000 → 100 al cargar
- **Lenis smooth scroll** (igual stack que `/z`)
- **GSAP ScrollTrigger** para reveals progresivos
- **Barras de la regla 30/30/20/20** se animan al entrar en viewport
- **Calculadora** que actualiza costos en tiempo real
- **Topbar sticky** con sombra al hacer scroll
- **Respeto por `prefers-reduced-motion`**

## Stack técnico

- HTML5 semántico
- CSS custom properties + grid + flex
- Google Fonts: Archivo Black, Inter, JetBrains Mono
- GSAP 3.13 + ScrollTrigger (CDN)
- Lenis 1.1 (CDN)
- Vanilla JS (sin frameworks, sin build step)

## Personalización rápida

- Cambiar colores: edita las variables en `:root` de `styles.css`
- Cambiar fuentes: edita el import de Google Fonts en `index.html`
- Cambiar copy: edita directamente `index.html`
- Cambiar cálculo de la calculadora: edita la función `recalc()` en `app.js`
