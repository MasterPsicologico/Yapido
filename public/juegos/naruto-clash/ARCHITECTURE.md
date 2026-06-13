# Arquitectura del proyecto Naruto Clash

> Documento de referencia para extender el juego. Léelo antes de añadir
> un nuevo personaje, movimiento, estado de IA o VFX.

## Visión general

El juego sigue un patrón **Entity-Component-System ligero** sobre
MonoBehaviour, con tres ejes principales:

```
INPUT  →  FIGHTER  →  COMBAT
   │         │           │
   │         │           └── Hitboxes / Hurtboxes
   │         │           └── VFX
   │         │           └── Audio
   │         │
   │         └── State Machine (FSM)
   │         └── Resources (Chakra, Substitution, Awakening)
   │
   └── InputBuffer + CommandReader
   └── MobileInputManager (joystick + botones UI)
```

Y un **GameManager** singleton que orquesta rounds, tiempo, cámara, HUD.

---

## 1. ScriptableObjects (datos puros, sin lógica)

Todo lo que es **dato** (stats, movimientos, combos) es un ScriptableObject.
Esto permite crear nuevos personajes y moves sin tocar código.

### `FighterData` (Assets/Scripts/ScriptableObjects/FighterData.cs)

Contiene:
- `maxHealth`, `maxChakra`, `walkSpeed`, `jumpForce`, `crouchSpeed`
- `awakeningRequired` (cuánta barra se necesita para despertar)
- `substitutionCharges` (típicamente 3)
- `moveset: MoveData[]` (todos los movimientos disponibles)
- `combos: ComboData[]` (secuencias de movimientos)
- `awakenedForm: FighterData` (opcional — datos de la forma despierta)

### `MoveData` (Assets/Scripts/ScriptableObjects/MoveData.cs)

Define un único movimiento. Contiene:
- `startupFrames`, `activeFrames`, `recoveryFrames` (frame data estilo Street Fighter)
- `damage`, `hitstun`, `blockstun`
- `pushbackOnHit`, `pushbackOnBlock`
- `attackLevel` (High / Mid / Low — para blocking)
- `chakraCost`
- `isSpecial`, `isAwakeningMove`
- `hitboxFrames: HitboxFrame[]` (qué hitbox activar en qué frame y con qué offset/tamaño)
- `vfxOnActivation: GameObject` (prefab de partículas, se instancia en `VFX_Anchor`)
- `sfxOnActivation: AudioClip`
- `animationTrigger: string` (el trigger que se manda al Animator)
- `cancelInto: MoveData[]` (qué movimientos pueden cancelar este)

### `ComboData` (Assets/Scripts/ScriptableObjects/ComboData.cs)

Cadena de moves con timing:
```
ComboData {
  string name;
  MoveData[] sequence;
  int[] windowAfterHit;    // cuántos frames después del HIT el siguiente move puede entrar
  int[] windowOnBlock;     // ventana si fue bloqueado
  bool requiresChakra;
}
```

---

## 2. Sistema de combate

### Hitbox vs Hurtbox

Ambos son `BoxCollider2D` con `isTrigger = true`. La diferencia es semántica:

- **Hurtbox** = zona del cuerpo que **recibe** daño
  - 3 colliders por luchador: `High`, `Mid`, `Low`
  - Nunca se desactivan (siempre vulnerable a no ser que el fighter esté en estado `Invulnerable`)

- **Hitbox** = zona del ataque que **inflige** daño
  - Hijos de `Hitbox_Origin` (que sigue la mano, el pie, el arma)
  - Solo se activan durante los `activeFrames` del MoveData
  - Se desactivan el resto del tiempo (evita double-hits)

### Detección

`Hitbox.OnTriggerEnter2D` → llama a `CollisionDetector.ProcessHit(this, other)` →
verifica que `other` es un `Hurtbox` y que el Hurtbox es del equipo contrario →
consulta `MoveData.attackLevel` vs estado del rival (parado/agachado/saltando) →
resuelve bloqueo, hit, contador de hits del combo, etc.

### State Resolution (qué pasa cuando un hit conecta)

```
Hitbox conecta con Hurtbox
  ├─ Rival en estado Blocking + nivel correcto
  │    └─ Aplica chip damage (10% del daño)
  │    └─ Aplica Blockstun (impide actuar X frames)
  │    └─ Pushback (rechaza)
  │    └─ SFX "block"
  │
  └─ Rival no bloquea
       └─ Aplica daño
       └─ Aplica Hitstun
       └─ Pushback
       └─ Knockdown si hitstun > threshold
       └─ Hitstop (pausa global de 6-12 frames, estilo BlazBlue)
       └─ SFX "hit" + cámara shake opcional
```

---

## 3. State Machine del Fighter

`FighterStateMachine.cs` usa el patrón **IState**:

```csharp
public interface IFighterState {
    void Enter(FighterController f);
    void Update(FighterController f, float dt);
    void FixedUpdate(FighterController f, float dt);
    void Exit(FighterController f);
}
```

Estados incluidos:
- `IdleState` — quieto en el suelo
- `WalkState` — caminando (izq/der según joystick)
- `JumpState` — en el aire
- `CrouchState` — agachado
- `LightAttackState`, `HeavyAttackState` — ataques melee
- `SpecialAttackState` — Jutsus
- `HitState` — recibiendo golpe
- `BlockState` — bloqueando
- `KnockdownState` — caído
- `WakeupState` — levantándose
- `SubstitutionState` — teletransporte
- `AwakeningState` — modo especial activado
- `KOState` — round perdido

El estado de **Hit** no se cancela por input — el luchador está en hitstun.

---

## 4. Input System

### `MobileInputManager.cs`

Lee los inputs desde la UI (joystick virtual + botones). Expone:

```csharp
public Vector2 JoystickAxis;          // -1 a 1
public bool ButtonLightPunch;
public bool ButtonHeavyPunch;
public bool ButtonChakra;             // held
public bool ButtonSubstitution;
public bool ButtonAwakening;
```

### `InputBuffer.cs`

Cola circular de inputs con timestamp. Retiene los últimos **N inputs** durante
**M milisegundos** (por defecto 16 inputs / 500ms).

```csharp
buffer.Record(InputEvent.LightPunch_Press, Time.frameCount);
buffer.Record(InputEvent.Joystick_Down,      Time.frameCount);
buffer.Record(InputEvent.Joystick_DownRight, Time.frameCount);
buffer.Record(InputEvent.Joystick_Right,     Time.frameCount);
buffer.Record(InputEvent.HeavyPunch_Press,   Time.frameCount);
```

### `CommandReader.cs`

Cada `MoveData` con `isSpecial = true` tiene una `CommandPattern`:

```
"QCF"      = Joystick down, downRight, right + botón
"DP"       = Joystick right, downRight, down + botón
"HCB"      = Joystick right, upRight, up, upLeft, left + botón
"Charge"   = hold left 30 frames + right + botón
"QuarterCircleBack" = down, downLeft, left + botón
```

`CommandReader.TryMatchCommand(InputBuffer buf, MoveData[] moves, out MoveData matched)`
recorre los `MoveData` con `isSpecial = true` y devuelve el primero que
matchee **dentro de la ventana de input** del MoveData (su `inputWindow`).

### Cancel windows

Si el MoveData A tiene `cancelInto = [B, C]`, el CommandReader, durante los
últimos frames de `recoveryFrames` del move A, permite que B o C se activen
inmediatamente (cancel normal). Si B conecta, B puede cancelar en C, etc.

---

## 5. IA con FSM (Rival)

`AIController.cs` usa el mismo patrón `IState` que el jugador, pero con
estados distintos:

```csharp
AIIdleState        // quieto, evalúa distancia
AIApproachState    // camina hacia el jugador
AIAttackState      // realiza un MoveData random de su moveset
AIDefensiveState   // bloquea si está en rango, intenta contraatacar
AIRangedState      // lanza kunais / shurikens (cuando tiene rango)
AIComboState       // encadena 2-4 hits si rompió la guardia
```

### Cerebro de la IA (toma de decisiones)

Cada `Update`, el AIController ejecuta `Brain.Decide()`:

```
1. distance = Vector2.Distance(self, opponent)
2. selfHealthPercent = health / maxHealth
3. opponentHealthPercent = opponent.health / max
4. isOpponentAttacking = opponent.state == Attacking
5. isOpponentRecovering = opponent.state in {Active, Recovery}
6. randomRoll = Random.value
```

Y elige transición:

```
si isOpponentAttacking && randomRoll < blockChance
  → AIDefensiveState (block)
si distance > rangedRange && chakra >= rangedCost
  → AIRangedState
si distance > approachRange
  → AIApproachState
si distance <= attackRange && isOpponentRecovering
  → AIComboState (encadena moves)
si distance <= attackRange
  → AIAttackState
si selfHealthPercent < 0.3 && randomRoll < desperationRoll
  → intenta AwakeningSpecial
default
  → AIIdleState (reacciona)
```

`blockChance`, `rangedChance`, `aggressionLevel` son tuneables desde el
Inspector → ajustan la "personalidad" del bot.

---

## 6. Recursos

### `ChakraSystem.cs`

- `currentChakra` (0 a maxChakra)
- `rechargeRate` (chakra por segundo mientras se mantiene el botón Chakra)
- `isRecharging` (bool, true mientras el botón está held)
- `TryConsume(amount)` → bool
- `OnRechargeTick(deltaTime)` → llamado por el `MobileInputManager` cada frame

Cuando `isRecharging = true`, el luchador:
- No puede moverse (input de joystick ignorado para caminar)
- No puede atacar
- Es interrumpido si recibe un golpe

### `SubstitutionSystem.cs`

- `charges` (0 a maxCharges, default 3)
- `TrySubstitute()` → bool (true si hay carga y timing es correcto)
- `OnHitReceived` → si se presiona Sustitución dentro de la ventana (5 frames
  antes del golpe), consume 1 carga, teletransporta al fighter detrás del
  rival, instancia tronco + humo, y cancela el hit.
- `RechargeOverTime(deltaTime)` → recupera 1 carga cada 12 segundos

### `AwakeningSystem.cs`

- `meter` (0 a 100)
- `Gain(amount)` al asestar combos largos o recibir daño
- `CanAwaken()` → meter >= awakeningRequired
- `Activate()` → cambia `FighterData` a `awakenedForm`, aplica buff temporal
  (más daño, acceso a super moves, sin hitstop, etc.)

---

## 7. VFX (Visual Effect Graph)

### `VFXManager.cs`

Singleton que mantiene un pool de VFXGraph (Rasengan, Chidori, Amaterasu,
Kirin, explosión kunai, humo de sustitución) para evitar instanciar/destruir.

```csharp
VFXManager.Instance.SpawnRasengan(Vector2 pos, Vector2 dir);
VFXManager.Instance.SpawnChidori(Transform parent);
VFXManager.Instance.SpawnAmaterasu(Vector2 pos);
VFXManager.Instance.SpawnKirin(Vector2 pos);  // cae del cielo con retardo
VFXManager.Instance.SpawnSubstitutionLog(Vector2 pos);
```

### `RasenganVFX.cs`

Cuando se llama desde Naruto, hace:
1. **Hitstop 0.5s** (`Time.timeScale = 0` por 0.5s reales, no escalado)
2. **CinematicZoom** (la cámara se acerca 1.5x en 0.2s)
3. **Cambia background** a "speed lines" shader
4. **Spawnea el VFX Graph** del Rasengan en `VFX_Anchor`
5. El proyectil viaja hacia el oponente con un trail azul claro
6. Al impactar: hitstop de 12 frames + shake de cámara

### `KirinVFX.cs`

1. Oscurece la escena (overlay negro al 60%)
2. Invoca un **ProceduralNoiseLightning** que dibuja un relámpago desde la
   nube al punto objetivo (algoritmo de noise + segmentación)
3. El relámpago cae con delay 0.8s
4. Impacto: AOE masivo + pantalla blanca 0.1s + shake fuerte

---

## 8. UI móvil

`MobileHUD.cs` está estructurado para auto-construirse en el Awake (o
referenciar a hijos ya creados en el Editor).

Layout recomendado (9:16 portrait):

```
┌──────────────────────────┐
│ [P1 HUD]      [P2 HUD]   │  ← barras arriba
│                          │
│                          │
│        STAGE             │
│                          │
│                          │
│ [A][B]                   │
│ [X][Y]   [Despertar]    │  ← botones derecha
│                          │
│ [JOYSTICK]               │  ← joystick izquierda
└──────────────────────────┘
```

### Componentes

- `HealthBar.cs` — interpolada, con drain animation y nombre del luchador
- `ChakraBar.cs` — más delgada, color azul, debajo de la health
- `SubstitutionBar.cs` — 3 puntos/iconos
- `MobileHUD.cs` — construye y conecta todo

---

## 9. Cámara y Camera Shake

`CameraController.cs`:
- Sigue al **punto medio** entre los dos fighters (lerp suave)
- Límites: no salir del escenario (configurable con bounds)
- Zoom dinámico: aleja cuando los fighters están lejos, acerca cuando cerca
- API: `Shake(intensity, duration)` — llamada por VFX y Hitbox en hits fuertes
- API: `CinematicZoom(target, duration)` — para super moves

---

## 10. Audio

`AudioManager.cs` (basado en Unity Audio Mixer):

- **AudioMixerGroup: SFX** → kunais, hits, blocks
- **AudioMixerGroup: VOX** → voces de los personajes (ataques, special moves)
- **AudioMixerGroup: BGM** → música de fondo por stage
- **AudioMixerGroup: UI** → clicks de botones

Carga con `Resources.LoadAsync<AudioClip>()` o Addressables, y pre-cachea
todos los clips al inicio de la escena para evitar I/O en mitad del combate.

---

## Cómo añadir un nuevo personaje

1. Crea un `FighterData` (ScriptableObject) con stats
2. Crea un set de `MoveData` (1 por ataque: light, heavy, special, super)
3. Crea un `ComboData` o varios
4. Diseña los sprites pixel art + Animation Clips
5. Crea un prefab siguiendo la jerarquía del Setup Guide (sección 7)
6. Arrastra el FighterData al slot `data` del FighterController
7. Arrastra los MoveData al array `moveset`
8. Conecta el `MobileInputManager` y el `opponent`
9. (Opcional) Crea una `AIController` con un perfil de IA distinto

El FighterController es **agnóstico al personaje** — toda la diferencia
está en los datos y assets.

---

## Convenciones de naming

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Clase C# | PascalCase | `FighterController` |
| Método público | PascalCase | `TryConsumeChakra` |
| Variable privada | camelCase | `currentChakra` |
| Variable pública | camelCase | `walkSpeed` |
| Constante | UPPER_SNAKE | `MAX_BUFFER_SIZE` |
| ScriptableObject asset | `PascalCase.asset` | `Naruto.asset` |
| Prefab | `lowercase-kebab.prefab` | `naruto-fighter.prefab` |
| Animación trigger | `snake_case` | `attack_heavy_punch` |
| Layer | `PascalCase` | `Hitboxes`, `Hurtboxes` |

---

## Próximos pasos técnicos (post-MVP)

- [ ] **Netcode**: para que sea 1v1 online (Unity Netcode for GameObjects)
- [ ] **Más luchadores**: Sasuke, Sakura, Kakashi, Gaara, Rock Lee, Itachi
- [ ] **Modo Arcade**: ladder de 8 oponentes con diálogos
- [ ] **Modo Historia**: vs bosses con scripting
- [ ] **Tutorial in-game**: comando a comando, con UI overlay
- [ ] **Replay system**: grabar inputs y re-simular
- [ ] **Ranked online**: matchmaking con ELO
- [ ] **Skins / colores alternativos** por personaje
- [ ] **Localización** (ES, EN, JP, PT-BR)
