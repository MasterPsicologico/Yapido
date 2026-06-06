# 🎬 Motor Integrado de Escenas 3D (Blender + Arte Procedimental)

> **Stack:** Vite + TypeScript + Three.js + GSAP + Anime.js  
> **Arquitectura:** Modular, tipado estricto, sin fugas de VRAM.  
> **Categoría:** Motor gráfico generativo en tiempo real con **kinetic typography** sincronizada.

---

## ✨ Características

- **Carga de modelos Blender** vía `GLTFLoader` + `DRACOLoader` (compresión Draco).
- **Generación procedural pura** cuando no se provee modelo (formas icosaédricas, torus knots, octaedros, clusters de cubos).
- **Sistema de partículas** con `THREE.Points` + textura radial procedural.
- **Iluminación cinematográfica** (Key, Rim, Spots con sombras PCFSoft).
- **Tone mapping ACES Filmic** y sombras suaves (`PCFSoftShadowMap`).
- **Coreografía de cámara** con `GSAP Timeline` (curvas easings aleatorias, looping con yoyo).
- **ScrollTrigger**: el scroll altera metalness, roughness y emissive en vivo.
- **Análisis semántico del prompt** (cyberpunk, orgánico, etéreo, volcánico).
- **Kinetic typography automática**: el prompt se transforma en palabras animadas sobre la escena 3D.
  - Title / Subtitle / Keywords / Descriptors — todos con timing y efecto según la categoría semántica.
  - 9 efectos de entrada (fade, glitch, scale, blur, split-chars, slide, rotate, typewriter).
  - 5 efectos de salida (fade, scale-down, slide-up, dissolve, burn).
  - **Mouse parallax** continuo en cada palabra (cada una con profundidad aleatoria).
  - **Click en una palabra** → re-renderiza la escena con esa palabra como nuevo prompt.
- **Limpieza agresiva de VRAM** entre renderizados (sin fugas de memoria).
- **Exportación instantánea**: PNG (frame), WebM (5s de video) y JSON (receta reproducible).
- **UI minimalista** con micro-interacciones Anime.js (escaneo, distorsión, hint de scroll).
- **Bucle unificado** a 60/120/144 Hz (sin relojes desincronizados).

---

## 🚀 Instalación

```bash
# 1. Entrar al directorio
cd "C:\Users\dcard\OneDrive\Escritorio\Uix\public\animaciones"

# 2. Instalar dependencias
npm install

# 3. Modo desarrollo (Vite dev server)
npm run dev

# 4. Build de producción
npm run build

# 5. Verificar tipos TypeScript
npm run typecheck
```

El dev server arranca en `http://localhost:5173` (Vite lo abrirá automáticamente).

---

## 🏗️ Arquitectura

```
src/
├── main.ts                  # Orquestador: conecta todos los módulos
├── style.css                # Estilos + capa de kinetic typography
├── types/
│   └── index.ts             # Tipos compartidos (SemanticProfile, GenerativeRecipe)
├── core/
│   ├── SceneManager.ts      # WebGL renderer, escena, cámara, bucle principal
│   ├── ModelLoader.ts       # GLTFLoader + DRACOLoader + sombras + AnimationMixer
│   ├── GenerativeEngine.ts  # Limpieza VRAM + procedural + GSAP + ScrollTrigger
│   └── Textualizer.ts       # Prompt → TextScript (title/subtitle/keywords/descriptors)
├── ui/
│   └── UIManager.ts         # DOM + Anime.js + tipografía cinética + parallax
└── utils/
    ├── SemanticMapper.ts    # Análisis textual → perfil cromático
    └── Downloader.ts        # PNG / WebM / JSON
```

### Diagrama de flujo

```
                          ┌──────────────────┐
                          │  Textualizer     │
                          │  prompt → script │
                          └────────┬─────────┘
                                   │ TextScript
                                   ▼
  ┌──────────────┐    click     ┌──────────────────┐
  │   UIManager  │────────────▶│  GenerativeEngine │
  │  (Anime.js)  │             │  • disposeVRAM    │
  │  + Tipografía│             │  • semanticAnalyze│
  └──────┬───────┘             │  • procedural     │
         │                     │  • GSAP timeline  │
         │ mouse parallax      │  • ScrollTrigger  │
         ▼                     └──────────────────┘
  ┌──────────────┐
  │  #typo-layer │  (palabras animadas con mix-blend-mode: screen)
  └──────────────┘
         ▲
         │ animation tick
  ┌──────────────┐
  │ SceneManager │◀──── 60/120/144 Hz ─────
  │  (Three.js)  │
  └──────────────┘
         ▲
         │ load
  ┌──────────────┐
  │  ModelLoader │
  │ (GLTF/DRACO) │
  └──────────────┘
```

---

## 🎨 Cómo integrar un modelo de Blender

1. **Exporta desde Blender** tu modelo en formato `.glb` o `.gltf`.
   - En Blender: *File → Export → glTF 2.0 (.glb/.gltf)*.
   - Activa **Compression → Draco mesh compression** si quieres mallas más ligeras.
   - Marca **Animation** si quieres incluir animaciones nativas.

2. **Coloca el archivo** dentro de `public/models/` (por ejemplo, `public/models/mi-modelo.glb`).

3. **Modifica `src/main.ts`** en la llamada a `iniciarRenderizadoGenerativo`:

   ```ts
   await generativeEngine.iniciarRenderizadoGenerativo(idea, {
     modelUrl: '/models/mi-modelo.glb',
     playAnimation: 0, // índice de la animación a reproducir
     seed: 42          // semilla PRNG (mismo seed → misma escena)
   });
   ```

4. **Listo.** Al pulsar "Comenzar Renderizado", el motor:
   - Limpia la escena anterior.
   - Carga tu `.glb` con DRACO.
   - Activa sombras en cada mesh automáticamente.
   - Inyecta partículas, luces y atmósfera alrededor de tu modelo.
   - Coreografía la cámara con GSAP.

---

## 🧠 Cómo interactúa el botón generativo

Cuando el usuario escribe una idea y pulsa **"Comenzar Renderizado"**:

| Etapa | Qué pasa |
|-------|----------|
| **1. Análisis semántico** | `SemanticMapper` tokeniza el texto y compara contra un diccionario bilingüe (ES/EN). Calcula un perfil: `baseHue`, `accentHue`, `roughness`, `metalness`, `form`, etc. |
| **2. Limpieza VRAM** | Se llama a `SceneManager.disposeScene()`: cada `Mesh.geometry.dispose()`, cada `material.dispose()`, cada `texture.dispose()`. Se matan timelines y ScrollTriggers. |
| **3. Inyección procedural** | Si hay modelo Blender, se carga. Si no, se genera uno procedural con primitivas (`Icosahedron`, `TorusKnot`, `Octahedron` o cluster de `BoxGeometry`). |
| **4. Iluminación** | Se añaden luces direccionales, puntuales y spot con colores derivados del perfil semántico. |
| **5. Partículas** | Sistema `THREE.Points` con `BufferGeometry` (800 puntos) y textura radial generada con `<canvas>`. |
| **6. Materiales** | Recorrido de todos los meshes → aplica PBR con los valores del perfil. |
| **7. Coreografía GSAP** | 4-5 keyframes aleatorios de cámara (posición + lookAt) con easings variados (`power3.inOut`, `elastic.out`, `back.out`…). |
| **8. ScrollTrigger** | Al hacer scroll, `metalness` y `emissive` se intensifican progresivamente (efecto "se vuelve espejo"). |
| **9. Kinetic typography** | `Textualizer` tokeniza el prompt, filtra stopwords y extrae keywords clasificadas. Genera un `TextScript` con title + subtitle + 5-7 keywords + 3-4 descriptors. `UIManager` lo ejecuta con Anime.js sobre la capa DOM `#typo-layer` con `mix-blend-mode: screen` para integrarse visualmente con el 3D. |
| **10. Receta** | Se guarda un `GenerativeRecipe` con todos los parámetros para poder exportar y reproducir. |

---

## ✍️ Kinetic Typography (interrelaciones interactivas)

La capa tipográfica (`#typo-layer`, `z-index: 7`) se sincroniza con la escena 3D. Cada palabra de tu prompt se anima con su propio efecto, según la categoría semántica detectada.

### Estructura del ciclo (14 s, en loop)

| Tiempo | Evento | Efecto típico |
|--------|--------|---------------|
| 0.0 – 2.5s | **TITLE** (palabra más evocadora del prompt) | `split-chars` / `glitch` / `blur` según categoría |
| 2.7 – 4.8s | **SUBTITLE** (2-3 keywords combinados) | `slide-up` |
| 5.0 – 10.5s | **5-7 KEYWORDS** (dispersos alrededor del modelo 3D) | `glitch` (cyberpunk) · `slide-up` (organic) · `blur` (ethereal) · `scale` (volcanic) |
| 10.5 – 13.0s | **3-4 DESCRIPTORS** (frases tipo "running text") | `typewriter` con caret parpadeante |
| 13.0 – 14.0s | Pausa | — |

### Categorías visuales

| Categoría | Aspecto | Efecto de entrada | Efecto de salida |
|-----------|---------|-------------------|-------------------|
| **cyberpunk** | monospace, mayúsculas, glow neón con RGB-split | `glitch` | `scale-down` |
| **organic** | itálica, glow verde | `slide-up` | `fade` |
| **ethereal** | thin, blur, aura cristalina | `blur` | `dissolve` |
| **volcanic** | bold, temblor, brasas | `scale` (elastic) | `burn` (shake + flash) |
| **neutral** | limpio, clásico | `fade` | `fade` |

### Interacciones

- **🖱 Mouse parallax**: cada palabra tiene una profundidad aleatoria (0.4–1.0). Al mover el mouse, todas las palabras se desplazan siguiendo la posición del cursor con su propio factor de profundidad.
- **🖱 Hover sobre keyword**: la palabra se ilumina con glow intensificado.
- **🖱 Click sobre keyword**: re-renderiza la escena 3D con esa palabra como nuevo prompt. La nueva escena hereda el perfil cromático de la palabra clicada.
- **🎬 Sincronía con 3D**: misma paleta cromática (CSS variables `--typo-accent`, `--typo-glow`, etc.), mismo seed PRNG, mismo perfil semántico → todo se siente como un único sistema.

---

## ⬇️ Exportación instantánea

Una vez generada la escena, el panel habilita tres botones de descarga:

| Botón | Formato | Uso |
|-------|---------|-----|
| **Descargar WebM** | `video/webm` (VP9/VP8) | Video de 5 segundos capturando el canvas a 60 fps. Listo para redes o presentaciones. |
| **Descargar PNG** | `image/png` | Fotograma estático del estado actual. |
| **Exportar Receta** | `application/json` | Parámetros exactos: prompt, seed, posiciones, easings, materiales. Permite reproducir la misma escena cambiando el `seed`. |

---

## 🎛️ Prompts de ejemplo

| Prompt | Resultado esperado |
|--------|-------------------|
| `"cyberpunk neon city at night"` | Cian + magenta, alto contraste, clusters de cubos, muchas partículas, **keywords** "NEON · CIRCUIT · GLITCH · MATRIX" con efecto glitch. |
| `"organic forest spirit"` | Verde-tierra, formas curvas (icosaedro), baja metalicidad, **title** "BOSQUE" con split-chars orgánico. |
| `"ethereal crystal temple"` | Azul-violeta, brillo intenso, alta transparencia, ambiente místico, **title** "CRISTAL" con entrada blur. |
| `"volcanic metal core"` | Rojo-naranja, alto metalness, torus knots, spots cálidos, **title** "VOLCAN" con scale elástico y salida burning. |
| `"hello world"` | Modo aleatorio puro (pocas keywords detectadas → fallback del perfil), PRNG sembrado con timestamp. |

---

## 🧪 Tipos de cambio / Verificación

```bash
# Verificar tipos sin emitir JS
npm run typecheck

# Build de producción
npm run build
```

---

## 📐 Decisiones de diseño

- **Bucle único (`renderer.setAnimationLoop`)**: cualquier animación, sea de Blender (`AnimationMixer`) o de GSAP, se sincroniza aquí. Pantallas 120/144 Hz funcionan sin tearing.
- **Limpieza de VRAM recursiva**: previene crashes en sesiones largas. Es **crítico** en WebGL: las texturas y geometrías NO se liberan automáticamente al quitar nodos de la escena.
- **PRNG sembrado (Mulberry32)**: la misma semilla produce la misma escena → idempotencia y reproducibilidad.
- **Tone mapping ACES Filmic**: respuesta fílmica estándar. Los modos Lineal o Reinhard dan resultados "planos".
- **Shadows PCFSoft**: mejor compromiso rendimiento/calidad. Las sombras duras (BasicShadowMap) producen artefactos visibles.

---

## 🩺 Depuración

En modo dev (`npm run dev`), la consola del navegador expone:

```js
__motor3d.sceneManager       // Acceso al renderer + escena
__motor3d.generativeEngine   // Re-generar manualmente
__motor3d.downloader         // Probar exports
```

---

## 📜 Licencia

MIT — Úsalo donde quieras. 🎬
