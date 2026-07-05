# Historial de Versiones - Neon Blaster

## v1.0 - Prototipo Inicial (20/06/2026)

### Características implementadas:
- Shooter 2D con Canvas
- 3 tipos de enemigos: Walker, Flyer, Shooter
- Sistema de oleadas infinitas
- Editor de sprites básico con grid de pixels
- Controles de teclado (←→↑ ESPACIO)
- Sistema de puntuación
- 3 corazones de vida

### Archivos en esta carpeta:
- `index.html` - Punto de entrada v1.0
- `js/game.js` - Código principal

### Lecciones aprendidas:
- El editor de sprites funciona bien pero necesita mejorar UX
- Sistema de oleadas infinitas no retiene jugadores
- Necesita sistema de progreso y metas

---

## v2.0 - Game Creator Profesional (20/06/2026)

### Características implementadas:
- Sistema de 10 niveles con dificultad progresiva
- Bosses cada 5 niveles (con barra de vida, triple disparo)
- Tienda de 7 skins comprables con monedas
- Leaderboard con top 10 puntuaciones locales
- Sistema de combos (multiplicador hasta 10x)
- Monedas y collectibles
- Sistema de audio procedural
- Controles táctiles para móvil
- Progreso guardado en localStorage
- Sistema de editor completo con propiedades

### Archivos en esta carpeta:
- `index.html` - Punto de entrada v2.0
- `css/main.css` - Estilos completos
- `js/game.js` - Código unificado (~1500 líneas)

### Mejoras sobre v1.0:
- Progressión clara con niveles
- Monetización implícita con tienda
- Retención mejorada con cosmetics
- Sonido aumenta feedback
- Móvil support expande audiencia

### Lecciones para v3.0:
- Necesita más contenido (más niveles, más skins)
- El editor está funcional pero puede ser más intuitivo
- La dificultad de bosses es okay pero predecible
- Sistema de guardado funciona bien

---

## Para crear nueva versión (v3.0):

1. Copiar archivos actuales a `history/v2.0/`
2. Renombrar la versión actual en GAME_MEMORY.md
3. Implementar features de la lista de mejoras
4. Actualizar GAME_MEMORY.md con nuevos cambios
5. Crear commit/tag de la nueva versión

---

## Estructura de carpetas:

```
juegos/1/
├── (archivos actuales - siempre la última versión)
├── history/
│   ├── v1.0/
│   │   ├── index.html
│   │   └── js/game.js
│   └── v2.0/
│       ├── index.html
│       ├── css/main.css
│       └── js/game.js
└── GAME_MEMORY.md (este archivo)
```

---

*Este archivo se actualiza con cada nueva versión archivada*