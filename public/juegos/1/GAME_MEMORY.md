# 🎮 NEON BLASTER - MEMORIA EVOLUTIVA

> **Documento vivo de conocimiento del juego. Se actualiza con cada versión.**
> 
> Última actualización: v3.0 | Fecha: 20/06/2026

---

## 1. IDENTIDAD DEL JUEGO

### 1.1 Información General

| Campo | Valor |
|-------|-------|
| **Nombre** | Neon Blaster |
| **Versión actual** | v3.0 |
| **Tipo** | Shooter 2D plataformas |
| **Engine** | HTML5 Canvas + Vanilla JavaScript |
| **Stack técnico** | HTML, CSS, JavaScript (sin dependencias externas) |
| **Plataforma** | Web (PC y móvil) |
| **Dominio de lanzamiento** | yapido.click/juegos/1 |

### 1.2 Pitch del Juego

> **"Un shooter 2D de oleadas con estética neón donde personalizas cada sprite, desbloqueas skins y enfrentas bosses cada 5 niveles."**

### 1.3 Objetivo Principal

**Sobrevive las oleadas de enemigos, derrota bosses cada 5 niveles, acumula puntos y monedas para desbloquear skins en la tienda.**

### 1.4 Objetivos Secundarios

1. **Competir** - Superar tu puntuación más alta en el leaderboard
2. **Coleccionar** - Desbloquear las 7 skins disponibles
3. **Personalizar** - Editar sprites y propiedades de personajes en el editor integrado
4. **Progresar** - Alcanzar niveles más altos con dificultad creciente

### 1.5 Meta a Largo Plazo

> Convertirse en un juego viral con tabla de puntuaciones global, sistema de ranked, y eventos especiales por temporadas.

---

## 2. MECÁNICAS DE JUEGO

### 2.1 Controles

| Input PC | Input Móvil | Acción |
|----------|-------------|--------|
| ← → | Touch zones | Mover horizontalmente |
| ↑ | Touch Jump | Saltar |
| ESPACIO | Touch Shoot | Disparar |
| TAB | - | Abrir/cerrar editor |
| ESC | - | Pausar juego |

### 2.2 Sistema de Físicas

- **Gravedad**: 0.6 (aplicada cada frame)
- **Velocidad salto**: -14 (fuerza inicial)
- **Velocidad movimiento**: configurable por sprite (default 5)
- ** fricción**: 0.8 (multiplicador al soltar teclas)

### 2.3 Sistema de Combates

- ** Disparos del jugador**: cadencia configurable, dirección según facing
- ** Enemigos disparan**: solo tipo Shooter y Boss
- ** Collision detection**: AABB (Axis-Aligned Bounding Box)
- ** Invincibility frames**: 60 frames (~1 segundo) después de recibir daño

### 2.4 Sistema de Puntuación

```
Puntos por enemigo × Multiplicador de combo
```

- **Combo**: Se incrementa al matar enemigos consecutivos sin recibir daño
- **Multiplicador**: Min 1x, Max 10x (según combo)
- **Combo timer**: 120 frames (~2 segundos) sin matar resetea

### 2.5 Sistema de Monedas

- ** Enemigos comunes**: 5 monedas
- ** Power-ups**: 10 monedas
- ** Completar nivel bonus**: nivel × 50 monedas

---

## 3. TIPOS DE ENTIDADES

### 3.1 Jugador (Player)

| Propiedad | Valor default |
|-----------|---------------|
| Width | 40px |
| Height | 50px |
| Velocidad | 5 |
| Vida | 3 |
| Cadencia disparo | 12 frames |
| Color base | #00ff88 |
| Sprite | Figura humanoide neón |

### 3.2 Enemigos

| Tipo | Ancho | Alto | Velocidad | Vida | Puntos | Comportamiento |
|------|-------|------|------------|------|--------|----------------|
| Walker | 35 | 45 | 1.5 | 2 | 100 | Camina, a veces salta |
| Flyer | 40 | 30 | 2 | 1 | 150 | Vuela en patrón senoidal |
| Shooter | 30 | 50 | 0.8 | 3 | 200 | Dispara cada 90 frames |

### 3.3 Boss

| Propiedad | Valor |
|-----------|-------|
| Ancho | 120px |
| Alto | 100px |
| Velocidad | 0.5 |
| Vida base | 50 (× nivel) |
| Puntos | 5000 (× nivel) |
| Comportamiento | patrulla vertical, triple disparo |

### 3.4 Proyectiles

| Tipo | Velocidad | Daño |
|------|------------|------|
| Bullet (jugador) | 12 | 1 (resta vida enemigo) |
| EnemyBullet | 5 | 1 (resta vida jugador) |

### 3.5 Power-ups

| Tipo | Efecto |
|------|--------|
| Health | +1 vida al jugador (si no está full) |
| Speed | Efecto visual de partículas |

### 3.6 Collectibles

| Tipo | Valor |
|------|-------|
| Coin | 5 monedas al recoger |

---

## 4. SISTEMA DE SKINS

### 4.1 Skins Disponibles

| ID | Nombre | Color | Precio | Estado |
|----|--------|-------|--------|--------|
| default | Neón Verde | #00ff88 | 0 (gratis) | OWNED |
| cyan | Cyan Clásico | #00ffff | 500 | purchasable |
| purple | Púrpura | #c792ea | 500 | purchasable |
| red | Rojo Fuego | #ff4444 | 750 | purchasable |
| gold | Oro | #ffd700 | 1000 | purchasable |
| rainbow | Arcoíris | animated | 2000 | purchasable |
| ghost | Fantasma | #ffffff80 | 1500 | purchasable |

---

## 5. PLAN DE NIVELES

### 5.1 Estructura de 10 Niveles Base

| Nivel | Enemigos | Multiplicador Velocidad | Spawn Rate | Tipos Enemigos | Boss |
|-------|----------|-------------------------|------------|----------------|------|
| 1 | 10 | 1.0x | 60 | walker | No |
| 2 | 15 | 1.1x | 55 | walker, walker | No |
| 3 | 20 | 1.2x | 50 | walker, flyer | No |
| 4 | 25 | 1.3x | 45 | walker, flyer, flyer | No |
| 5 | 1 | 1.5x | 120 | boss | **SÍ** |
| 6 | 25 | 1.4x | 40 | walker, flyer, shooter | No |
| 7 | 30 | 1.5x | 35 | flyer, shooter | No |
| 8 | 35 | 1.6x | 30 | shooter, shooter, flyer | No |
| 9 | 40 | 1.7x | 25 | walker, shooter | No |
| 10 | 1 | 2.0x | 180 | boss | **SÍ** |

### 5.2 Ciclo de Niveles

- Al completar nivel 10, vuelve a nivel 1 con stats multiplicados
- Cada ciclo aumenta la dificultad base (vida y velocidad de enemigos +10%)

---

## 6. SISTEMA DE AUDIO

### 6.1 Sonidos Implementados

| Sonido | Tipo | Trigger |
|--------|------|---------|
| shoot | square 800Hz 50ms | Al disparar |
| jump | sine 400Hz 100ms | Al saltar |
| hit | sawtooth 200Hz 100ms | Al dañar enemigo |
| explosion | sawtooth 150Hz+100Hz | Al morir enemigo |
| coin | sine 880Hz+1100Hz | Al recoger moneda |
| powerup | sine 440Hz+660Hz+880Hz | Al recoger power-up |
| levelUp | sine 523Hz+659Hz+784Hz+1047Hz | Al completar nivel |
| gameOver | sawtooth 400Hz+300Hz+200Hz | Al morir |

---

## 7. SISTEMA DE PERSISTENCIA

### 7.1 localStorage Keys

| Key | Contenido |
|-----|-----------|
| `neonBlaster_v2` | Progress (coins, kills, highScore, skins, selectedSkin) |
| `neonBlasterScores` | Array top 10 scores para leaderboard |
| `gameCreatorConfig` | Configuración de sprites editados |

---

## 8. EDITOR INTEGRADO

### 8.1 Funcionalidades

- **Selector de sprite**: 9 tipos editables (player, walker, flyer, shooter, boss, bullet, powerups)
- **Pixel grid**: Dibujar pixel art directamente en el navegador
- **Paleta de colores**: 7 colores predefinidos + Shift+clic para borrar
- **Panel de propiedades**: Ancho, alto, velocidad, vida, puntos, cadencia, color
- **Persistencia**: Cambios se guardan en localStorage automáticamente

### 8.2 Sprites Editables

1. Player (jugador principal)
2. Walker (enemigo terrestre)
3. Flyer (enemigo volador)
4. Shooter (enemigo que dispara)
5. Boss (jefe)
6. Bullet (disparo)
7. Power-up Health
8. Power-up Speed
9. Coin

---

## 9. HISTORIAL DE VERSIONES

### v1.0 - Prototipo Inicial
**Fecha**: 20/06/2026
- Juego básico shooter 2D
- 3 tipos de enemigos (walker, flyer, shooter)
- Sistema de oleadas infinito
- Editor de sprites básico
- Controles de teclado

### v2.0 - Game Creator Profesional (ARCHIVED)
**Fecha**: 20/06/2026
- Sistema de 10 niveles con bosses cada 5
- Tienda de 7 skins comprables
- Leaderboard con top 10
- Sistema de combos y multiplicadores
- Monedas y collectibles
- Sonidos procedurales
- Controles táctiles para móvil
- Progreso guardado en localStorage
- Sistema de guardado de proyectos

### v3.0 - Advanced Pixel Editor ⬅️ ACTUAL
**Fecha**: 20/06/2026
- **Grid de 64x64 píxeles** para sprites detallados
- **Sistema de escalado 1x-100x** para preview
- **Subida de imágenes** que se convierten automáticamente a pixel art
- **Detección inteligente**: recorta espacios para sprites, mantiene todo para fondos
- **Preview en tiempo real** del sprite escalado
- **Herramientas de edición**: voltear H/V, rotar, rellenar
- **Stats actualizados**: muestra dimensiones, píxeles, escala automáticamente
- **Paleta de colores expandida** con selector de color custom

---

## 10. PLAN DE EVOLUCIÓN

### Fase 3: Experiencias (Mes 1-2)

#### 10.1 Niveles y Contenido
- [ ] **15-20 niveles temáticos** con obstáculos únicos
- [ ] **3-5 bosses con patrones** más elaborados
- [ ] **Nivel especial diario** (desafío con recompensas extras)
- [ ] **Editor de niveles** (crear y compartir niveles)

#### 10.2 Personajes
- [ ] **Personajes jugables** (5-7可选) con stats únicos
- [ ] **Habilidades especiales** por personaje
- [ ] **Animaciones de muerte**, victoria, idle
- [ ] **Sprites de orientación** (izquierda/derecha arriba/abajo)

#### 10.3 Monetización
- [ ] **Anuncios** (rewarded video para continuar)
- [ ] **Battle Pass** mensual ($4.99 USD)
- [ ] **Skins premium** ($1-3 USD cada una)

#### 10.4 Multijugador
- [ ] **Tabla de scores global** con backend Firebase
- [ ] **Eventos competitivos** semanales
- [ ] **Challenges** entre amigos
- [ ] **Modo 2 jugadores** local

---

### Fase 4: Expansión Global (Mes 3-4)

#### 10.5 Localización
- [ ] **Español** (ya tiene)
- [ ] **Inglés**
- [ ] **Portugués**
- [ ] **Soporte RTL** (árabe, hebreo)

#### 10.6 Estaciones y Eventos
- [ ] **Evento Halloween** (enemigos especiales, skins)
- [ ] **Evento Navidad** (escenario nevado)
- [ ] **Evento San Valentín**
- [ ] **Temporada 1** completa con recompensa

#### 10.7 Comunidad
- [ ] **Discord** integrado
- [ ] **Torneos** automáticos por puntuación
- [ ] **Creador de contenido** program (afiliados)

---

### Fase 5: Plataforma (Mes 5-6)

#### 10.8 Apps Nativas
- [ ] **Compilar a APK** con Capacitor
- [ ] **App Store** (iOS)
- [ ] **Google Play** (Android)
- [ ] **PWA** instalable

#### 10.9 Backend
- [ ] **Firebase Auth** (login social)
- [ ] **Cloud Firestore** (scores, progreso en la nube)
- [ ] **Cloud Functions** (rankeds automáticos)
- [ ] **Analytics** para métricas

#### 10.10 Monetización Avanzada
- [ ] **Subscribción** $2.99/mes (benefits exclusivos)
- [ ] **Mercado de trading** de skins
- [ ] **Loot boxes** (cosméticas)

---

## 11. LISTA DE MEJORAS POSIBLES

### 11.1 Gameplay
- [ ] Modo supervivencia (oleadas infinitas)
- [ ] Modo historia (narrativa entre niveles)
- [ ] Boss rush mode
- [ ] Speedrun mode
- [ ] Customización de controles
- [ ] Dificultad selectable (easy/normal/hard)

### 11.2 Enemigos
- [ ] Enemigos voladores en patrón circular
- [ ] Enemigos que Esquivan balas
- [ ] Enemigos con escudo
- [ ] Enemigos que spawnean minions
- [ ] Minibosses

### 11.3 Power-ups
- [ ] Escudo temporal
- [ ] Disparo triple
- [ ] Inmunidad temporal
- [ ] Velocidad boost
- [ ] Cambiar de lugar con enemigo
- [ ] Bomba de area

### 11.4 Personajes
- [ ] Mago (dispara proyectiles mágicos)
- [ ] Tanque (lento pero mucha vida)
- [ ] Velocista (rápido, poca vida)
- [ ] Doble salto
- [ ] Dash

### 11.5 Escenarios
- [ ] Fondo parallax animado
- [ ] Obstáculos destructibles
- [ ] Plataformas móviles
- [ ] Agua (zonas que dañan)
- [ ] Hielo (zonas resbalosas)
- [ ] Gravedad invertida

### 11.6 Visual Effects
- [ ] Screen shake en explosiones
- [ ] Flash de color al recibir daño
- [ ] Trail de particles detrás de balas
- [ ] Bloom effect
- [ ] Partículas de fondo ambiente
- [ ] Animación de fondo parallax

### 11.7 Audio
- [ ] Música ambiente por nivel
- [ ] Música épica para bosses
- [ ] Efectos de sonido por tipo de enemigo
- [ ] Voice acting
- [ ] Sistema de chat de audio en multiplayer

### 11.8 UI/UX
- [ ] Tutorial interactivo
- [ ] Logro toast notifications
- [ ] Inventory visual
- [ ] Map screen
- [ ] Settings completos (volumen,亮度, etc)
- [ ] Quick restart
- [ ] Replay de la última partida

### 11.9 Técnico
- [ ] Sprite sheets para mejor performance
- [ ] WebGL para efectos avanzados
- [ ] Web Workers para physics
- [ ] Preloading de assets
- [ ] Compresión de sprites
- [ ] Offline-first PWA
- [ ] Service Worker para cache

---

## 12. METRICAS Y KPIs

### 12.1 Métricas de Negocio
- **DAU** (Daily Active Users): Objetivo 1000/ día
- **MAU** (Monthly Active Users): Objetivo 10,000/ mes
- **Retention D1**: >40%
- **Retention D7**: >20%
- **Retention D30**: >10%
- **LTV** (Lifetime Value): $2-5 USD
- **ARPU**: $0.50-1 USD

### 12.2 Métricas de Producto
- **Avg. Session Length**: >5 minutos
- **Sessions per User**: >3/ día
- **Levels Completed**: >10 promedio
- **Time to First Purchase**: <7 días
- **Conversion Rate**: >2%

---

## 13. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Abandono por dificultad | Media | Alto | Tutorial, dificultad progresiva, modo fácil |
| Baja retención | Alta | Alto | Eventos frecuentes, nuevos contenidos |
| Competencia | Alta | Medio | Diferenciarse con editor y personalización |
| Problemas técnicos móvil | Media | Medio | Testing exhaustivo, Capacitor actualizado |
| Cambios en browsers | Baja | Medio | Polyfills, testing cross-browser |

---

## 14. ROADMAP PRIORIZADO

### Q3 2026 - MVP Completo
1. Bugs fixing v2.0
2. 5 niveles adicionales
3. 3 bosses con patrones únicos
4. Tutorial interactivo
5. Logros system

### Q4 2026 - Engagement
1. Sistema de eventos
2. Leaderboard global Firebase
3. 2 personajes jugables adicionales
4. Editor de niveles
5. Sistema de clans

### Q1 2027 - Monetización
1. Battle Pass Temporada 1
2. Compilation a APK/iOS
3. Anuncios rewarded
4. Skins premium

### Q2 2027 - Scale
1. PWA instalable
2. Discord integration
3. Torneos automáticos
4. Affiliate program

---

## 15. NOTAS DE DISEÑO

### Filosofía de Diseño
- **"Fácil de aprender, difícil de dominar"**
- Controles intuitivos que se sienten bien
- Feedback visual y auditivo inmediato
- Progreso siempre visible y recompensado
- No pay-to-win, solo cosmetics

### Restricciones autoimpuestas
- No dependencias externas (todo vanilla JS)
- Carga instantánea (sin preloaders)
- Funciona offline (excepto multiplayer)
- Mobile-first en controles
- Accesibilidad (color blind-friendly palettes)

---

## 16. ESTRUCTURA DE ARCHIVOS

```
juegos/1/
├── index.html              # Entry point (v3.0 actual)
├── css/
│   └── main.css           # Estilos
├── js/
│   ├── game.js            # Código principal del juego
│   └── editor/
│       └── PixelEditor.js # Editor avanzado de pixel art
├── GAME_MEMORY.md          # Este documento
└── history/
    ├── v1.0/              # Prototipo inicial
    ├── v2.0_archive/      # Game Creator Profesional
    └── v3.0/              # Advanced Pixel Editor
```

---

## 17. GUÍA DEL EDITOR v3.0

### 17.1 Panel "Dibujar"
- **Grid 64x64**: Lienzo de alta resolución para sprites detallados
- **Zoom 1x-100x**: Control deslizante para ver detalles o 전체
- **Preview**: Vista en tiempo real del sprite escalado
- **Upload**: Arrastra o selecciona imagen → se convierte a pixel art automáticamente

### 17.2 Modos de Upload
- **Sprite (recorta espacios)**: Detecta el contenido y recorta transparencia
- **Fondo (completo)**: Mantiene toda la imagen para fondos de nivel

### 17.3 Herramientas
- **Limpiar**: Borra todo el lienzo
- **Voltear H/V**: Espejo horizontal/vertical
- **Rotar**: 90° en sentido horario
- **Rellenar**: Rellena áreas vacías con color actual

### 17.4 Detección Automática
- Analiza la imagen subida
- Cuantiza colores a paleta neón
- Detecta bordes del sprite
- Recorta espacios transparents automáticamente

---

*Documento actualizado automáticamente con cada versión*
*Para actualizar: agregar versión en historial, marcar completados, agregar nuevos features*