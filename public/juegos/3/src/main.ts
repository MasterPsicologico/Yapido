import { GameLoop } from './game/gameLoop';
import { EditorUI } from './editor/editor';
import { GlobalEngineRegistry } from './engine/registry';

class SpaceShooterGame {
    private canvas: HTMLCanvasElement;
    private gameLoop: GameLoop;
    private editorUI: EditorUI;

    constructor() {
        this.canvas = this.createCanvas();
        this.gameLoop = new GameLoop(this.canvas);
        this.editorUI = new EditorUI();

        this.setupEditorIntegration();
        this.setupResizeHandler();
        
        document.body.appendChild(this.canvas);
        
        this.resize();
        
        this.gameLoop.initialize();
        this.gameLoop.start();

        this.showWelcomeMessage();
    }

    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.id = 'game-canvas';
        canvas.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 1;';
        return canvas;
    }

    private setupEditorIntegration(): void {
        this.editorUI.onToggle((paused: boolean) => {
            GlobalEngineRegistry.systemConfig.paused = paused;
        });
    }

    private setupResizeHandler(): void {
        window.addEventListener('resize', () => this.resize());
    }

    private resize(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gameLoop.resize(this.canvas.width, this.canvas.height);
    }

    private showWelcomeMessage(): void {
        const overlay = document.createElement('div');
        overlay.id = 'welcome-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10, 10, 25, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            font-family: 'Courier New', monospace;
            color: #fff;
        `;

        overlay.innerHTML = `
            <div style="text-align: center; max-width: 600px; padding: 40px;">
                <h1 style="color: #00ffff; font-size: 48px; margin-bottom: 10px; text-shadow: 0 0 30px #00ffff;">🚀 SPACE SHOOTER</h1>
                <h2 style="color: #ff3366; font-size: 24px; margin-bottom: 30px;">ECS HÍBRIDO + LIVE EDITOR</h2>
                
                <div style="text-align: left; margin-bottom: 30px; line-height: 1.8;">
                    <p style="color: #aaa;"><strong style="color: #00ffff;">WASD / Flechas</strong> — Mover nave</p>
                    <p style="color: #aaa;"><strong style="color: #00ffff;">ESPACIO</strong> — Disparar</p>
                    <p style="color: #aaa;"><strong style="color: #00ffff;">✎ EDITAR</strong> — Abrir editor en tiempo real</p>
                </div>

                <div style="background: rgba(0,255,255,0.1); padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: left;">
                    <h3 style="color: #00ffff; margin-top: 0;">🎮 CARACTERÍSTICAS</h3>
                    <ul style="color: #ccc; line-height: 2; padding-left: 20px;">
                        <li>20 niveles con dificultad adaptativa</li>
                        <li>Motor ECS híbrido</li>
                        <li>Editor en tiempo real (Runtime Live Editor)</li>
                        <li>Formas de naves editables</li>
                        <li>Patrones Bullet Hell en niveles altos</li>
                    </ul>
                </div>

                <button id="btn-start" style="padding: 15px 50px; background: linear-gradient(135deg, #00ffff 0%, #0088ff 100%); border: none; color: #000; font-family: inherit; font-weight: bold; font-size: 18px; cursor: pointer; border-radius: 8px; text-transform: uppercase;">JUGAR</button>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('btn-start')!.addEventListener('click', () => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
            }, 500);
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new SpaceShooterGame();
});

export { SpaceShooterGame };