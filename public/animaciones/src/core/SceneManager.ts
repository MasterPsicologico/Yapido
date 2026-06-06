import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * SceneManager
 * ------------------------------------------------------------------
 * Núcleo gráfico del motor. Encapsula la creación del WebGLRenderer,
 * la cámara, la escena, los controles orbitales y el bucle principal
 * de renderizado. Este bucle es el ÚNICO reloj del sistema: cualquier
 * propiedad animada con GSAP se actualiza aquí dentro mediante el
 * `gsap.ticker`, garantizando sincronía en pantallas 120Hz/144Hz.
 *
 * Diseño:
 *  - Tone mapping ACES Filmic para resultados cinematográficos.
 *  - Sombras PCFSoftShadowMap (sombra suave, sin artefactos duros).
 *  - Loop manejado por `renderer.setAnimationLoop` (usa rAF internamente
 *    y se integra bien con XR / offscreen).
 *  - GSAP también se "ticks" aquí para mantener el reloj unificado.
 */
export class SceneManager {
  /** Elemento canvas del DOM. */
  public readonly canvas: HTMLCanvasElement;
  /** Renderer WebGL. */
  public readonly renderer: THREE.WebGLRenderer;
  /** Escena 3D raíz. */
  public readonly scene: THREE.Scene;
  /** Cámara perspectiva. */
  public readonly camera: THREE.PerspectiveCamera;
  /** Controles orbitales. */
  public readonly controls: OrbitControls;
  /** Reloj interno usado para FPS y métricas. */
  public readonly clock: THREE.Clock;
  /** Mezclador global para animaciones nativas de Blender. */
  public mixer: THREE.AnimationMixer | null = null;

  /** Contador de triángulos expuesto a la UI. */
  private triangleCount: number = 0;
  /** Conteo de objetos en la escena. */
  private objectCount: number = 0;
  /** Acumulador para cálculo de FPS por muestreo móvil. */
  private fpsAccumulator: number = 0;
  private fpsFrames: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;

  /** Callback de UI para refrescar stats (FPS / triángulos / objetos). */
  public onStatsUpdate: ((fps: number, tris: number, objs: number) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // ----- Renderer -----
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true // Necesario para poder descargar PNG / grabar video
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Sombras suaves (PCF = Percentage Closer Filtering).
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Tone mapping ACES Filmic: emula la respuesta del ojo humano, da
    // un look cinematográfico con buen manejo de altos rangos dinámicos.
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ----- Escena -----
    this.scene = new THREE.Scene();
    // Fondo con gradiente sutil — sensación de "espacio infinito".
    this.scene.background = new THREE.Color(0x05060a);
    this.scene.fog = new THREE.FogExp2(0x05060a, 0.012);

    // ----- Cámara -----
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(6, 4, 9);
    this.camera.lookAt(0, 0, 0);

    // ----- Controles orbitales -----
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 40;
    this.controls.maxPolarAngle = Math.PI * 0.95;

    // ----- Reloj -----
    this.clock = new THREE.Clock();

    // ----- Responsividad -----
    window.addEventListener('resize', this.handleResize);

    // Inicia el bucle principal de render.
    this.renderer.setAnimationLoop(this.tick);
  }

  /**
   * Bucle principal. Se ejecuta a la tasa nativa de refresco del
   * navegador (típicamente 60/120/144 Hz). Toda la lógica visual
   * (incluyendo el avance del AnimationMixer de Blender y del ticker
   * de GSAP) pasa por aquí para evitar relojes desincronizados.
   */
  private tick = (): void => {
    const deltaSeconds = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Avanza el mezclador de animaciones de Blender (si existe).
    if (this.mixer) {
      this.mixer.update(deltaSeconds);
    }

    // Actualiza los controles orbitales (requiere update() por damping).
    this.controls.update();

    // Render.
    this.renderer.render(this.scene, this.camera);

    // Métricas de FPS (muestreo cada ~500ms).
    this.fpsAccumulator += deltaSeconds;
    this.fpsFrames += 1;
    if (elapsed - this.lastFpsUpdate > 0.5) {
      this.currentFps = this.fpsFrames / this.fpsAccumulator;
      this.fpsAccumulator = 0;
      this.fpsFrames = 0;
      this.lastFpsUpdate = elapsed;
      this.notifyStats();
    }
  };

  /** Notifica a la UI las estadísticas en vivo. */
  private notifyStats(): void {
    if (this.onStatsUpdate) {
      this.onStatsUpdate(
        Math.round(this.currentFps),
        this.triangleCount,
        this.objectCount
      );
    }
  }

  /** Maneja el redimensionado de la ventana. */
  private handleResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  /**
   * Recorre toda la escena liberando VRAM de forma agresiva.
   * Esta es la clave para evitar fugas cuando el usuario presiona
   * "Comenzar Renderizado" varias veces seguidas.
   */
  public disposeScene(): void {
    this.scene.traverse((obj: THREE.Object3D) => {
      // Liberamos todas las mallas con geometría + materiales + texturas.
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        const mat = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) {
          mat.forEach((m) => this.disposeMaterial(m));
        } else if (mat) {
          this.disposeMaterial(mat);
        }
      }
      // Luces puntuales / direccionales / spot no consumen VRAM
      // pero las quitamos para que no se acumulen.
    });

    // Removemos todos los hijos de la escena.
    const toRemove: THREE.Object3D[] = [];
    this.scene.children.forEach((child) => toRemove.push(child));
    toRemove.forEach((child) => this.scene.remove(child));

    // Detenemos y soltamos el AnimationMixer.
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.scene);
      this.mixer = null;
    }

    // Reset de stats.
    this.triangleCount = 0;
    this.objectCount = 0;
    this.notifyStats();
  };

  /** Libera los recursos de un material (incluyendo texturas y mapas). */
  private disposeMaterial(material: THREE.Material): void {
    material.dispose();
    // Recorremos las propiedades del material para liberar texturas.
    const matWithMaps = material as unknown as Record<string, unknown>;
    for (const key in matWithMaps) {
      const value = matWithMaps[key];
      if (value && typeof value === 'object' && 'isTexture' in value) {
        const tex = value as THREE.Texture;
        if (tex.isTexture) tex.dispose();
      }
    }
  }

  /**
   * Suma triángulos a las stats recorriendo la escena.
   * Llamar tras construir la escena generativa.
   */
  public updateStats(): void {
    let tris = 0;
    let objs = 0;
    this.scene.traverse((obj) => {
      objs += 1;
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.geometry) {
        const index = mesh.geometry.index;
        if (index) {
          tris += index.count / 3;
        } else {
          const pos = mesh.geometry.getAttribute('position');
          if (pos) tris += pos.count / 3;
        }
      }
    });
    this.triangleCount = Math.round(tris);
    this.objectCount = objs;
    this.notifyStats();
  }

  /** Libera todos los recursos del manager. Llamar al cerrar la app. */
  public destroy(): void {
    this.renderer.setAnimationLoop(null);
    this.disposeScene();
    this.controls.dispose();
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
