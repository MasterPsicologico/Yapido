# Naruto Clash — Pixel Art Fighting Game

> Juego de lucha 1 vs 1 estilo Naruto Shippuden. Pixel Art premium (16/32-bit),
> combate 2D con físicas, IA con FSM, controles táctiles optimizados para
> iOS y Android.

**Stack:** Unity 2022.3 LTS · C# · URP (2D Renderer) · VFX Graph · Input System · IL2CPP

---

## Estado del proyecto

Este repositorio contiene el **código fuente completo (scripts C#)** y la
**estructura de carpetas** lista para abrirse con Unity 2022.3 LTS o superior.

| Componente | Estado |
|------------|--------|
| Arquitectura de combate | ✅ Listo |
| Controlador de luchador | ✅ Listo |
| Sistema de hitbox/hurtbox por frame | ✅ Listo |
| Input buffer + detección de comandos | ✅ Listo |
| IA con FSM (5 estados) | ✅ Listo |
| Recursos (chakra, sustitución, despertar) | ✅ Listo |
| Controles móviles (joystick + botones) | ✅ Listo |
| UI HUD (salud, chakra, sustitución) | ✅ Listo |
| VFX Manager + Rasengan + Cinematic Zoom | ✅ Listo |
| Audio Manager | ✅ Listo |
| ScriptableObjects de luchadores/movimientos | ✅ Listo |
| Pixel art assets (sprites, atlas) | ⏳ Pendiente (los aportas tú) |
| Animaciones (Animation Clips) | ⏳ Pendiente |
| Escenas (.unity) | ⏳ Pendiente |
| Configuración URP 2D | ⏳ Pendiente (1 click en Unity) |
| Build móvil (APK/IPA) | ⏳ Pendiente |

---

## Inicio rápido (TL;DR)

1. **Instala Unity Hub** + Unity 2022.3.62f1 LTS (o superior compatible).
2. **Clona/Abre** esta carpeta como proyecto Unity (la raíz es
   `public/juegos/naruto-clash/`).
3. Unity descargará los paquetes listados en `Packages/manifest.json` (URP,
   VFX Graph, Input System, 2D Animation).
4. Sigue [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) para terminar la configuración
   en el editor (5–10 min).
5. Sigue [`ARCHITECTURE.md`](./ARCHITECTURE.md) para entender cómo extender
   el sistema (crear nuevos luchadores, movimientos, IA, VFX).
6. Cuando tengas tus sprites pixel art, sigue la convención de nombres
   documentada y los Animation Clips caerán en su lugar.

---

## Estructura

```
naruto-clash/
├── Assets/
│   ├── Scripts/                  ← TODO el código C# del juego
│   │   ├── Core/                 ← GameManager, BattleManager, Camera, Pool
│   │   ├── Player/               ← FighterController + State Machine
│   │   ├── Combat/               ← Hitbox, Hurtbox, AttackData
│   │   ├── Input/                ← InputBuffer, CommandReader, Mobile
│   │   ├── Resources/            ← Chakra, Substitution, Awakening
│   │   ├── AI/                   ← FSM del rival (5 estados)
│   │   ├── VFX/                  ← VFX Manager + Rasengan + Cinematic Zoom
│   │   ├── UI/                   ← HUD móvil
│   │   ├── Audio/                ← Audio Manager
│   │   └── ScriptableObjects/    ← FighterData, MoveData, ComboData
│   ├── Sprites/                  ← (vacío) tus sprites pixel art aquí
│   ├── Animations/               ← (vacío) tus Animation Clips
│   ├── Prefabs/                  ← (vacío) prefabs de luchadores, VFX
│   ├── Materials/                ← materiales URP 2D
│   ├── Settings/                 ← URP Asset, Render Features
│   └── Scenes/                   ← escenas (.unity) que crees
├── Packages/manifest.json        ← dependencias Unity
├── ProjectSettings/              ← generado por Unity al abrir
└── README.md / SETUP_GUIDE.md / ARCHITECTURE.md
```

---

## Cómo se juega (gameplay loop)

```
Inicio del round
  → Countdown (3, 2, 1, ¡YA!)
  → Combate libre hasta KO o time-out
  → Victoria + reset
```

### Controles móviles

| Zona | Botón | Acción |
|------|-------|--------|
| Izquierda | Joystick analógico | Mover (correr / agachar con ↓) |
| Izquierda | Joystick ↑↑ (tap) | Saltar (doble tap = doble salto opcional) |
| Derecha, fila inferior | A — Golpe débil | Puñetazo / patada rápida |
| Derecha, fila inferior | B — Golpe fuerte | Golpe con mayor daño y recovery |
| Derecha, fila inferior | X — Chakra | Mantener = recargar chakra (vulnerable) |
| Derecha, fila inferior | Y — Sustitución | Teleport atrás del rival (3 cargas) |
| Derecha, arriba | Despertar | Activa el modo especial (requiere barra llena) |

### Comandos especiales (Input Buffer)

El sistema detecta automáticamente:

- **Quarter Circle Forward (QCF):** ↓ ↘ → + Golpe
- **Dragon Punch (DP):** → ↓ ↘ + Golpe
- **Half Circle Back (HCB):** → ↗ ↑ ↖ ← + Golpe
- **Dash:** Doble tap hacia adelante
- **Dash atrás:** Doble tap hacia atrás (consume chakra o es gratis)

---

## Filosofía de diseño

- **Pixel art fiel al espíritu SNES/Genesis premium** (no fake 32-bit).
  Sprites pequeños (32×64 a 96×128), 16/32 colores por frame, sin antialiasing
  en el juego, pero con shaders URP para iluminación 2D dinámica.
- **Combate frame-perfect** estilo BlazBlue / SF3:3S: el input buffer hace que
  las specials salgan aunque el jugador apriete los botones 1–2 frames antes
  de que el personaje esté "listo".
- **60 FPS fijos** en todo el gameplay loop (no variable timestep en combate).
- **IA humana**: la FSM no es "perfecta", tiene reacciones, distancia, y
  contraataques. Se equivoca como un humano (es lo que hace que un boss
  parezca vivo).

---

## Licencia y uso

Proyecto personal. Los nombres de personajes y jutsus pertenecen a sus
respectivos titulares (Masashi Kishimoto / Shueisha). El **código** de este
repositorio es tuyo. Los assets pixel art los aportarás tú o un artista.
