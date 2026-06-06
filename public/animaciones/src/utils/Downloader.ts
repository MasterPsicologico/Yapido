import type { SceneManager } from '../core/SceneManager';
import type { GenerativeRecipe } from '../types';

/**
 * Downloader
 * ------------------------------------------------------------------
 * Se encarga de exportar el resultado de la escena 3D a formatos
 * utilizables fuera del navegador. Soporta:
 *  - PNG: fotograma instantáneo del canvas.
 *  - WebM: video corto (5 segundos por defecto) capturado con
 *    MediaRecorder + canvas.captureStream(). Perfecto para usar
 *    la animación en redes, presentaciones, etc.
 *  - JSON: receta reproducible (mismo seed → misma escena).
 */
export class Downloader {
  private readonly sceneManager: SceneManager;
  /** Callback para reportar progreso (0-100). */
  public onProgress: ((percent: number) => void) | null = null;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  /**
   * Descarga un PNG del frame actual.
   * Requiere que el renderer se haya creado con `preserveDrawingBuffer: true`.
   */
  public downloadPNG(filename: string = 'render.png'): void {
    this.reportProgress(15);
    const canvas = this.sceneManager.canvas;
    // Forzamos un render antes de capturar (asegura que el buffer
    // contiene la última imagen aunque el navegador lo haya limpiado).
    this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
    this.reportProgress(45);

    canvas.toBlob((blob) => {
      if (!blob) {
        // eslint-disable-next-line no-console
        console.error('Downloader: no se pudo generar el PNG.');
        this.reportProgress(0);
        return;
      }
      this.reportProgress(85);
      this.saveBlob(blob, filename);
      this.reportProgress(100);
    }, 'image/png');
  }

  /**
   * Graba un video WebM del canvas y lo descarga al terminar.
   * @param durationSeconds Duración de la grabación.
   * @param filename Nombre del archivo de salida.
   */
  public async downloadWebM(
    durationSeconds: number = 5,
    filename: string = 'animacion.webm'
  ): Promise<void> {
    const canvas = this.sceneManager.canvas;

    // Stream del canvas a 60 fps.
    const stream = canvas.captureStream(60);

    // Codec preferido (VP9 → VP8 → genérico).
    const mimeCandidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? 'video/webm';

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    return new Promise<void>((resolve) => {
      recorder.onstop = () => {
        this.reportProgress(90);
        const blob = new Blob(chunks, { type: mimeType });
        this.saveBlob(blob, filename);
        this.reportProgress(100);
        resolve();
      };

      recorder.start(100);
      this.reportProgress(10);

      // Anima el progreso en función del tiempo transcurrido.
      const startedAt = performance.now();
      const interval = window.setInterval(() => {
        const elapsed = (performance.now() - startedAt) / 1000;
        const percent = Math.min(85, (elapsed / durationSeconds) * 85);
        this.reportProgress(percent);
      }, 100);

      window.setTimeout(() => {
        window.clearInterval(interval);
        recorder.stop();
        // Detenemos todas las pistas del stream.
        stream.getTracks().forEach((t) => t.stop());
      }, durationSeconds * 1000);
    });
  }

  /** Descarga la receta en JSON. */
  public downloadRecipe(recipe: GenerativeRecipe, filename?: string): void {
    this.reportProgress(30);
    const json = JSON.stringify(recipe, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.reportProgress(80);
    this.saveBlob(blob, filename ?? `receta-${recipe.id}.json`);
    this.reportProgress(100);
  }

  /** Helper: dispara la descarga de un Blob. */
  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Liberamos la URL en el siguiente tick.
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  /** Reporta progreso al callback (si existe). */
  private reportProgress(percent: number): void {
    if (this.onProgress) this.onProgress(percent);
  }
}
