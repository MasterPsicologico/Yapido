import { EntityType } from '../engine/registry';

export interface ShipDefinition {
    type: EntityType;
    name: string;
    baseHp: number;
    baseSpeed: number;
    baseDamage: number;
    baseFireRate: number;
    baseScore: number;
    color: string;
    defaultShape: string;
    description: string;
}

export const SHIP_DEFINITIONS: Record<EntityType, ShipDefinition> = {
    player: {
        type: 'player',
        name: 'Nave Jugador',
        baseHp: 100,
        baseSpeed: 6,
        baseDamage: 20,
        baseFireRate: 250,
        baseScore: 0,
        color: '#00ffff',
        defaultShape: '0,-22 18,22 -18,22',
        description: 'Tu nave espacial. Usa WASD o Flechas para moverte y ESPACIO para disparar.'
    },
    enemy_scout: {
        type: 'enemy_scout',
        name: 'Explorador',
        baseHp: 30,
        baseSpeed: 3,
        baseDamage: 10,
        baseFireRate: 1500,
        baseScore: 100,
        color: '#ff3366',
        defaultShape: '0,18 14,-12 -14,-12',
        description: 'Nave ligera y rápida. Persigue al jugador evasivamente.'
    },
    enemy_bomber: {
        type: 'enemy_bomber',
        name: 'Bombardero',
        baseHp: 80,
        baseSpeed: 1.5,
        baseDamage: 25,
        baseFireRate: 2000,
        baseScore: 250,
        color: '#ff9900',
        defaultShape: '-22,-12 -22,12 0,24 22,12 22,-12 0,-18',
        description: 'Nave pesada con gran poder de fuego. Movimientos lentos pero letales.'
    },
    enemy_boss: {
        type: 'enemy_boss',
        name: 'Jefe Final',
        baseHp: 500,
        baseSpeed: 1,
        baseDamage: 40,
        baseFireRate: 800,
        baseScore: 2000,
        color: '#cc00ff',
        defaultShape: '-35,-18 -35,18 -12,30 12,30 35,18 35,-18 12,-30 -12,-30',
        description: 'El piloto automático de la nave nodriza.Extremadamente poderoso.'
    },
    projectile_player: {
        type: 'projectile_player',
        name: 'Disparo Jugador',
        baseHp: 1,
        baseSpeed: 12,
        baseDamage: 20,
        baseFireRate: 250,
        baseScore: 0,
        color: '#00ff88',
        defaultShape: '0,-10 5,10 -5,10',
        description: 'Proyectil disparado por el jugador.'
    },
    projectile_enemy: {
        type: 'projectile_enemy',
        name: 'Disparo Enemigo',
        baseHp: 1,
        baseSpeed: 6,
        baseDamage: 15,
        baseFireRate: 1500,
        baseScore: 0,
        color: '#ff4444',
        defaultShape: '0,8 4,-8 -4,-8',
        description: 'Proyectil disparado por enemigos.'
    }
};

export function getShipDefinition(type: EntityType): ShipDefinition {
    return SHIP_DEFINITIONS[type];
}

export const SHIP_SHAPES: Record<string, string> = {
    'fighter': '0,-20 15,20 -15,20',
    'arrow': '0,-25 8,-5 20,15 5,10 0,25 -5,10 -20,15 -8,-5',
    'dart': '0,-30 5,-10 8,-5 8,5 3,20 0,25 -3,20 -8,5 -8,-5 -5,-10',
    'wing': '-5,-20 -20,0 -10,5 -5,20 0,15 5,20 10,5 20,0 5,-20 0,-10',
    'delta': '0,-25 20,20 5,15 0,25 -5,15 -20,20',
    'diamond': '0,-25 15,0 0,25 -15,0',
    'hexagon': '-15,-10 -15,10 0,20 15,10 15,-10 0,-20',
    'star4': '0,-25 6,-8 25,-8 10,4 18,25 0,14 -18,25 -10,4 -25,-8 -6,-8',
    'triangle': '0,-20 17,15 -17,15',
    'inverted_triangle': '0,20 -17,-15 17,-15'
};

export function getShapeKeys(): string[] {
    return Object.keys(SHIP_SHAPES);
}