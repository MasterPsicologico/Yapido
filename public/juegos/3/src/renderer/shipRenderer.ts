import { GameEntity, GlobalEngineRegistry } from '../engine/registry';
import { SHIP_DEFINITIONS } from '../ships/definitions';

export class ShipRenderer {
    private ctx: CanvasRenderingContext2D;
    private glowIntensity: number = 15;
    private trailEffects: Map<string, { x: number; y: number; alpha: number }[]> = new Map();

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public drawShip(entity: GameEntity, isPlayer: boolean = false): void {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(entity.x, entity.y);

        if (isPlayer) {
            ctx.rotate(Math.PI);
        }

        this.drawNeonShape(entity.shape, entity.color, entity.width, entity.height);

        if (entity.hp !== undefined && entity.maxHp !== undefined && entity.hp < entity.maxHp) {
            this.drawHealthBar(entity);
        }

        if (isPlayer) {
            this.drawEngineGlow(entity);
        }

        ctx.restore();

        if (entity.type.startsWith('enemy') && entity.active) {
            this.updateTrail(entity);
        }
    }

    private drawNeonShape(shapeStr: string, color: string, width: number, height: number): void {
        const ctx = this.ctx;
        const points = this.parseShape(shapeStr);
        
        if (points.length < 3) return;

        const scaleX = width / 40;
        const scaleY = height / 40;
        const scale = Math.min(scaleX, scaleY);

        ctx.shadowColor = color;
        ctx.shadowBlur = this.glowIntensity;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.fillStyle = this.hexToRgba(color, 0.3);

        ctx.beginPath();
        ctx.moveTo(points[0].x * scale, points[0].y * scale);
        
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x * scale, points[i].y * scale);
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = this.glowIntensity * 0.5;
        ctx.strokeStyle = this.hexToRgba(color, 0.8);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.shadowBlur = 0;
    }

    private parseShape(shapeStr: string): { x: number; y: number }[] {
        const points: { x: number; y: number }[] = [];
        const parts = shapeStr.split(' ');

        for (const part of parts) {
            const coords = part.split(',');
            if (coords.length === 2) {
                const x = parseFloat(coords[0]);
                const y = parseFloat(coords[1]);
                if (!isNaN(x) && !isNaN(y)) {
                    points.push({ x, y });
                }
            }
        }

        return points;
    }

    private drawHealthBar(entity: GameEntity): void {
        const ctx = this.ctx;
        const barWidth = 40;
        const barHeight = 4;
        const x = -barWidth / 2;
        const y = -entity.height / 2 - 12;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);

        const healthPercent = entity.hp / entity.maxHp;
        const healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';

        ctx.fillStyle = healthColor;
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    private drawEngineGlow(entity: GameEntity): void {
        const ctx = this.ctx;
        const glowColors = ['#00ffff', '#0088ff', '#00ccff'];
        
        const time = Date.now() * 0.01;
        const flicker = 0.7 + Math.sin(time * 5) * 0.3;

        for (let i = 0; i < 2; i++) {
            const offsetX = (i - 0.5) * 15;
            const engineY = entity.height / 2 + 5 + Math.sin(time * 10 + i) * 3;

            const gradient = ctx.createRadialGradient(offsetX, engineY, 0, offsetX, engineY, 15 * flicker);
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.9)');
            gradient.addColorStop(0.5, 'rgba(0, 136, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 204, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(offsetX, engineY, 15 * flicker, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private updateTrail(entity: GameEntity): void {
        if (!this.trailEffects.has(entity.id)) {
            this.trailEffects.set(entity.id, []);
        }

        const trail = this.trailEffects.get(entity.id)!;
        trail.push({ x: entity.x, y: entity.y, alpha: 0.6 });

        if (trail.length > 8) {
            trail.shift();
        }

        for (let i = 0; i < trail.length; i++) {
            trail[i].alpha = (i / trail.length) * 0.4;
        }
    }

    public drawTrails(): void {
        const ctx = this.ctx;

        this.trailEffects.forEach((trail, entityId) => {
            const enemy = GlobalEngineRegistry.enemies.find(e => e.id === entityId);
            if (!enemy || !enemy.active) {
                this.trailEffects.delete(entityId);
                return;
            }

            for (const point of trail) {
                ctx.fillStyle = `rgba(255, 50, 100, ${point.alpha})`;
                ctx.beginPath();
                ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    public drawProjectile(entity: GameEntity): void {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(entity.x, entity.y);

        const points = this.parseShape(entity.shape);
        const scale = Math.min(entity.width / 10, entity.height / 20);

        ctx.shadowColor = entity.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = entity.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(points[0].x * scale, points[0].y * scale);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x * scale, points[i].y * scale);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    public drawParticle(x: number, y: number, color: string, size: number, alpha: number): void {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    private hexToRgba(hex: string, alpha: number): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    public setGlowIntensity(intensity: number): void {
        this.glowIntensity = intensity;
    }

    public clearTrails(): void {
        this.trailEffects.clear();
    }
}