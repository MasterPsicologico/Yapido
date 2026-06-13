# Sprite & Animation Conventions — Naruto Clash

> Conoce la convención de nombres antes de importar tus sprites. El
> `FighterController`, `MoveData` y la `IA` asumen estos nombres exactos.

---

## Estructura de carpetas en `Assets/Sprites/`

```
Sprites/
├── atlas_naruto.png              ← Sprite Atlas (Power of Two, 1024x1024)
├── atlas_sasuke.png
├── atlas_stage_valley.png
├── atlas_ui.png
├── fx_atlas.png                  ← VFX compartidos
└── characters/
    ├── naruto/
    │   ├── idle_0.png  ...  idle_5.png       ← 6 frames
    │   ├── walk_0.png  ...  walk_7.png       ← 8 frames
    │   ├── jump_0.png  ...  jump_3.png       ← 4 frames
    │   ├── crouch_0.png  crouch_1.png        ← 2 frames
    │   ├── light_punch_0..3.png              ← 4 frames (startup x2, active x1, recovery x1)
    │   ├── heavy_punch_0..5.png              ← 6 frames
    │   ├── crouch_punch_0..3.png
    │   ├── jump_punch_0..3.png
    │   ├── rasengan_0..9.png                 ← 10 frames
    │   ├── odama_rasengan_0..15.png          ← Cinematic, 16 frames
    │   ├── substitution_0..2.png
    │   ├── hit_0..1.png                      ← 2 frames de hit reaction
    │   ├── block_0.png
    │   ├── knockdown_0..4.png
    │   ├── wakeup_0..3.png
    │   ├── ko_0..1.png
    │   ├── awakening_0..9.png
    │   └── shadow.png                        ← sprite de sombra separado
    └── sasuke/
        └── ... (mismo patrón)
```

## Configuración de importación (Inspector)

Para **todos** los sprites de personaje:

| Property | Value |
|----------|-------|
| Texture Type | Sprite (2D and UI) |
| Sprite Mode | Single |
| Pixels Per Unit | **16** (ajustar al tamaño de tu pixel art; común: 16, 32, 64) |
| Mesh Type | Full Rect |
| Pivot | Bottom (0.5, 0) |
| Filter Mode | **Point (no filter)** |
| Compression | **None** (alta calidad) o ASTC 6x6 en mobile build |
| Max Size | 1024 |

## Sprite Atlas (Draw Call killer)

1. Crea un Sprite Atlas: `Right Click → Create → 2D → Sprite Atlas`
2. Nómbralo `atlas_naruto`
3. En "Objects for Packing" agrega la carpeta `characters/naruto/`
4. En "Settings":
   - **Allow Rotation**: OFF
   - **Tight Packing**: OFF (para pixel art)
   - **Padding**: 2 (evita bleeding)
   - **Filter Mode**: Point
   - **Compression**: None o ASTC
5. Aplica. Unity empaquetará todos los sprites en un solo PNG (1024x1024 típico)

---

## Animation Clips — Triggers requeridos

El `FighterController` manda estos **triggers** al `Animator` (definidos en
`MoveData.animationTrigger` o hardcodeados en el state machine):

| Trigger | Estado | Descripción |
|---------|--------|-------------|
| `idle` | Loop | Respiración en reposo |
| `walk` | Loop | Caminar |
| `crouch` | Bool/Loop | Agachado (loop) |
| `jump` | One-shot | Salto |
| `attack_light` | One-shot | Golpe débil |
| `attack_heavy` | One-shot | Golpe fuerte |
| `attack_crouch` | One-shot | Golpe agachado |
| `attack_air` | One-shot | Golpe aéreo |
| `special_rasengan` | One-shot | Rasengan (input buffer detecta QCF) |
| `special_chidori` | One-shot | Chidori |
| `special_amaterasu` | One-shot | Amaterasu |
| `special_kirin` | One-shot | Kirin |
| `awakening` | One-shot | Activación modo especial |
| `hit` | One-shot | Reacción a golpe |
| `blockstun` | One-shot | Bloqueando |
| `knockdown` | One-shot | Caída |
| `wakeup` | One-shot | Levantarse |
| `substitution` | One-shot | Sustitución |
| `ko` | One-shot | Round perdido |
| `intro` | One-shot | Intro del round |
| `victory` | One-shot | Pantalla de victoria |

## Parámetros del Animator Controller

```
Trigger idle, walk, crouch, jump
Trigger attack_light, attack_heavy, attack_crouch, attack_air
Trigger special_rasengan, special_chidori, special_amaterasu, special_kirin
Trigger awakening, hit, blockstun, knockdown, wakeup, substitution, ko, intro, victory
Bool blocking
Int StateFrame
```

## Frame timing

Las animaciones deben correr a **60 FPS fijos** (NO usar "Sample Rate" variable
en los clips). En el import del clip:

- **Sample Rate**: 60
- **Animation Type**: Generic 2D
- **Loop Time**: activado para idle/walk/crouch/blocking

## Hitbox activation (en animation events)

Si quieres más control que el basado en `MoveData.hitboxFrames`, puedes usar
**Animation Events** en los clips:

```csharp
// En un frame del clip "attack_light", añade un event llamado "OnHitboxFrame"
public void OnHitboxFrame() {
    // activa hitbox desde aquí
}
```

Esto se conecta en el Animator: selecciona el frame → "Add Event" → nombre
"OnHitboxFrame".
