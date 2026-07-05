import { GlobalEngineRegistry } from './registry';
import { SHIP_DEFINITIONS } from '../ships/definitions';

export interface DifficultyConfig {
    spawnRate: number;
    enemyMaxHp: number;
    enemySpeed: number;
    enemyDamage: number;
    enemyFireRate: number;
    bulletHellMultiplier: number;
    hasEvasionAI: boolean;
    hasSinusoidalMovement: boolean;
}

export class DifficultySystem {
    public static updateDifficulty(level: number): DifficultyConfig {
        if (level > 20) level = 20;
        if (level < 1) level = 1;

        const multiplier = 1 + Math.pow((level - 1) / 19, 1.5);

        const baseSpawnRate = 2000;
        const spawnRate = Math.max(300, baseSpawnRate / multiplier);

        const baseEnemyHp = SHIP_DEFINITIONS.enemy_scout.baseHp;
        const enemyMaxHp = Math.floor(baseEnemyHp * multiplier);

        const baseEnemySpeed = SHIP_DEFINITIONS.enemy_scout.baseSpeed;
        const enemySpeed = baseEnemySpeed * (1 + (level * 0.08));

        const baseEnemyDamage = SHIP_DEFINITIONS.enemy_scout.baseDamage;
        const enemyDamage = Math.floor(baseEnemyDamage * multiplier);

        const baseEnemyFireRate = SHIP_DEFINITIONS.enemy_scout.baseFireRate;
        const enemyFireRate = Math.max(200, baseEnemyFireRate / multiplier);

        const bulletHellMultiplier = level >= 15 ? (level - 14) * 0.5 + 1 : 1;
        const hasEvasionAI = level >= 8;
        const hasSinusoidalMovement = level >= 12;

        return {
            spawnRate,
            enemyMaxHp,
            enemySpeed,
            enemyDamage,
            enemyFireRate,
            bulletHellMultiplier,
            hasEvasionAI,
            hasSinusoidalMovement
        };
    }

    public static getLevelFromScore(score: number): number {
        const thresholds = [
            0,      // Level 1
            500,    // Level 2
            1200,   // Level 3
            2500,   // Level 4
            4500,   // Level 5
            7000,   // Level 6
            10000,  // Level 7
            14000,  // Level 8
            19000,  // Level 9
            25000,  // Level 10
            32000,  // Level 11
            40000,  // Level 12
            50000,  // Level 13
            62000,  // Level 14
            76000,  // Level 15
            92000,  // Level 16
            110000, // Level 17
            130000, // Level 18
            155000, // Level 19
            185000  // Level 20
        ];

        for (let i = thresholds.length - 1; i >= 0; i--) {
            if (score >= thresholds[i]) {
                return i + 1;
            }
        }
        return 1;
    }

    public static applyDifficultyToEnemy(enemy: any, difficulty: DifficultyConfig): void {
        if (enemy.type === 'enemy_boss') {
            enemy.hp = Math.floor(SHIP_DEFINITIONS.enemy_boss.baseHp * (1 + (GlobalEngineRegistry.systemConfig.currentLevel - 1) * 0.3));
            enemy.maxHp = enemy.hp;
            enemy.speed = difficulty.enemySpeed * 0.5;
            enemy.damage = Math.floor(SHIP_DEFINITIONS.enemy_boss.baseDamage * (1 + (GlobalEngineRegistry.systemConfig.currentLevel - 1) * 0.1));
            enemy.fireRate = Math.max(300, difficulty.enemyFireRate * 1.5);
        } else if (enemy.type === 'enemy_bomber') {
            enemy.hp = Math.floor(SHIP_DEFINITIONS.enemy_bomber.baseHp * (1 + (GlobalEngineRegistry.systemConfig.currentLevel - 1) * 0.15));
            enemy.maxHp = enemy.hp;
            enemy.speed = difficulty.enemySpeed * 0.6;
            enemy.damage = Math.floor(SHIP_DEFINITIONS.enemy_bomber.baseDamage * (1 + (GlobalEngineRegistry.systemConfig.currentLevel - 1) * 0.1));
            enemy.fireRate = Math.max(500, difficulty.enemyFireRate * 1.2);
        } else {
            enemy.hp = difficulty.enemyMaxHp;
            enemy.maxHp = difficulty.enemyMaxHp;
            enemy.speed = difficulty.enemySpeed;
            enemy.damage = difficulty.enemyDamage;
            enemy.fireRate = difficulty.enemyFireRate;
        }
    }

    public static getLevelDescription(level: number): string {
        if (level === 1) return 'Iniciación: Enemigos estáticos, disparos lentos.';
        if (level <= 3) return 'Principiante: Primeros enemigos con patrones simples.';
        if (level <= 6) return 'Aprendiz: Enemigos más rápidos y agresivos.';
        if (level <= 9) return 'Combatiente: Introducción de IA de evasión.';
        if (level === 10) return 'Barrera Intermedia: Evasión activa activada.';
        if (level <= 13) return 'Veterano: Movimientos sinusoidales.';
        if (level <= 16) return 'Élite: Bullet Hell partial activo.';
        if (level <= 19) return 'Maestro: Infierno de balas progresivo.';
        return 'VICTORIA ABSOLUTA: Bullet Hell máximo activo.';
    }
}