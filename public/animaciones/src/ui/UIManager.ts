import anime from 'animejs';
import type { TextScript, TextEvent, TextCategory, ExitEffect } from '../core/Textualizer';

/** Callbacks que el UIManager invoca al detectar acciones del usuario. */
export interface UIManagerCallbacks {
  /** Se ejecuta al pulsar "Comenzar Renderizado". */
  onRenderRequested: (idea: string) => Promise<void> | void;
  /** Se ejecuta al pulsar "Descargar WebM". */
  onDownloadWebM: () => void;
  /** Se ejecuta al pulsar "Descargar PNG". */
  onDownloadPNG: () => void;
  /** Se ejecuta al pulsar "Exportar Receta". */
  onDownloadRecipe: () => void;
  /**
   * Se ejecuta cuando el usuario hace clic en una palabra interactiva
   * de la tipografía cinética. La palabra se usa como nuevo prompt.
   */
  onTypoWordClick: (word: string) => void;
}

/**
 * UIManager
 * ------------------------------------------------------------------
 * Capa de presentación y micro-interacciones del DOM. Se comunica
 * con Anime.js para orquestar:
 *  - Aparición elegante del panel al cargar.
 *  - Escaneo de datos (barras dinámicas) mientras se renderiza.
 *  - Hint de scroll al terminar el render.
 *  - Distorsión tipográfica coordinada con la creación 3D.
 *  - Kinetic typography: palabras animadas sincronizadas con la escena 3D.
 *  - Mouse parallax en la capa de palabras.
 *  - Click sobre palabra → re-render con esa palabra como nuevo prompt.
 *
 * No contiene lógica 3D: delega todo al motor mediante callbacks.
 */
export class UIManager {
  private readonly ideaInput: HTMLTextAreaElement;
  private readonly btnRender: HTMLButtonElement;
  private readonly btnDownloadWebM: HTMLButtonElement;
  private readonly btnDownloadPNG: HTMLButtonElement;
  private readonly btnDownloadRecipe: HTMLButtonElement;
  private readonly scanOverlay: HTMLElement;
  private readonly scanText: HTMLElement;
  private readonly scrollHint: HTMLElement;
  private readonly downloadProgress: HTMLElement;
  private readonly downloadProgressBar: HTMLElement;
  private readonly downloadProgressText: HTMLElement;
  private readonly statFps: HTMLElement;
  private readonly statTris: HTMLElement;
  private readonly statObjs: HTMLElement;
  private readonly typoLayer: HTMLElement;

  private readonly callbacks: UIManagerCallbacks;
  private isRendering: boolean = false;

  /** Tiempos programados del guion tipográfico actual (para limpieza). */
  private typoTimeouts: number[] = [];
  /** ID de requestAnimationFrame del loop tipográfico. */
  private typoLoopHandle: number | null = null;
  /** Guion tipográfico activo. */
  private activeScript: TextScript | null = null;
  /** Si el loop tipográfico está corriendo. */
  private typoRunning: boolean = false;
  /** Map id → wrap element (para query rápido en cleanup y parallax). */
  private typoWraps: Map<string, HTMLElement> = new Map();
  /** Mouse coords normalizados (-1 a 1). */
  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor(callbacks: UIManagerCallbacks) {
    this.callbacks = callbacks;

    this.ideaInput = this.required<HTMLTextAreaElement>('#idea-input');
    this.btnRender = this.required<HTMLButtonElement>('#btn-render');
    this.btnDownloadWebM = this.required<HTMLButtonElement>('#btn-download-webm');
    this.btnDownloadPNG = this.required<HTMLButtonElement>('#btn-download-png');
    this.btnDownloadRecipe = this.required<HTMLButtonElement>('#btn-download-json');
    this.scanOverlay = this.required<HTMLElement>('#scan-overlay');
    this.scanText = this.required<HTMLElement>('#scan-text');
    this.scrollHint = this.required<HTMLElement>('#scroll-hint');
    this.downloadProgress = this.required<HTMLElement>('#download-progress');
    this.downloadProgressBar = this.required<HTMLElement>('.download-progress-bar');
    this.downloadProgressText = this.required<HTMLElement>('.download-progress-text');
    this.statFps = this.required<HTMLElement>('#stat-fps');
    this.statTris = this.required<HTMLElement>('#stat-tris');
    this.statObjs = this.required<HTMLElement>('#stat-objects');
    this.typoLayer = this.required<HTMLElement>('#typo-layer');

    this.bindEvents();
  }

  /** Helper para no repetir casts ni nulls. */
  private required<T extends HTMLElement>(selector: string): T {
    const el = document.querySelector<T>(selector);
    if (!el) {
      throw new Error(`UIManager: elemento no encontrado: ${selector}`);
    }
    return el;
  }

  /** Conecta los eventos del DOM. */
  private bindEvents(): void {
    this.btnRender.addEventListener('click', this.handleRender);
    this.btnDownloadWebM.addEventListener('click', () => this.callbacks.onDownloadWebM());
    this.btnDownloadPNG.addEventListener('click', () => this.callbacks.onDownloadPNG());
    this.btnDownloadRecipe.addEventListener('click', () => this.callbacks.onDownloadRecipe());

    // Mouse parallax (solo se aplica a la typo layer).
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: true });
  }

  /** Handler de movimiento de mouse para parallax. */
  private handleMouseMove = (e: MouseEvent): void => {
    this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    this.updateAllParallax();
  };

  /** Handler táctil: tomamos el primer dedo. */
  private handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      if (t) {
        this.mouseX = (t.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = (t.clientY / window.innerHeight) * 2 - 1;
      }
    }
  };

  /** Click handler principal. */
  private handleRender = async (): Promise<void> => {
    if (this.isRendering) return;
    this.isRendering = true;

    const idea = this.ideaInput.value.trim();

    // 1) Distorsión tipográfica del botón + fade out del panel viejo.
    this.animatePreRender();

    try {
      // 2) Escaneo (mientras el motor trabaja).
      this.showScan('Inicializando motor de renderizado…');

      // 3) Ejecutar la promesa del motor.
      await this.callbacks.onRenderRequested(idea);

      // 4) Escaneo finalizado.
      this.setScanText('Renderizado completo. Materia entrelazada.');
      await this.wait(400);
      this.hideScan();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      this.setScanText('Error en el renderizado. Intenta de nuevo.');
      await this.wait(900);
      this.hideScan();
    } finally {
      this.isRendering = false;
    }
  };

  /**
   * Setea el valor del textarea sin disparar un render.
   * Útil cuando se quiere "rellenar" el input antes de un re-render.
   */
  public setIdeaValue(value: string): void {
    this.ideaInput.value = value;
  }

  /**
   * Dispara un renderizado con la idea dada, sin que el usuario tenga
   * que escribirla en el textarea. Replica el flujo del botón
   * "Comenzar Renderizado" usando la idea provista como semilla.
   */
  public async triggerRenderWithIdea(idea: string): Promise<void> {
    if (this.isRendering) return;
    this.ideaInput.value = idea;
    await this.handleRender();
  }

  /** Animación previa al renderizado (Anime.js). */
  private animatePreRender(): void {
    anime.remove(this.btnRender);
    anime({
      targets: this.btnRender,
      scale: [1, 0.96, 1],
      duration: 400,
      easing: 'easeInOutQuad'
    });

    const bars = document.querySelectorAll<HTMLElement>('.scan-bar');
    bars.forEach((bar, i) => {
      anime({
        targets: bar,
        height: ['20%', '90%', '40%', '75%', '20%'],
        duration: 800 + i * 60,
        easing: 'easeInOutSine',
        loop: true
      });
    });
  }

  /** Muestra el overlay de escaneo. */
  public showScan(text: string = 'Procesando prompt…'): void {
    this.setScanText(text);
    anime({
      targets: this.scanOverlay,
      opacity: [0, 1],
      duration: 280,
      easing: 'easeOutQuad',
      begin: () => { this.scanOverlay.classList.add('is-active'); }
    });
  }

  /** Cambia el texto del escaneo. */
  public setScanText(text: string): void {
    anime({
      targets: this.scanText,
      opacity: [1, 0],
      duration: 140,
      easing: 'easeInQuad',
      complete: () => {
        this.scanText.textContent = text;
        anime({
          targets: this.scanText,
          opacity: [0, 1],
          duration: 220,
          easing: 'easeOutQuad'
        });
      }
    });
  }

  /** Oculta el overlay de escaneo. */
  public hideScan(): void {
    anime({
      targets: this.scanOverlay,
      opacity: [1, 0],
      duration: 260,
      easing: 'easeInQuad',
      complete: () => { this.scanOverlay.classList.remove('is-active'); }
    });
  }

  /** Muestra el hint de scroll. */
  public showScrollHint(): void {
    this.scrollHint.classList.add('is-visible');
    anime({
      targets: this.scrollHint,
      translateY: [10, 0],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutCubic'
    });
  }

  /** Habilita los botones de descarga tras el primer render. */
  public enableDownloads(): void {
    this.btnDownloadWebM.disabled = false;
    this.btnDownloadPNG.disabled = false;
    this.btnDownloadRecipe.disabled = false;
  }

  /** Muestra un overlay de progreso de descarga. */
  public showDownloadProgress(): void {
    this.downloadProgress.classList.add('is-active');
    this.setDownloadProgress(0);
  }

  /** Actualiza la barra de progreso (0-100). */
  public setDownloadProgress(percent: number): void {
    const p = Math.max(0, Math.min(100, percent));
    this.downloadProgressBar.style.setProperty('--progress', `${p}%`);
    this.downloadProgressText.textContent = `${Math.round(p)}%`;
  }

  /** Oculta el overlay de descarga. */
  public hideDownloadProgress(): void {
    this.downloadProgress.classList.remove('is-active');
  }

  /** Actualiza stats en vivo del panel. */
  public updateStats(fps: number, tris: number, objs: number): void {
    this.statFps.textContent = `FPS: ${fps}`;
    this.statTris.textContent = `Triángulos: ${tris.toLocaleString('es-ES')}`;
    this.statObjs.textContent = `Objetos: ${objs}`;
  }

  // ==========================================================
  // KINETIC TYPOGRAPHY
  // ==========================================================

  /**
   * Reproduce un guion tipográfico sobre el canvas 3D. Si ya hay
   * uno en curso, lo limpia y comienza el nuevo. La secuencia se
   * ejecuta en bucle hasta que se llame a clearTypography().
   */
  public playTypographicSequence(script: TextScript): void {
    this.clearTypography();
    this.activeScript = script;
    this.typoRunning = true;

    // Aplicamos la paleta cromática al layer como variables CSS.
    this.typoLayer.style.setProperty('--typo-accent', script.palette.accent);
    this.typoLayer.style.setProperty('--typo-base', script.palette.base);
    this.typoLayer.style.setProperty('--typo-glow', script.palette.glow);
    this.typoLayer.style.setProperty('--typo-secondary', script.palette.secondary);

    this.runCycle(script, 0);
  }

  /** Detiene el bucle y limpia todas las palabras. */
  public clearTypography(): void {
    this.typoRunning = false;
    if (this.typoLoopHandle !== null) {
      window.clearTimeout(this.typoLoopHandle);
      this.typoLoopHandle = null;
    }
    this.typoTimeouts.forEach((t) => window.clearTimeout(t));
    this.typoTimeouts = [];

    // Fade out de las palabras activas.
    this.typoWraps.forEach((wrap) => {
      anime({
        targets: wrap,
        opacity: [wrap.style.opacity || '1', '0'],
        duration: 300,
        easing: 'easeInQuad',
        complete: () => wrap.remove()
      });
    });
    this.typoWraps.clear();
    this.activeScript = null;
  }

  /**
   * Ejecuta un ciclo del guion: programa la entrada/salida de cada
   * evento y agenda el siguiente ciclo.
   */
  private runCycle(script: TextScript, cycleIndex: number): void {
    if (!this.typoRunning) return;

    // Pausa visual entre ciclos: la última palabra se queda un poco más
    // antes de hacer fade out, simulando "respiración" del guion.
    const cycleDelay = cycleIndex === 0 ? 0 : 600;

    const startHandle = window.setTimeout(() => {
      if (!this.typoRunning) return;
      script.events.forEach((event) => {
        const enterHandle = window.setTimeout(() => this.mountWord(event), event.startAt * 1000);
        this.typoTimeouts.push(enterHandle);

        // La salida se programa al final de su duración visible.
        const exitHandle = window.setTimeout(() => this.unmountWord(event), (event.startAt + event.duration) * 1000);
        this.typoTimeouts.push(exitHandle);
      });

      // Siguiente ciclo: totalDuration + un pequeño respiro.
      const nextHandle = window.setTimeout(() => {
        if (this.typoRunning && this.activeScript === script) {
          this.runCycle(script, cycleIndex + 1);
        }
      }, script.totalDuration * 1000);
      this.typoLoopHandle = nextHandle;
      this.typoTimeouts.push(nextHandle);
    }, cycleDelay);
    this.typoTimeouts.push(startHandle);
  }

  /** Monta una palabra en el DOM y anima su entrada. */
  private mountWord(event: TextEvent): void {
    if (!this.typoRunning) return;
    // Evitar duplicados: si ya existe un wrap con este id, salimos.
    if (this.typoWraps.has(event.id)) return;

    // Creamos wrapper de parallax (lo mueve el mouse).
    const wrap = document.createElement('div');
    wrap.className = `typo-wrap typo-${event.type} typo-cat-${event.category} typo-effect-${event.entryEffect}`;
    if (event.interactive) wrap.classList.add('typo-interactive');
    wrap.dataset.id = event.id;
    wrap.dataset.depth = String(0.4 + Math.random() * 0.6);
    // Posición absoluta en % del viewport.
    wrap.style.left = `${event.x}%`;
    wrap.style.top = `${event.y}%`;
    wrap.style.setProperty('--rot', `${event.rotation}deg`);
    wrap.style.opacity = '0';

    // Creamos la palabra interior.
    const word = document.createElement('div');
    word.className = `typo-word typo-${event.type} typo-cat-${event.category}`;
    word.textContent = event.text;
    word.style.fontSize = `${event.size}rem`;
    if (event.type === 'keyword') {
      word.style.setProperty('--kw-size', `${event.size}rem`);
    }

    wrap.appendChild(word);
    this.typoLayer.appendChild(wrap);
    this.typoWraps.set(event.id, wrap);

    // Click handler para palabras interactivas.
    if (event.interactive) {
      wrap.addEventListener('click', () => {
        this.callbacks.onTypoWordClick(event.text);
      });
    }

    // Aplicamos parallax (sutil).
    this.applyParallax(wrap);

    // Animación de entrada.
    this.runEntryAnimation(wrap, word, event);
  }

  /** Aplica parallax a un wrap concreto (en función del mouse). */
  private applyParallax(wrap: HTMLElement): void {
    const depth = parseFloat(wrap.dataset.depth ?? '0.5');
    const px = this.mouseX * 22 * depth;
    const py = this.mouseY * 22 * depth;
    wrap.style.setProperty('--wx', `${px}px`);
    wrap.style.setProperty('--wy', `${py}px`);
  }

  /** Aplica parallax a todos los wraps (loop de Anime.js). */
  private updateAllParallax(): void {
    this.typoWraps.forEach((w) => this.applyParallax(w));
  }

  /** Desmonta una palabra y la desvanece. */
  private unmountWord(event: TextEvent): void {
    if (!this.typoRunning) return;
    const wrap = this.typoWraps.get(event.id);
    if (!wrap) return;
    this.typoWraps.delete(event.id);
    this.runExitAnimation(wrap, event);
  }

  /** Animación de entrada según el efecto del evento. */
  private runEntryAnimation(wrap: HTMLElement, word: HTMLElement, event: TextEvent): void {
    const baseDur = 700;
    const baseRot = event.rotation;

    switch (event.entryEffect) {
      case 'fade': {
        anime({
          targets: wrap,
          opacity: [0, 1],
          duration: baseDur,
          easing: 'easeOutQuad'
        });
        break;
      }
      case 'slide-up': {
        anime({
          targets: wrap,
          opacity: [0, 1],
          translateY: [30, 0],
          duration: baseDur,
          easing: 'easeOutCubic'
        });
        break;
      }
      case 'slide-down': {
        anime({
          targets: wrap,
          opacity: [0, 1],
          translateY: [-30, 0],
          duration: baseDur,
          easing: 'easeOutCubic'
        });
        break;
      }
      case 'scale': {
        anime({
          targets: wrap,
          opacity: [0, 1],
          scale: [0.3, 1.05, 1],
          rotate: [baseRot - 10, baseRot],
          duration: baseDur + 200,
          easing: 'elastic.out(1, 0.7)'
        });
        break;
      }
      case 'rotate': {
        anime({
          targets: wrap,
          opacity: [0, 1],
          rotate: [baseRot - 30, baseRot],
          scale: [0.7, 1],
          duration: baseDur,
          easing: 'back.out(1.6)'
        });
        break;
      }
      case 'blur': {
        anime({
          targets: wrap,
          opacity: [0, 1],
          filter: ['blur(24px)', 'blur(0px)'],
          translateY: [20, 0],
          duration: baseDur + 400,
          easing: 'easeOutCubic'
        });
        break;
      }
      case 'glitch': {
        // Glitch: 4 keyframes de opacidad + pequeños saltos.
        anime({
          targets: wrap,
          opacity: [0, 0.2, 1, 0.4, 1, 0.8, 1],
          translateX: [-6, 4, -2, 3, 0],
          scale: [0.9, 1.05, 0.98, 1],
          duration: 600,
          easing: 'steps(8)',
          complete: () => {
            anime({
              targets: wrap,
              opacity: 1,
              translateX: 0,
              scale: 1,
              duration: 200
            });
          }
        });
        // Encendemos el caret flicker permanente.
        word.classList.add('typo-glitch-active');
        break;
      }
      case 'split-chars': {
        // Dividimos el texto en spans por carácter.
        const text = event.text;
        word.innerHTML = '';
        const chars: HTMLElement[] = [];
        for (let i = 0; i < text.length; i++) {
          const span = document.createElement('span');
          span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
          span.style.display = 'inline-block';
          span.style.opacity = '0';
          word.appendChild(span);
          chars.push(span);
        }
        anime({
          targets: chars,
          opacity: [0, 1],
          translateY: [-30, 0],
          rotateZ: [12, 0],
          delay: anime.stagger(45),
          duration: 600,
          easing: 'easeOutCubic'
        });
        break;
      }
      case 'typewriter': {
        // Vamos revelando el texto carácter a carácter.
        const fullText = event.text;
        word.textContent = '';
        let i = 0;
        const interval = window.setInterval(() => {
          if (i >= fullText.length) {
            window.clearInterval(interval);
            return;
          }
          word.textContent = fullText.slice(0, i + 1);
          i += 1;
        }, 50);
        anime({
          targets: wrap,
          opacity: [0, 0.85],
          duration: 300,
          easing: 'easeOutQuad'
        });
        break;
      }
      default: {
        anime({
          targets: wrap,
          opacity: [0, 1],
          duration: baseDur,
          easing: 'easeOutQuad'
        });
      }
    }
  }

  /** Animación de salida. */
  private runExitAnimation(wrap: HTMLElement, event: TextEvent): void {
    const cat: TextCategory = event.category;
    const exitEffect: ExitEffect = event.exitEffect;

    switch (exitEffect) {
      case 'fade': {
        anime({
          targets: wrap,
          opacity: [1, 0],
          duration: 600,
          easing: 'easeInQuad',
          complete: () => wrap.remove()
        });
        break;
      }
      case 'scale-down': {
        anime({
          targets: wrap,
          opacity: [1, 0],
          scale: [1, 0.4],
          duration: 500,
          easing: 'easeInBack',
          complete: () => wrap.remove()
        });
        break;
      }
      case 'slide-up': {
        anime({
          targets: wrap,
          opacity: [1, 0],
          translateY: [0, -40],
          duration: 500,
          easing: 'easeInCubic',
          complete: () => wrap.remove()
        });
        break;
      }
      case 'dissolve': {
        anime({
          targets: wrap,
          opacity: [1, 0],
          filter: ['blur(0px)', 'blur(20px)'],
          scale: [1, 1.2],
          duration: 700,
          easing: 'easeInQuad',
          complete: () => wrap.remove()
        });
        break;
      }
      case 'burn': {
        // "Quemar": shake + flash rojo + desvanecer.
        anime({
          targets: wrap,
          opacity: [1, 0],
          translateX: [0, -3, 4, -2, 3, 0],
          filter: [
            'hue-rotate(0deg) brightness(1)',
            'hue-rotate(-20deg) brightness(2.4)'
          ],
          duration: 500,
          easing: 'easeInQuad',
          complete: () => wrap.remove()
        });
        // Acentuamos categoría volcánica en la salida.
        void cat;
        break;
      }
      default: {
        anime({
          targets: wrap,
          opacity: [1, 0],
          duration: 500,
          easing: 'easeInQuad',
          complete: () => wrap.remove()
        });
      }
    }
  }

  /** Espera asíncrona. */
  private wait(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}
