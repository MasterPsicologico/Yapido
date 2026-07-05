import { GlobalEngineRegistry, GameEntity } from './registry';

export class CommandInterpreter {
    private static validPlayerProperties = ['x', 'y', 'vx', 'vy', 'width', 'height', 'hp', 'maxHp', 'damage', 'speed', 'color', 'fireRate', 'shape', 'scoreValue'];
    private static validEnemyProperties = ['x', 'y', 'vx', 'vy', 'width', 'height', 'hp', 'maxHp', 'damage', 'speed', 'color', 'fireRate', 'shape', 'scoreValue', 'active'];
    private static validConfigProperties = ['globalGravity', 'score', 'currentLevel', 'timeScale', 'paused'];

    public static execute(targetCategory: string, commandString: string): string {
        const cleanCommand = commandString.trim().toLowerCase();
        
        const regex = /^([a-zA-Z0-9_]+)\s*=\s*(.+)$/;
        const match = cleanCommand.match(regex);

        if (!match) {
            return "Error: Sintaxis inválida. Usa: propiedad = valor";
        }

        const [_, property, valueStr] = match;
        const propertyLower = property.toLowerCase();
        
        const parsedValue = this.parseValue(valueStr.trim());

        switch (targetCategory) {
            case "Jugador":
                return this.executeOnPlayer(propertyLower, parsedValue);
            case "Todos los Enemigos":
                return this.executeOnAllEnemies(propertyLower, parsedValue);
            case "Configuración General":
                return this.executeOnConfig(propertyLower, parsedValue);
            case "Enemigo Específico":
                return this.executeOnSelectedEnemy(propertyLower, parsedValue);
        }

        return "Error: Categoría no válida.";
    }

    private static parseValue(valueStr: string): number | string | boolean {
        if (valueStr === 'true') return true;
        if (valueStr === 'false') return false;
        if (valueStr === 'null') return null as any;
        
        const num = Number(valueStr);
        if (!isNaN(num) && valueStr.replace(/[.\-]/g, '') !== '') {
            return num;
        }
        
        if ((valueStr.startsWith("'") && valueStr.endsWith("'")) ||
            (valueStr.startsWith('"') && valueStr.endsWith('"'))) {
            return valueStr.slice(1, -1);
        }
        
        return valueStr;
    }

    private static executeOnPlayer(property: string, value: number | string | boolean | null): string {
        if (!GlobalEngineRegistry.player) {
            return "Error: No hay jugador en el juego.";
        }

        if (!this.validPlayerProperties.includes(property)) {
            return `Error: Propiedad '${property}' no existe en Jugador.`;
        }

        (GlobalEngineRegistry.player as any)[property] = value;
        
        if (property === 'shape') {
            return `Éxito: Forma del Jugador cambiada a: ${value}`;
        }
        if (property === 'color') {
            return `Éxito: Color del Jugador cambiado a ${value}`;
        }
        if (property === 'speed') {
            return `Éxito: Velocidad del Jugador cambiada a ${value}`;
        }
        if (property === 'hp' || property === 'maxHp') {
            return `Éxito: ${property} del Jugador cambiado a ${value}`;
        }
        if (property === 'fireRate') {
            return `Éxito: Cadencia de disparo cambiada a ${value}ms`;
        }
        if (property === 'damage') {
            return `Éxito: Daño del Jugador cambiado a ${value}`;
        }
        
        return `Éxito: Propiedad '${property}' del Jugador cambiada a ${value}`;
    }

    private static executeOnAllEnemies(property: string, value: number | string | boolean | null): string {
        if (GlobalEngineRegistry.enemies.length === 0) {
            return "No hay enemigos activos para modificar.";
        }

        if (!this.validEnemyProperties.includes(property)) {
            return `Error: Propiedad '${property}' no existe en enemigos.`;
        }

        let modified = 0;
        GlobalEngineRegistry.enemies.forEach(enemy => {
            if (property in enemy) {
                (enemy as any)[property] = value;
                modified++;
            }
        });

        if (property === 'shape') {
            return `Éxito: Forma de ${modified} enemigos cambiada a: ${value}`;
        }
        if (property === 'color') {
            return `Éxito: Color de ${modified} enemigos cambiado a ${value}`;
        }
        if (property === 'speed') {
            return `Éxito: Velocidad de ${modified} enemigos cambiada a ${value}`;
        }
        if (property === 'hp') {
            return `Éxito: HP de ${modified} enemigos cambiado a ${value}`;
        }
        
        return `Éxito: Propiedad '${property}' modificada en ${modified} enemigos.`;
    }

    private static executeOnConfig(property: string, value: number | string | boolean | null): string {
        if (!this.validConfigProperties.includes(property)) {
            return `Error: Propiedad '${property}' no existe en Configuración.`;
        }

        (GlobalEngineRegistry.systemConfig as any)[property] = value;

        if (property === 'timeScale') {
            return `Éxito: Velocidad del juego cambiada a ${value}x`;
        }
        if (property === 'score') {
            return `Éxito: Puntuación establecida a ${value}`;
        }
        if (property === 'currentLevel') {
            return `Éxito: Nivel forzado a ${value}`;
        }
        if (property === 'paused') {
            return value ? "Juego pausado." : "Juego resumed.";
        }
        
        return `Éxito: Configuración '${property}' cambiada a ${value}`;
    }

    private static executeOnSelectedEnemy(property: string, value: number | string | boolean | null): string {
        const selectedEnemy = GlobalEngineRegistry.enemies.find(e => e.active);
        
        if (!selectedEnemy) {
            return "Error: No hay enemigos activos seleccionados.";
        }

        if (!this.validEnemyProperties.includes(property)) {
            return `Error: Propiedad '${property}' no existe.`;
        }

        (selectedEnemy as any)[property] = value;
        return `Éxito: ${property} del enemigo cambiado a ${value}`;
    }

    public static getAvailableProperties(category: string): string[] {
        switch (category) {
            case "Jugador":
                return [...this.validPlayerProperties];
            case "Todos los Enemigos":
                return [...this.validEnemyProperties];
            case "Configuración General":
                return [...this.validConfigProperties];
            default:
                return [];
        }
    }

    public static validateShape(shapeStr: string): boolean {
        const parts = shapeStr.split(' ');
        for (const part of parts) {
            const coords = part.split(',');
            if (coords.length !== 2) return false;
            if (isNaN(Number(coords[0])) || isNaN(Number(coords[1]))) return false;
        }
        return parts.length >= 3;
    }
}