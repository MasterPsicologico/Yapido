# Setup Guide — Abrir el proyecto en Unity

> Tiempo estimado: 5–10 min la primera vez (luego Unity cachea los paquetes).

## 1. Instalar Unity

1. Descarga **Unity Hub** desde https://unity.com/download
2. Instala la versión **2022.3.62f1 LTS** (o cualquier 2022.3 LTS posterior)
3. En la instalación, marca los módulos:
   - **iOS Build Support** (si vas a compilar para iPhone/iPad)
   - **Android Build Support** (con Android SDK, NDK y OpenJDK)
   - **Windows Build Support** (para probar en tu PC)

## 2. Abrir el proyecto

1. Lanza Unity Hub
2. Click en **Open** → selecciona la carpeta `naruto-clash/`
3. Unity detectará `Packages/manifest.json` y descargará todas las dependencias:
   - URP, 2D Animation, VFX Graph, Input System, Cinemachine
4. Espera a que termine (5–10 min la primera vez)
5. Si Unity pregunta por **API Compatibility Level**, acepta **.NET Standard 2.1**
6. Si pregunta por **scripting backend**, elige **IL2CPP** (para móvil)

## 3. Configurar URP 2D (1 vez)

1. **Edit → Project Settings → Graphics**
2. **Scriptable Render Pipeline Settings:** crea un nuevo asset URP 2D
   - Click derecho en `Assets/Settings/` → Create → Rendering → URP Asset (with 2D Renderer)
3. Verifica que el asset se llame por ejemplo `URP2D-Default.asset`
4. Asigna ese asset en Project Settings → Graphics
5. Abre el URP Asset y en **Renderer List** asegúrate de que aparezca el **2D Renderer**

### Activar 2D Lights

1. En tu escena, agrega: `GameObject → Light → 2D → Point Light 2D`
2. El Sprite Renderer de tu personaje usará el material **Sprite-Lit-Default**
   (incluido con URP 2D) para recibir la luz.

## 4. Configurar Input System (1 vez)

1. **Edit → Project Settings → Player → Other Settings → Active Input Handling**
2. Elige **Input System Package (New)** o **Both**
3. (Recomendado) deja **Both** durante el desarrollo para no romper el editor

## 5. Crear la primera escena de combate

```
GameObject → 2D Object → Sprites → Square    ← escenario
GameObject → 2D Object → Sprites → Square    ← suelo
GameObject → Create Empty    → "BattleManager"   ← adjunta BattleManager.cs
GameObject → Create Empty    → "Player1"     ← adjunta FighterController.cs
GameObject → Create Empty    → "Player2"     ← adjunta FighterController.cs
GameObject → 2D Object → Sprites → Square    ← joystick
```

**Orden de capas sugerido (Sorting Layers):**

```
1. Background
2. Stage
3. Shadow
4. Fighters
5. HitFX
6. UI
```

## 6. Crear ScriptableObjects base

Antes de jugar necesitas al menos 1 `FighterData`, 1 `MoveData` y 1 `ComboData`.

### FighterData (Assets → Right Click → Create → NarutoClash → Fighter Data)

```
Nombre: Naruto
Max Health: 1000
Max Chakra: 100
Walk Speed: 3.5
Jump Force: 12
Crouch Speed: 1.0
Substitution Charges: 3
Awakening Required: 100
Moveset: [Mover carpeta con MoveData assets]
Combos: [Mover carpeta con ComboData assets]
```

### MoveData (Create → NarutoClash → Move Data)

```
Nombre: LightPunch
Startup Frames: 4
Active Frames: 3
Recovery Frames: 6
Damage: 30
Hitstun: 14
Blockstun: 8
Pushback: 1.5
Hits High / Mid / Low:  Mid
Chakra Cost: 0
Special: false
```

`HitboxFrames` (lista de frames activos): cada frame tiene offset + tamaño
relativo a la posición del fighter.

## 7. Crear prefab de luchador

Estructura recomendada:

```
Naruto (root)
├── Body                          ← SpriteRenderer + BoxCollider2D + FighterController
│   ├── Hurtbox_High              ← BoxCollider2D (trigger) + Hurtbox.cs [High]
│   ├── Hurtbox_Mid               ← BoxCollider2D (trigger) + Hurtbox.cs [Mid]
│   ├── Hurtbox_Low               ← BoxCollider2D (trigger) + Hurtbox.cs [Low]
│   └── Hitbox_Origin             ← Transform (sin collider, solo punto de spawn)
│       ├── Hitbox_Punch          ← BoxCollider2D (trigger) + Hitbox.cs
│       ├── Hitbox_Kick           ← BoxCollider2D (trigger) + Hitbox.cs
│       └── Hitbox_Rasengan       ← BoxCollider2D (trigger) + Hitbox.cs
└── VFX_Anchor                    ← empty, punto de spawn de VFX
```

## 8. Asignar componentes en el prefab

En el `FighterController`:

```
Stats → Data:        [FighterData asset]
Stats → Health:      1000
Stats → Chakra:      0
Facing Direction:    1 (derecha)
Opponent:            [arrastrar el otro fighter]
Components → Animator: [Animator component]
Input → MobileInputManager: [arrastrar el manager de la escena]
Resources → ChakraSystem: [auto-asignado o nuevo]
Resources → SubstitutionSystem: [auto-asignado]
Resources → AwakeningSystem: [auto-asignado]
```

## 9. Configurar la UI móvil

1. Crea un Canvas (Screen Space - Overlay)
2. Agrega el script `MobileHUD.cs` al Canvas
3. El script instancia automáticamente:
   - Virtual Joystick (esquina inferior izquierda)
   - 4 botones de acción (esquina inferior derecha)
   - Botón de Despertar (esquina superior derecha)
   - 2 barras de vida + 2 barras de chakra + 2 contadores de sustitución
4. Ajusta escalas/posiciones en el Inspector del MobileHUD

## 10. Build para móvil

### Android

1. **File → Build Settings → Android → Switch Platform**
2. **Player Settings → Other Settings:**
   - Package Name: `com.tuusuario.narutoclash`
   - Minimum API Level: 24 (Android 7.0)
   - Target API Level: 33+
3. **Player Settings → Publishing Settings:**
   - Custom Keystore: crea uno para release
4. **Player Settings → Configuration → Scripting Backend:** IL2CPP
5. **Texture Compression:** ASTC (recomendado) o ETC2
6. Click **Build** → genera `.apk` / `.aab`

### iOS

1. **File → Build Settings → iOS → Switch Platform**
2. Necesitas una Mac con Xcode para el build final (.ipa)
3. **Player Settings → Other Settings:**
   - Bundle Identifier: `com.tuusuario.narutoclash`
   - Target iOS: 14.0+
   - Architecture: ARM64
4. **Configuration → Scripting Backend:** IL2CPP
5. Click **Build** → genera el proyecto Xcode

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| "URP not found" | Verifica que `com.unity.render-pipelines.universal` esté en `manifest.json` |
| "VFX Graph asset is broken" | Re-importa el asset, comprueba versión de VFX Graph |
| "Player se cae al infinito" | Agrega un suelo (BoxCollider2D no-trigger) en la escena |
| "No se ven los sprites" | SpriteRenderer.sortingLayer = "Fighters", order = 0 |
| "Botones no responden" | Canvas con GraphicRaycaster, EventSystem en la escena |
| "Chidori no se ve" | Verifica que el material del sprite use el shader URP/2D/Sprite-Lit-Default |
| "IA no se mueve" | Asigna el AIController a Player2, configura `opponent` en ambos |
| "Build falla en iOS" | Revisa que el NDK/JDK de Android no esté siendo invocado |

---

## Performance checklist

- [ ] Sprites importados con **Compression: None** o **ASTC 6x6** en móvil
- [ ] **Filter Mode: Point (no filter)** en los sprites pixel art
- [ ] **Pixels Per Unit: 16** o **32** en la importación
- [ ] Sprite Atlas creado con todos los sprites de cada luchador
- [ ] VFX Graph instances con **Capacity** limitado (evita GC)
- [ ] Audio en formato **.ogg** o **.wav** con **Load Type: Streaming** para música
- [ ] **Application.targetFrameRate = 60** en el GameManager
- [ ] **Quality Settings.vSyncCount = 0** (deja targetFrameRate mandar)
- [ ] Todos los Rigidbody2D con **Body Type: Kinematic** para fighters (controlamos nosotros)
- [ ] Hitboxes se destruyen o desactivan tras el frame activo (evita doble hit)
