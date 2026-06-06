# Cerebro de CineStream (Películas) — AGENTS.md

> Memoria para IA sobre la app de streaming /p.
> **Consulta obligatoria antes de modificar archivos en `public/p/` o `src/app/p/`.**

---

## Identidad del Proyecto

- **Nombre:** CineStream
- **Ruta:** `/p` — accesible via `https://misty-mountain.vercel.app/p`
- **Propósito:** Plataforma de streaming de películas con búsqueda, filtros y reproductor integrado
- **Stack:** Vanilla JS (app.js), Firebase Firestore (compat v9), CSS modular, Font Awesome 6
- **Tipo:** App cliente estática (no Next.js App Router — es HTML/JS puro embebido)

---

## Ubicación de Archivos

| Archivo | Propósito |
|---------|-----------|
| `public/p/app.js` | Lógica principal (1181 líneas) — búsqueda, filtros, reproductor, paginación |
| `public/p/firestore-service.js` | Servicio Firebase Firestore (440 líneas) — cache, rate limiting, sincronización |
| `public/p/styles.css` | Estilos base + imports de CSS modules |
| `public/p/anime-movies-data.json` | Datos de películas anime (One Piece, etc.) |
| `public/p/css/movies-grid.css` | Grid de películas responsive |
| `public/p/css/movie-card.css` | Tarjetas de película |
| `public/p/css/anime-hub.css` | Sección de anime |
| `public/p/css/responsive-*.css` | Media queries (mobile, tablet, desktop) |
| `src/app/p/page.tsx` | Página Next.js que carga los scripts vanilla |
| `scripts/fetch_anime_movies.js` | Script para obtener datos de anime de Archive.org |

---

## Arquitectura

```
src/app/p/page.tsx
    │
    ├── Carga Firebase compat (CDN)
    ├── Carga firestore-service.js  →  Conecta a Firestore (cinestream_movies)
    └── Carga app.js               →  Renderiza UI, maneja interacciones
```

- `page.tsx` es un wrapper Next.js (`'use client'`) que inyecta scripts vanila en el DOM
- Toda la lógica vive en `app.js` (vanilla JS) — NO usa React para el funcionamiento interno
- Los datos se almacenan en Firestore (colección `cinestream_movies`)
- Tiene rate limiting (6 requests/min) para evitar abusos a la API de YouTube/Archive

---

## Funcionalidades

1. **Catálogo de películas** con búsqueda por texto
2. **Filtros:** Género (12 categorías), Año, Tipo (Película/Documental)
3. **Ordenamiento:** Año, Título, Calificación
4. **Reproductor de video** con:
   - Play/Pause, adelantar/retroceder 10s
   - Control de volumen
   - Selector de calidad (480p, 720p, 1080p)
   - Pantalla completa
   - Barra de progreso
5. **Paginación** (12 películas por página) con scroll infinito
6. **Sección de anime** con datos precargados de JSON
7. **Caché local** en Firestore con verificación de contenido español

---

## Reglas Específicas

1. **NO mezclar** lógica de React con la lógica vanilla de CineStream
2. **Firebase compat v9** — usa `firebase.firestore()` (no la modular)
3. **Mismo proyecto Firebase** que Yapido: `studio-4796645076-6f375`
4. **Rate limiting** integrado en firestore-service.js — no sobrecargar
5. **CSS modular** en `public/p/css/` — los cambios deben ir ahí, no en styles.css

---

## Consideraciones Importantes

- `app.js` tiene **1181 líneas** — es el archivo principal y más complejo
- El reproductor soporta 3 modos: video directo, YouTube embed y placeholders
- Los títulos se filtran para mostrar solo contenido en español
- El cleanup en `page.tsx` elimina listeners y scripts al desmontar el componente

---

*Última actualización: 5 de Junio, 2026*
