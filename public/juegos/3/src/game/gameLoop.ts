import { GlobalEngineRegistry, GameEntity, createEntity, Particle } from '../engine/registry';
import { DifficultySystem } from '../engine/difficulty';
import { ShipRenderer } from '../renderer/shipRenderer';

export class GameLoop {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private renderer: ShipRenderer;
    private lastTime: number = 0;
    private lastSpawn: number = 0;
    private animationId: number = 0;
    private keys: Map<string, boolean> = new Map();
    private isRunning: boolean = false;
    private bossSpawned: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.renderer = new ShipRenderer(this.ctx);
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        window.addEventListener('keydown', (e) => {
            this.keys.set(e.key.toLowerCase(), true);
            if (e.key === ' ') e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys.set(e.key.toLowerCase(), false);
        });
    }

    public initialize(): void {
        const player = createEntity('player', this.canvas.width / 2, this.canvas.height - 100, {
            width: 45,
            height: 45,
            hp: 100,
            maxHp: 100,
            speed: 6,
            color: '#00ffff',
            fireRate: 250,
            scoreValue: 0
        });
        GlobalEngineRegistry.player = player;
        GlobalEngineRegistry.systemConfig.score = 0;
        GlobalEngineRegistry.systemConfig.currentLevel = 1;
        GlobalEngineRegistry.systemConfig.timeScale = 1.0;
        GlobalEngineRegistry.systemConfig.paused = false;
    }

    public start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop();
    }

    public stop(): void {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    private loop = (): void => {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        let deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        deltaTime *= GlobalEngineRegistry.systemConfig.timeScale;

        this.update(deltaTime, currentTime);
        this.render();

        this.animationId = requestAnimationFrame(this.loop);
    };

    private update(deltaTime: number, currentTime: number): void {
        if (GlobalEngineRegistry.systemConfig.paused) return;

        this.updatePlayer(deltaTime, currentTime);
        this.updateEnemies(deltaTime, currentTime);
        this.updateProjectiles(deltaTime);
        this.updateParticles(deltaTime);
        this.checkCollisions();
        this.spawnEnemies(currentTime);
        this.updateLevel();
        this.cleanupInactive();
    }

    private updatePlayer(deltaTime: number, currentTime: number): void {
        const player = GlobalEngineRegistry.player;
        if (!player) return;

        const moveSpeed = player.speed * 60 * deltaTime;

        if (this.keys.get('w') || this.keys.get('arrowup')) player.y -= moveSpeed;
        if (this.keys.get('s') || this.keys.get('arrowdown')) player.y += moveSpeed;
        if (this.keys.get('a') || this.keys.get('arrowleft')) player.x -= moveSpeed;
        if (this.keys.get('d') || this.keys.get('arrowright')) player.x += moveSpeed;

        player.x = Math.max(player.width / 2, Math.min(this.canvas.width - player.width / 2, player.x));
        player.y = Math.max(player.height / 2, Math.min(this.canvas.height - player.height / 2, player.y));

        if (this.keys.get(' ') && currentTime - player.lastShot >= player.fireRate) {
            this.fireProjectile(player, true);
            player.lastShot = currentTime;
        }
    }

    private fireProjectile(entity: GameEntity, isPlayer: boolean): void {
        const projectileType = isPlayer ? 'projectile_player' : 'projectile_enemy';
        
        const projectile = createEntity(projectileType, entity.x, entity.y - (isPlayer ? entity.height / 2 : -entity.height / 2), {
            width: 10,
            height: 20,
            vx: 0,
            vy: isPlayer ? -12 : 6,
            damage: entity.damage,
            color: isPlayer ? '#00ff88' : '#ff4444',
            fireRate: entity.fireRate,
            scoreValue: 0
        });

        if (!isPlayer && GlobalEngineRegistry.systemConfig.currentLevel >= 12) {
            const difficulty = DifficultySystem.updateDifficulty(GlobalEngineRegistry.systemConfig.currentLevel);
            if (difficulty.bulletHellMultiplier > 1.5) {
                const angle = Math.atan2(
                    (GlobalEngineRegistry.player?.y || 0) - entity.y,
                    (GlobalEngineRegistry.player?.x || 0) - entity.x
                );
                for (let i = -1; i <= 1; i++) {
                    const spreadAngle = angle + i * 0.2;
                    const extraProjectile = createEntity(projectileType, entity.x, entity.y, {
                        width: 8,
                        height: 16,
                        vx: Math.cos(spreadAngle) * 6,
                        vy: Math.sin(spreadAngle) * 6,
                        damage: Math.floor(entity.damage * 0.7),
                        color: '#ff6644',
                        fireRate: entity.fireRate
                    });
                    GlobalEngineRegistry.projectiles.push(extraProjectile);
                }
            }
        }

        GlobalEngineRegistry.projectiles.push(projectile);
    }

    private updateEnemies(deltaTime: number, currentTime: number): void {
        const difficulty = DifficultySystem.updateDifficulty(GlobalEngineRegistry.systemConfig.currentLevel);
        const player = GlobalEngineRegistry.player;

        for (const enemy of GlobalEngineRegistry.enemies) {
            if (!enemy.active) continue;

            if (enemy.type !== 'enemy_boss') {
                if (difficulty.hasSinusoidalMovement) {
                    enemy.x += Math.sin(currentTime * 0.003 + enemy.y * 0.01) * enemy.speed * 0.5;
                }
                
                if (difficulty.hasEvasionAI && player) {
                    const dx = player.x - enemy.x;
                    const dy = player.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 200) {
                        enemy.x -= (dx / dist) * enemy.speed * 0.5;
                        enemy.y -= (dy / dist) * enemy.speed * 0.3;
                    } else {
                        enemy.y += enemy.speed;
                    }
                } else {
                    enemy.y += enemy.speed;
                }
            } else {
                if (enemy.y < 100) {
                    enemy.y += enemy.speed * 0.5;
                }
                enemy.x += Math.sin(currentTime * 0.001) * 1.5;
            }

            if (currentTime - enemy.lastShot >= enemy.fireRate && enemy.y > 0 && enemy.y < this.canvas.height - 100) {
                this.fireProjectile(enemy, false);
                enemy.lastShot = currentTime;
            }
        }
    }

    private updateProjectiles(deltaTime: number): void {
        for (const proj of GlobalEngineRegistry.projectiles) {
            proj.x += proj.vx;
            proj.y += proj.vy;
        }

        GlobalEngineRegistry.projectiles = GlobalEngineRegistry.projectiles.filter(p => 
            p.y > -50 && p.y < this.canvas.height + 50 && p.x > -50 && p.x < this.canvas.width + 50
        );
    }

    private updateParticles(deltaTime: number): void {
        for (const particle of GlobalEngineRegistry.particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= deltaTime * 60;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
        }

        GlobalEngineRegistry.particles = GlobalEngineRegistry.particles.filter(p => p.life > 0);
    }

    private checkCollisions(): void {
        const player = GlobalEngineRegistry.player;
        if (!player) return;

        for (const projectile of GlobalEngineRegistry.projectiles) {
            if (projectile.type === 'projectile_player') {
                for (const enemy of GlobalEngineRegistry.enemies) {
                    if (!enemy.active) continue;
                    if (this.checkAABB(projectile, enemy)) {
                        projectile.active = false;
                        enemy.hp -= projectile.damage;
                        this.spawnHitParticles(enemy.x, enemy.y, enemy.color);
                        
                        if (enemy.hp <= 0) {
                            enemy.active = false;
                            GlobalEngineRegistry.systemConfig.score += enemy.scoreValue;
                            this.spawnExplosion(enemy.x, enemy.y, enemy.color);
                        }
                    }
                }
            } else if (projectile.type === 'projectile_enemy') {
                if (this.checkAABB(projectile, player)) {
                    projectile.active = false;
                    player.hp -= projectile.damage;
                    this.spawnHitParticles(player.x, player.y, '#00ffff');
                    
                    if (player.hp <= 0) {
                        this.gameOver();
                    }
                }
            }
        }

        for (const enemy of GlobalEngineRegistry.enemies) {
            if (!enemy.active) continue;
            if (this.checkAABB(player, enemy)) {
                player.hp -= enemy.damage * 0.5;
                enemy.hp -= 30;
                this.spawnHitParticles(player.x, player.y, '#ffff00');
                
                if (enemy.hp <= 0) {
                    enemy.active = false;
                    GlobalEngineRegistry.systemConfig.score += enemy.scoreValue;
                }
                
                if (player.hp <= 0) {
                    this.gameOver();
                }
            }
        }
    }

    private checkAABB(a: GameEntity, b: GameEntity): boolean {
        return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
               Math.abs(a.y - b.y) < (a.height + b.height) / 2;
    }

    private spawnHitParticles(x: number, y: number, color: string): void {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 2 + Math.random() * 3;
            GlobalEngineRegistry.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30,
                maxLife: 30,
                color,
                size: 2 + Math.random() * 2
            });
        }
    }

    private spawnExplosion(x: number, y: number, color: string): void {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 5;
            GlobalEngineRegistry.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 40 + Math.random() * 20,
                maxLife: 60,
                color,
                size: 2 + Math.random() * 4
            });
        }
    }

    private spawnEnemies(currentTime: number): void {
        const difficulty = DifficultySystem.updateDifficulty(GlobalEngineRegistry.systemConfig.currentLevel);

        if (currentTime - this.lastSpawn < difficulty.spawnRate) return;
        this.lastSpawn = currentTime;

        if (GlobalEngineRegistry.systemConfig.currentLevel >= 10 && !this.bossSpawned && GlobalEngineRegistry.systemConfig.score >= 20000) {
            this.spawnBoss();
            this.bossSpawned = true;
            return;
        }

        const rand = Math.random();
        let enemyType: 'enemy_scout' | 'enemy_bomber';
        
        if (rand < 0.7) {
            enemyType = 'enemy_scout';
        } else {
            enemyType = 'enemy_bomber';
        }

        const enemy = createEntity(enemyType, 
            50 + Math.random() * (this.canvas.width - 100), 
            -50, 
            {
                width: enemyType === 'enemy_bomber' ? 50 : 35,
                height: enemyType === 'enemy_bomber' ? 50 : 35,
                color: enemyType === 'enemy_bomber' ? '#ff9900' : '#ff3366'
            }
        );

        DifficultySystem.applyDifficultyToEnemy(enemy, difficulty);
        GlobalEngineRegistry.enemies.push(enemy);
    }

    private spawnBoss(): void {
        const boss = createEntity('enemy_boss', this.canvas.width / 2, -80, {
            width: 80,
            height: 70,
            color: '#cc00ff'
        });

        const difficulty = DifficultySystem.updateDifficulty(GlobalEngineRegistry.systemConfig.currentLevel);
        DifficultySystem.applyDifficultyToEnemy(boss, difficulty);
        
        GlobalEngineRegistry.enemies.push(boss);
    }

    private updateLevel(): void {
        const newLevel = DifficultySystem.getLevelFromScore(GlobalEngineRegistry.systemConfig.score);
        
        if (newLevel !== GlobalEngineRegistry.systemConfig.currentLevel) {
            GlobalEngineRegistry.systemConfig.currentLevel = newLevel;
            
            if (newLevel === 20) {
                this.bossSpawned = false;
            }
        }
    }

    private cleanupInactive(): void {
        GlobalEngineRegistry.enemies = GlobalEngineRegistry.enemies.filter(e => e.active !== false && e.y < this.canvas.height + 100);
        GlobalEngineRegistry.projectiles = GlobalEngineRegistry.projectiles.filter(p => p.active !== false);
    }

    private gameOver(): void {
        GlobalEngineRegistry.systemConfig.paused = true;
        
        if (GlobalEngineRegistry.player) {
            this.spawnExplosion(GlobalEngineRegistry.player.x, GlobalEngineRegistry.player.y, '#00ffff');
            GlobalEngineRegistry.player.active = false;
        }

        setTimeout(() => {
            this.initialize();
        }, 2000);
    }

    private render(): void {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawStarfield();
        
        this.renderer.drawTrails();

        for (const particle of GlobalEngineRegistry.particles) {
            const alpha = particle.life / particle.maxLife;
            this.renderer.drawParticle(particle.x, particle.y, particle.color, particle.size, alpha);
        }

        for (const projectile of GlobalEngineRegistry.projectiles) {
            this.renderer.drawProjectile(projectile);
        }

        for (const enemy of GlobalEngineRegistry.enemies) {
            if (enemy.active) {
                this.renderer.drawShip(enemy, false);
            }
        }

        if (GlobalEngineRegistry.player && GlobalEngineRegistry.player.active) {
            this.renderer.drawShip(GlobalEngineRegistry.player, true);
        }

        this.drawHUD();
    }

    private drawStarfield(): void {
        const ctx = this.ctx;
        const time = Date.now() * 0.0001;
        
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 137.5 + time * (i % 3 + 1) * 10) % this.canvas.width;
            const y = (i * 73.3 + time * (i % 2 + 0.5) * 5) % this.canvas.height;
            const size = (i % 3) * 0.5 + 0.5;
            ctx.globalAlpha = 0.3 + (Math.sin(time * 10 + i) + 1) * 0.35;
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1;
    }

    private drawHUD(): void {
        const ctx = this.ctx;
        const config = GlobalEngineRegistry.systemConfig;
        const player = GlobalEngineRegistry.player;

        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.fillText(`SCORE: ${config.score}`, 20, 30);
        ctx.fillText(`NIVEL: ${config.currentLevel}`, 20, 55);
        
        if (player) {
            ctx.fillStyle = player.hp > 30 ? '#00ff00' : '#ff0000';
            ctx.fillText(`HP: ${Math.max(0, player.hp)}/${player.maxHp}`, 20, 80);
        }

        ctx.shadowBlur = 0;
        
        const levelDesc = DifficultySystem.getLevelDescription(config.currentLevel);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px "Courier New", monospace';
        ctx.fillText(levelDesc, 20, this.canvas.height - 20);
    }

    public resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
    }
}