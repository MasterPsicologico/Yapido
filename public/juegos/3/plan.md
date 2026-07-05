# PLAN DE INGENIERÍA: ARQUITECTURA DE VIDEOJUEGO 2D ESPACIAL DE ALTO RENDIMIENTO

Este documento establece la especificación técnica y el blueprint de código para construir un videojuego 2D Shoot 'em up con dificultad adaptativa de 20 niveles y un motor de edición en caliente integrado (Runtime Live Editor).

---

## 1. PILA TECNOLÓGICA (TECH STACK) INDUSTRIAL

Para superar las limitaciones del Canvas nativo y alcanzar un rendimiento de nivel de consola en PC, se especifica la siguiente arquitectura:

*   **Motor de Renderizado:** `PixiJS v8` (Renderizado acelerado por hardware mediante WebGL 2 y soporte nativo para WebGPU). Capaz de gestionar más de 10,000 sprites simultáneos a 60 FPS.
*   **Lenguaje de Programación:** `TypeScript 5.x` (Garantiza tipado estricto, interfaces limpias para las entidades y previene errores de mutación de datos en el editor).
*   **Entorno de Construcción y Empaquetado:** `Vite` (Para HMR - Hot Module Replacement ultra rápido durante el desarrollo).
*   **Interfaz del Editor (UI):** HTML5 / CSS3 nativo acoplado sobre el Canvas mediante posición absoluta, manejado por un puente de datos reactivo.

---

## 2. ARQUITECTURA DEL SISTEMA: ENTITY COMPONENT SYSTEM (ECS) HÍBRIDO

Para permitir que el chat de edición modifique cualquier propiedad en caliente sin romper la ejecución del lazo principal, el juego se estructurará separando estrictamente la lógica (Sistemas) de los datos (Componentes).

[ Game Loop ] ──> [ Systems (Movement, Collision, Render) ]│▼[ Entity Registry (Data Pools) ] ◄─── [ Live Editor Interprete ]

### Definición de Clases y Estructuras de Datos (Data Pools)

```typescript
// Registro global de entidades accesibles por el Editor
export interface GameEntity {
    id: string;
    type: 'player' | 'enemy_scout' | 'enemy_bomber' | 'enemy_boss' | 'projectile_player' | 'projectile_enemy';
    x: number;
    y: number;
    vx: number;
    vy: number;
    width: number;
    height: number;
    hp: number;
    maxHp: number;
    damage: number;
    speed: number;
    color: string;
    fireRate: number; // en milisegundos
    lastShot: number;
}

export const GlobalEngineRegistry = {
    player: null as GameEntity | null,
    enemies: [] as GameEntity[],
    projectiles: [] as GameEntity[],
    particles: [] as any[],
    systemConfig: {
        globalGravity: 0,
        score: 0,
        currentLevel: 1,
        timeScale: 1.0
    }
};
```

---

## 3. LOGICA DE CONECTORES Y MATEMÁTICAS DE DIFICULTAD (20 NIVELES)

El cambio de nivel se calcula mediante un disparador de eventos basado en el puntaje. La progresión de atributos de los enemigos no es lineal, sino exponencial, calculada en tiempo real mediante la siguiente ecuación de escalado:

\[\text{Multiplicador de Dificultad } (M) = 1 + \left(\frac{\text{Nivel Actual} - 1}{19}\right)^{1.5}\]

### Implementación del Conector de Dificultad (`DifficultySystem.ts`)

```typescript
export class DifficultySystem {
    public static updateDifficulty(level: number) {
        if (level > 20) return;
        
        // Curva exponencial basada en el multiplicador
        const multiplier = 1 + Math.pow((level - 1) / 19, 1.5);
        
        // Configuración de coeficientes de dificultad base
        const config = {
            spawnRate: 2000 / multiplier, // Reduce el tiempo de aparición de enemigos
            enemyMaxHp: Math.floor(10 * multiplier),
            enemySpeed: 2 * (1 + (level * 0.1)),
            enemyDamage: Math.floor(5 * multiplier)
        };
        
        return config;
    }
}
```

*   **Nivel 1 (Iniciación):** Enemigos estáticos, disparos lentos predecibles.
*   **Nivel 10 (Barrera intermedia):** Introducción de IA de evasión (algoritmo de persecución suave hacia el jugador).
*   **Nivel 20 (Victoria Absoluta):** Patrón "Bullet Hell" (infierno de balas). Frecuencia de disparo enemiga multiplicada por 400%, proyectiles con trayectorias sinusoidales.

---

## 4. SISTEMA DEL EDITOR EN TIEMPO REAL CON INTÉRPRETE SEMÁNTICO

Este es el conector que permite la edición por chat desde la interfaz del juego. Al pulsar el botón "Editar Juego", el bucle principal congela el delta de tiempo (`timeScale = 0`), pero mantiene el hilo de renderizado activo para ver los cambios visuales inmediatamente.

### El Motor de Parseo de Comandos (`CommandInterpreter.ts`)

```typescript
export class CommandInterpreter {
    public static execute(targetCategory: string, commandString: string): string {
        // Sanitizar entrada del chat del usuario
        const cleanCommand = commandString.trim().toLowerCase();
        
        // Expresión regular para capturar propiedad = valor (ej: "speed = 12.5" o "hp = 200")
        const regex = /^([a-zA-r0-9_]+)\s*=\s*([a-zA-Z0-9_#.]+)$/;
        const match = cleanCommand.match(regex);
        
        if (!match) return "Error: Sintaxis inválida. Usa: propiedad = valor";
        
        const [_, property, value] = match;
        
        // Convertir valor a tipo adecuado (número o string)
        const parsedValue = isNaN(Number(value)) ? value : Number(value);

        switch (targetCategory) {
            case "Jugador":
                if (GlobalEngineRegistry.player && property in GlobalEngineRegistry.player) {
                    (GlobalEngineRegistry.player as any)[property] = parsedValue;
                    return `Éxito: Propiedad '${property}' del Jugador cambiada a ${value}`;
                }
                break;
                
            case "Configuración General":
                if (property in GlobalEngineRegistry.systemConfig) {
                    (GlobalEngineRegistry.systemConfig as any)[property] = parsedValue;
                    return `Éxito: Configuración '${property}' cambiada a ${value}`;
                }
                break;
                
            case "Todos los Enemigos":
                GlobalEngineRegistry.enemies.forEach(enemy => {
                    if (property in enemy) {
                        (enemy as any)[property] = parsedValue;
                    }
                });
                return `Éxito: Modificados todos los enemigos activos en pantalla.`;
        }
        
        return "Error: Propiedad no encontrada en la categoría seleccionada.";
    }
}
```

---

## 5. CÓDIGO MONOLÍTICO DE ARRANQUE INMEDIATO (PROMPT DE EJECUCIÓN)

Envía este bloque final a la IA generativa para obtener el archivo ejecutable compilado:

```text
Escribe un archivo index.html completo y autocontenido. Incluye un canvas que ocupe toda la pantalla. Configura el bucle principal usando requestAnimationFrame para actualizar las físicas de las naves espaciales enemigas y del jugador mediante colisiones AABB. Añade en la esquina superior derecha un botón semitransparente con ID "btn-editor". Al hacer clic, este botón debe desplegar un panel flotante de interfaz de usuario de HTML que contenga:
1. Un elemento <select> con las opciones: "Jugador", "Todos los Enemigos", "Configuración General".
2. Un <input type="text" id="chat-command"> para ingresar comandos en vivo.
3. Un botón "Aplicar".
Implementa la lógica del intérprete JavaScript explicada en la sección 4 del PLAN.md para modificar en caliente las propiedades físicas de las instancias en el arreglo global de objetos del juego. Renderiza los objetos mediante primitivas de dibujo de Canvas de alta fidelidad (estilo vectorial neón retro). No dejes bloques vacíos ni comentarios de marcador de posición).
```