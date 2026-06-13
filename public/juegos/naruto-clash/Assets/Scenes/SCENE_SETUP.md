# Scene Bootstrap — Cómo armar la primera escena

> El proyecto **no incluye un archivo `.unity`** porque Unity los genera al
> guardar. Pero para que arranques en 5 minutos, sigue estos pasos.

## 1. Crear la escena

`File → New Scene → 2D (URP) → Create`
Guarda como `Assets/Scenes/Battle_Valley.unity`

## 2. Hierarchy mínima

```
[Scene]
├── Main Camera                 ← tag MainCamera, orthographic size 6
│   └── (script) CinematicZoom
│   └── (script) CameraController
├── EventSystem                 ← necesario para UI
├── Canvas (Screen Space - Overlay)
│   ├── Joystick                ← VirtualJoystick.cs
│   ├── ButtonLightPunch        ← Image + Button
│   ├── ButtonHeavyPunch
│   ├── ButtonChakra
│   ├── ButtonSubstitution
│   ├── ButtonAwakening
│   ├── P1_Bars (RectTransform)
│   │   ├── HealthBar (script)
│   │   ├── ChakraBar (script)
│   │   └── SubstitutionBar (script)
│   ├── P2_Bars
│   │   └── (igual)
│   ├── TimerText
│   ├── P1_Wins (Text)
│   ├── P2_Wins (Text)
│   └── SpeedLinesOverlay (script)
├── Ground                      ← BoxCollider2D no-trigger, largo 30
├── Wall_Left                   ← BoxCollider2D no-trigger
├── Wall_Right
├── BattleManager               ← BattleManager.cs
├── GameManager                 ← GameManager.cs
├── AudioManager                ← AudioManager.cs
├── VFXManager                  ← VFXManager.cs
├── ObjectPool                  ← ObjectPool.cs
├── TimeManager                 ← TimeManager.cs
├── MobileInputManager          ← MobileInputManager.cs
├── AIController (Player2)      ← AIController.cs
├── Naruto                      ← FighterController + sprites
└── Sasuke                      ← FighterController + sprites
```

## 3. Asignar componentes (jerarquía de Naruto)

```
Naruto (GameObject root)
├── BoxCollider2D               ← body collider
├── Rigidbody2D                 ← Dynamic, gravity 3.5
├── FighterController           ← Data = naruto.asset, Opponent = Sasuke
├── Animator                    ← Animator Controller = naruto_animator
├── Hitbox_Origin (Transform)
│   ├── Hitbox_Punch
│   │   ├── BoxCollider2D (isTrigger)
│   │   └── Hitbox.cs
│   ├── Hitbox_Kick
│   │   ├── BoxCollider2D (isTrigger)
│   │   └── Hitbox.cs
│   └── Hitbox_Rasengan
│       ├── BoxCollider2D (isTrigger)
│       └── Hitbox.cs
├── Hurtbox_High
│   ├── BoxCollider2D (isTrigger, small)
│   └── Hurtbox.cs (region = High)
├── Hurtbox_Mid
│   ├── BoxCollider2D (isTrigger, torso)
│   └── Hurtbox.cs (region = Mid)
├── Hurtbox_Low
│   ├── BoxCollider2D (isTrigger, legs)
│   └── Hurtbox.cs (region = Low)
├── SpriteRenderer (idle sprite, sort layer = Fighters)
├── VFX_Anchor (Transform)
└── GroundCheck (Transform, hijo con offset y = -1)
```

Repite para Sasuke, con su propio `FighterData` y sprites.

## 4. Crear ScriptableObjects mínimos

### FighterData Naruto

```
Create → NarutoClash → Fighter Data
  fighterId:    "naruto"
  displayName:  "Naruto Uzumaki"
  maxHealth:    1000
  maxChakra:    100
  walkSpeed:    3.5
  jumpForce:    12
  maxJumps:     1
  substitutionCharges: 3
  awakeningRequired: 100
  animatorController: [drag naruto_animator.controller]
  moveset: [arrastrar todos los MoveData de Naruto]
  combos:  [arrastrar todos los ComboData de Naruto]
  aiBlockChance: 0.4
  aiAggression: 0.85
```

### MoveData: light_punch

```
moveId:        "light_punch"
displayName:   "Light Punch"
command:       LightPunch
startupFrames: 4
activeFrames:  3
recoveryFrames: 6
damage:        30
hitstun:       14
blockstun:     8
hitstopFrames: 6
attackLevel:   Mid
chakraCost:    0
isSpecial:     false
animationTrigger: "attack_light"
hitboxFrames: [ { frameIndex: 0, localOffset: (0.7, 0.6), size: (0.5, 0.4), hitboxName: "Hitbox_Punch" } ]
```

Repite para todos los demás moves (ver CHARACTER_ROSTER.md).

### ComboData: naruto_basic_3hit

```
comboId: "naruto_basic_3hit"
displayName: "Basic 3-Hit"
sequence: [light_punch, light_punch, heavy_punch]
hitWindowFrames: [8, 8, 14]
blockWindowFrames: [4, 4, 0]
```

## 5. Crear el Animator Controller

1. `Right click → Create → Animator Controller` → `naruto_animator.controller`
2. Abre la ventana Animator
3. Crea los estados (con sus clips):
   - `Idle` ← clip `naruto/idle.anim`
   - `Walk` ← clip `naruto/walk.anim`
   - `Jump`, `Crouch`, `LightPunch`, `HeavyPunch`, etc.
4. Conecta con transiciones:
   - `Idle → Walk` (en bool `walking = true`)
   - `Walk → Idle` (en `walking = false`)
   - `Idle → LightPunch` (en trigger `attack_light`)
   - `LightPunch → Idle` (cuando termina, "Has Exit Time" activado)
5. Asegúrate de que cada estado de ataque tiene "Has Exit Time" = true y
   "Exit Time" = 1.0 (espera a que termine la animación antes de volver a Idle)

## 6. Crear el VFX Graph (Rasengan)

1. `Right click → Create → Visual Effects → Visual Effect Graph`
2. Nombre: `vfx_rasengan.vfx`
3. Configura:
   - **Output Particle**: Quad
   - **Spawn Rate**: 60
   - **Initial Size**: random 0.2-0.4
   - **Color over Life**: blanco → azul claro → transparente
   - **Velocity**: random outward + circular
4. Añade un **Point Light** al output para que ilumine el escenario (URP 2D)
5. Crea un prefab `RasenganProjectile.prefab` con:
   - SpriteRenderer (sphere pixel art, 16x16)
   - Rigidbody2D (kinematic)
   - BoxCollider2D (trigger)
   - Projectile.cs
   - VFX Graph Component (referencia al .vfx)

## 7. Audio

- Crea un AudioMixer: `Assets/Settings/MasterMixer.mixer`
- 4 grupos: SFX, VOX, BGM, UI
- Asigna los grupos en `AudioManager.cs`
- Coloca los `.wav` o `.ogg` en `Assets/Resources/SFX/`
- BGM en `Assets/Resources/BGM/`

## 8. Build & Test

- Play en el editor: el fighter 1 debería poder caminar, pegar y el fighter 2
  debería ser controlado por la IA
- File → Build Settings → Android → Build → genera APK
- Instala en tu celular y juega

---

## Troubleshooting rápido

| Síntoma | Causa probable |
|---------|----------------|
| El fighter se cae al vacío | No hay suelo (BoxCollider2D no-trigger) |
| Los sprites no se ven | Sorting Layer mal asignada |
| La IA no hace nada | AIController no está en Player2 |
| Los botones UI no responden | Falta EventSystem en la escena |
| El Hitbox no aplica daño | El Hurtbox está asignado a un hijo equivocado |
| `NullReferenceException` en Awake | No asignaste `Data` (FighterData) en el prefab |
| Todo se ve borroso | Filter Mode = Bilinear (debe ser Point) |
