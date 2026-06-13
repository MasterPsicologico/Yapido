# Character Roster — Naruto vs Sasuke (Ejemplo Inicial)

> El pedido original pide Naruto (Modo Sabio / Kurama) y Sasuke (Mangekyo
> Sharingan) como roster base. Aquí está el moveset completo que debes
> crear como `MoveData` ScriptableObjects en `Assets/Moves/`.

---

## Naruto (Modo Sabio)

| Move | Input | Command | Startup | Active | Recovery | Daño | Chakra |
|------|-------|---------|--------:|-------:|---------:|-----:|-------:|
| Light Punch | Tap A | LightPunch | 4 | 3 | 6 | 30 | 0 |
| Heavy Punch | Tap B | HeavyPunch | 8 | 4 | 12 | 60 | 0 |
| Crouch Punch | ↓ + A | LightPunch_Crouch | 5 | 3 | 8 | 35 | 0 |
| Aerial Kick | A (en aire) | LightPunch_Air | 6 | 4 | 10 | 40 | 0 |
| Kunai | ↓ ↘ → + A | QCF_Light | 12 | - | 24 | 50 | 15 |
| Rasengan | ↓ ↘ → + B | QCF_Heavy | 18 | 3 | 30 | 120 | 35 |
| Odama Rasengan | → ↓ ↘ + A | DP_Light | 22 | 4 | 36 | **220** | 50 |
| Shadow Clones | → ↘ ↓ ↙ ← + B | HCB_Heavy | 16 | 8 | 30 | 90 | 40 |
| **Sage: Frog Kata** | (despertar) | Awakening | 30 | 12 | 50 | **350** | 100 |

**Mecánica única (Modo Sabio):** Mientras está en `Awakening`, Naruto tiene
acceso a:
- Daño x1.3
- Velocidad de movimiento x1.2
- Inmunidad a hitstop
- 2 saltos extra (`maxJumps = 3` total)
- Acceso a Frog Kata (AOE frontal)

## Sasuke (Mangekyo Sharingan)

| Move | Input | Command | Startup | Active | Recovery | Daño | Chakra |
|------|-------|---------|--------:|-------:|---------:|-----:|-------:|
| Light Sword Slash | Tap A | LightPunch | 5 | 3 | 7 | 35 | 0 |
| Heavy Sword Combo | Tap B | HeavyPunch | 9 | 5 | 14 | 70 | 0 |
| Lion Combo | A A A | LightPunch × 3 (combo) | 4/4/6 | 3/3/4 | 6/6/12 | 35/35/60 | 0 |
| Chidori | ↓ ↘ → + B | QCF_Heavy | 16 | 4 | 28 | 110 | 30 |
| Chidori Senbon | ↓ ↘ → + A | QCF_Light | 10 | - | 20 | 45 | 15 |
| Chidori Nagashi | → ↓ ↘ + A | DP_Light | 14 | 8 | 30 | 130 | 35 |
| **Amaterasu** | → ↘ ↓ ↙ ← + B | HCB_Heavy | 24 | - | 35 | 100 + burn | 45 |
| Kirin | Carga ← 30f + → + B | ChargeBack_Heavy | 40 | 1 | 50 | **280** | 60 |
| **Susano'o Ribcage** | (despertar) | Awakening | 35 | 20 | 60 | **360** | 100 |

**Mecánica única (Mangekyo):**
- Eye glow sprite (overlay con `SpriteRenderer` separado) parpadea cada 4 frames
  mientras `awakeningMeter > 0`
- Amaterasu aplica un **DoT** (damage over time) de 8 daño/segundo durante 3s
- Kirin requiere **carga** (mantener ← 30 frames) — un command diferente al QCF
- En Awakening, la katana tiene hitbox extendida (+30%)

---

## Crear los MoveData en el Editor

Por cada fila de la tabla anterior:

1. `Right click en Assets/Moves/Naruto/` → Create → NarutoClash → Move Data
2. Nombra el asset con el `moveId` (snake_case): `light_punch.asset`, `rasengan.asset`
3. Configura los campos del Inspector según la tabla
4. En `Hitbox Frames`, agrega los frames activos con offset y tamaño:

```
Ejemplo: light_punch
  HitboxFrame { frameIndex = 0, localOffset = (0.8, 0.8), size = (0.6, 0.4) }
```

5. Asigna el `vfxOnActivation` (prefab de VFX Graph) si tienes
6. Asigna el `animationTrigger` correspondiente (ver SPRITE_GUIDE.md)

---

## Crear los ComboData

Ejemplo: `naruto_basic_3hit.asset`

```
ComboData {
  comboId: "naruto_basic_3hit"
  displayName: "Basic 3-Hit"
  sequence: [light_punch, light_punch, heavy_punch]
  hitWindowFrames: [8, 8, 14]   // cancelar 8 frames después del hit
  blockWindowFrames: [4, 4, 0]  // cancelar 4 frames después del block
  totalChakraCost: 0
}
```

Cuando el jugador presiona A A B, el sistema:
1. Ejecuta `light_punch` (P1 en estado Attacking)
2. En la ventana de cancel, lee el siguiente A → cancel a otro `light_punch`
3. Tras conectar, lee la B → cancel a `heavy_punch`
4. Si un move falla (el rival esquiva), se rompe el combo

---

## IA — Personalidad de los bots

| Parámetro | Naruto (agresivo) | Sasuke (técnico) |
|-----------|-------------------|------------------|
| `aiBlockChance` | 0.4 (esquiva más) | 0.65 (defensivo) |
| `aiAggression` | 0.85 | 0.55 |
| `aiRangedChance` | 0.5 (usa kunais) | 0.3 (prefiere melee) |
| `aiComboChance` | 0.6 (combos rápidos) | 0.45 (espera la apertura) |
| `aiSubstitutionChance` | 0.7 (esquiva mucho) | 0.5 |
| `aiReactionTime` | 0.10s (rápido) | 0.18s (más lento pero castiga) |

---

## Stage sugerido: Valle del Fin

Un stage clásico del final de Naruto vs Sasuke en el Valle del Fin. Tamaño:
- Ancho útil: 24 unidades
- Suelo: a y = 0
- Pared izquierda: x = -12
- Pared derecha: x = 12
- Cámara: zoom 5-9, sigue punto medio

Background parallax:
- Capa 1 (más lejana): montañas al 20% scroll
- Capa 2: agua/cascada al 40% scroll
- Capa 3 (más cercana): árboles al 70% scroll

BGM sugerido: "Naruto Main Theme" o instrumental orquestal libre de copyright.
