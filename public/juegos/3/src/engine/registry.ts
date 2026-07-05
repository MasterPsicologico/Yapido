export type EntityType = 'player' | 'enemy_scout' | 'enemy_bomber' | 'enemy_boss' | 'projectile_player' | 'projectile_enemy';

export interface GameEntity {
    id: string;
    type: EntityType;
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
    fireRate: number;
    lastShot: number;
    shape: string;
    active: boolean;
    scoreValue: number;
}

export interface SystemConfig {
    globalGravity: number;
    score: number;
    currentLevel: number;
    timeScale: number;
    paused: boolean;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

export const GlobalEngineRegistry = {
    player: null as GameEntity | null,
    enemies: [] as GameEntity[],
    projectiles: [] as GameEntity[],
    particles: [] as Particle[],
    systemConfig: {
        globalGravity: 0,
        score: 0,
        currentLevel: 1,
        timeScale: 1.0,
        paused: false
    } as SystemConfig
};

export function createEntity(type: EntityType, x: number, y: number, config?: Partial<GameEntity>): GameEntity {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const baseEntity: GameEntity = {
        id,
        type,
        x,
        y,
        vx: 0,
        vy: 0,
        width: 40,
        height: 40,
        hp: 100,
        maxHp: 100,
        damage: 10,
        speed: 5,
        color: '#00ffff',
        fireRate: 500,
        lastShot: 0,
        shape: getDefaultShape(type),
        active: true,
        scoreValue: 100
    };

    return { ...baseEntity, ...config };
}

export function getDefaultShape(type: EntityType): string {
    switch (type) {
        case 'player':
            return '0,-20 15,20 -15,20';
        case 'enemy_scout':
            return '0,20 12,-15 -12,-15';
        case 'enemy_bomber':
            return '-20,-10 -20,10 0,20 20,10 20,-10 0,-15';
        case 'enemy_boss':
            return '-30,-15 -30,15 -10,25 10,25 30,15 30,-15 10,-25 -10,-25';
        case 'projectile_player':
            return '0,-8 4,8 -4,8';
        case 'projectile_enemy':
            return '0,6 3,-6 -3,-6';
        default:
            return '0,-15 15,15 -15,15';
    }
}

export function resetRegistry(): void {
    GlobalEngineRegistry.player = null;
    GlobalEngineRegistry.enemies = [];
    GlobalEngineRegistry.projectiles = [];
    GlobalEngineRegistry.particles = [];
    GlobalEngineRegistry.systemConfig = {
        globalGravity: 0,
        score: 0,
        currentLevel: 1,
        timeScale: 1.0,
        paused: false
    };
}