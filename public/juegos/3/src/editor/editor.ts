import { GlobalEngineRegistry } from '../engine/registry';
import { CommandInterpreter } from '../engine/interpreter';
import { SHIP_DEFINITIONS } from '../ships/definitions';
import { getShapeKeys, SHIP_SHAPES } from '../ships/definitions';

export class EditorUI {
    private panel: HTMLElement | null = null;
    private isOpen: boolean = false;
    private selectedCategory: string = 'Jugador';
    private commandInput!: HTMLInputElement;
    private categorySelect!: HTMLSelectElement;
    private statusDisplay!: HTMLDivElement;
    private onToggleCallback: ((paused: boolean) => void) | null = null;

    constructor() {
        this.createToggleButton();
    }

    private createToggleButton(): void {
        const btn = document.createElement('button');
        btn.id = 'btn-editor';
        btn.textContent = '✎ EDITAR';
        btn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(0, 255, 255, 0.15);
            border: 2px solid #00ffff;
            color: #00ffff;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            transition: all 0.3s ease;
            text-shadow: 0 0 10px #00ffff;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(0, 255, 255, 0.3)';
            btn.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.5)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(0, 255, 255, 0.15)';
            btn.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3)';
        });

        btn.addEventListener('click', () => this.toggle());

        document.body.appendChild(btn);
    }

    public toggle(): void {
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            this.createPanel();
            if (this.onToggleCallback) this.onToggleCallback(true);
        } else {
            this.closePanel();
            if (this.onToggleCallback) this.onToggleCallback(false);
        }
    }

    public onToggle(callback: (paused: boolean) => void): void {
        this.onToggleCallback = callback;
    }

    private createPanel(): void {
        this.panel = document.createElement('div');
        this.panel.id = 'editor-panel';
        this.panel.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            width: 380px;
            max-height: calc(100vh - 100px);
            background: rgba(10, 10, 25, 0.95);
            border: 2px solid #00ffff;
            border-radius: 8px;
            padding: 20px;
            z-index: 1001;
            font-family: 'Courier New', monospace;
            color: #ffffff;
            box-shadow: 0 0 40px rgba(0, 255, 255, 0.3);
            overflow-y: auto;
        `;

        this.panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid rgba(0,255,255,0.3); padding-bottom: 10px;">
                <h3 style="margin: 0; color: #00ffff; text-shadow: 0 0 10px #00ffff;">⚡ RUNTIME EDITOR</h3>
                <button id="btn-close" style="background: none; border: none; color: #ff3366; font-size: 20px; cursor: pointer;">✕</button>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #00ffff; font-size: 12px;">CATEGORÍA:</label>
                <select id="editor-category" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.5); border: 1px solid #00ffff; color: #fff; font-family: inherit; border-radius: 4px;">
                    <option value="Jugador">✈ Jugador</option>
                    <option value="Todos los Enemigos">👾 Todos los Enemigos</option>
                    <option value="Configuración General">⚙ Configuración General</option>
                </select>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #00ffff; font-size: 12px;">PROPIEDADES DISPONIBLES:</label>
                <div id="available-props" style="background: rgba(0,0,0,0.4); padding: 8px; border-radius: 4px; font-size: 11px; color: #aaa; max-height: 80px; overflow-y: auto;"></div>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #00ffff; font-size: 12px;">COMANDO:</label>
                <input type="text" id="chat-command" placeholder="propiedad = valor" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.5); border: 1px solid #00ffff; color: #fff; font-family: inherit; border-radius: 4px; box-sizing: border-box;">
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #00ffff; font-size: 12px;">FORMAS PREDEFINIDAS:</label>
                <div id="shape-presets" style="display: flex; flex-wrap: wrap; gap: 5px;"></div>
            </div>

            <button id="btn-apply" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #00ffff 0%, #0088ff 100%); border: none; color: #000; font-family: inherit; font-weight: bold; font-size: 14px; cursor: pointer; border-radius: 4px; margin-bottom: 10px;">▶ APLICAR</button>

            <div id="editor-status" style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 4px; font-size: 12px; min-height: 40px; word-break: break-all;"></div>
        `;

        document.body.appendChild(this.panel);

        this.categorySelect = document.getElementById('editor-category') as HTMLSelectElement;
        this.commandInput = document.getElementById('chat-command') as HTMLInputElement;
        this.statusDisplay = document.getElementById('editor-status') as HTMLDivElement;

        this.categorySelect.addEventListener('change', () => {
            this.selectedCategory = this.categorySelect.value;
            this.updateAvailableProps();
        });

        document.getElementById('btn-close')!.addEventListener('click', () => this.toggle());
        document.getElementById('btn-apply')!.addEventListener('click', () => this.applyCommand());

        this.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyCommand();
        });

        this.updateAvailableProps();
        this.populateShapePresets();
    }

    private updateAvailableProps(): void {
        const props = CommandInterpreter.getAvailableProperties(this.selectedCategory);
        const container = document.getElementById('available-props');
        if (container) {
            container.innerHTML = props.map(p => `<span style="display: inline-block; background: rgba(0,255,255,0.1); padding: 2px 6px; margin: 2px; border-radius: 3px; cursor: pointer;" title="Click to use">${p}</span>`).join('');
            
            container.querySelectorAll('span').forEach(span => {
                span.addEventListener('click', () => {
                    this.commandInput.value = `${span.textContent} = `;
                    this.commandInput.focus();
                });
            });
        }
    }

    private populateShapePresets(): void {
        const container = document.getElementById('shape-presets');
        if (!container) return;

        const shapes = getShapeKeys();
        container.innerHTML = shapes.map(shape => `
            <button class="shape-preset" data-shape="${shape}" style="padding: 5px 10px; background: rgba(255,255,255,0.1); border: 1px solid #666; color: #fff; font-size: 10px; cursor: pointer; border-radius: 3px;">${shape}</button>
        `).join('');

        container.querySelectorAll('.shape-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const shapeKey = btn.getAttribute('data-shape')!;
                const shapeValue = SHIP_SHAPES[shapeKey];
                this.commandInput.value = `shape = ${shapeValue}`;
            });
        });
    }

    private applyCommand(): void {
        const command = this.commandInput.value;
        if (!command.trim()) {
            this.statusDisplay.innerHTML = '<span style="color: #ff9900;">⚠ Escribe un comando primero</span>';
            return;
        }

        const result = CommandInterpreter.execute(this.selectedCategory, command);
        
        if (result.startsWith('Éxito')) {
            this.statusDisplay.innerHTML = `<span style="color: #00ff00;">✓ ${result}</span>`;
        } else {
            this.statusDisplay.innerHTML = `<span style="color: #ff3366;">✗ ${result}</span>`;
        }

        this.commandInput.value = '';
    }

    private closePanel(): void {
        if (this.panel) {
            document.body.removeChild(this.panel);
            this.panel = null;
        }
    }

    public updateStatus(message: string, isError: boolean = false): void {
        if (this.statusDisplay) {
            this.statusDisplay.innerHTML = isError 
                ? `<span style="color: #ff3366;">✗ ${message}</span>`
                : `<span style="color: #00ff00;">✓ ${message}</span>`;
        }
    }
}