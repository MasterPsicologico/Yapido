import './style.css';

import { SceneManager } from './core/SceneManager';
import { ModelLoader } from './core/ModelLoader';
import { GenerativeEngine } from './core/GenerativeEngine';
import { Textualizer } from './core/Textualizer';
import { SemanticMapper } from './utils/SemanticMapper';
import { UIManager } from './ui/UIManager';
import { Downloader } from './utils/Downloader';
import type { SemanticProfile } from './types';

/**
 * Punto de entrada. Construye todas las dependencias del motor y las
 * interconecta. Sigue el principio de inyección de dependencias: cada
 * módulo recibe solo lo que necesita.
 */
function bootstrap(): void {
  // 1. Lienzo 3D.
  const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    // eslint-disable-next-line no-console
    console.error('No se encontró el elemento #webgl-canvas en el DOM.');
    return;
  }

  // 2. Núcleo gráfico.
  const sceneManager = new SceneManager(canvas);

  // 3. Cargador de modelos (Blender).
  const modelLoader = new ModelLoader();

  // 4. Mapeador semántico.
  const semanticMapper = new SemanticMapper();

  // 5. Motor generativo.
  const generativeEngine = new GenerativeEngine(sceneManager, modelLoader, semanticMapper);

  // 6. Generador tipográfico (kinetic typography).
  const textualizer = new Textualizer();

  // 7. Downloader.
  const downloader = new Downloader(sceneManager);

  // Estado compartido para la sincronía texto↔3D.
  let lastProfile: SemanticProfile | null = null;
  let lastSeed: number = 0;

  // 8. UI Manager (con sus callbacks). Lo construimos primero para
  //    poder inyectarlo en el downloader.onProgress.
  const uiManager = new UIManager({
    onRenderRequested: async (idea: string) => {
      // Limpiamos cualquier tipografía previa.
      uiManager.clearTypography();

      // Mientras el motor trabaja, actualizamos los textos del escaneo.
      uiManager.setScanText('Limpiando VRAM previa…');
      await wait(180);
      uiManager.setScanText('Analizando prompt semántico…');
      await wait(180);
      uiManager.setScanText('Generando geometría procedural…');
      await wait(220);
      uiManager.setScanText('Calibrando luces y atmósfera…');
      await wait(180);
      uiManager.setScanText('Orquestando coreografía GSAP…');
      await wait(180);

      // Renderizamos la escena 3D (sin pasarle seed nuevo → mantiene PRNG).
      await generativeEngine.iniciarRenderizadoGenerativo(idea);

      // Tras renderizar: capturamos perfil + seed para sincronizar la tipografía.
      const recipe = generativeEngine.lastRecipe;
      if (recipe) {
        lastProfile = recipe.profile;
        lastSeed = recipe.seed;
      }

      // Generamos y reproducimos la coreografía tipográfica.
      if (lastProfile) {
        const script = textualizer.generate(idea, lastProfile, lastSeed);
        uiManager.playTypographicSequence(script);
      }

      // Tras renderizar: habilitamos descargas y mostramos hint de scroll.
      uiManager.enableDownloads();
      uiManager.showScrollHint();
    },
    onDownloadWebM: async () => {
      uiManager.showDownloadProgress();
      try {
        await downloader.downloadWebM(5, `animacion-${Date.now()}.webm`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error al grabar WebM:', err);
      } finally {
        window.setTimeout(() => uiManager.hideDownloadProgress(), 600);
      }
    },
    onDownloadPNG: () => {
      uiManager.showDownloadProgress();
      try {
        downloader.downloadPNG(`render-${Date.now()}.png`);
      } finally {
        window.setTimeout(() => uiManager.hideDownloadProgress(), 600);
      }
    },
    onDownloadRecipe: () => {
      if (!generativeEngine.lastRecipe) {
        // eslint-disable-next-line no-console
        console.warn('Aún no hay receta para exportar.');
        return;
      }
      uiManager.showDownloadProgress();
      try {
        downloader.downloadRecipe(generativeEngine.lastRecipe);
      } finally {
        window.setTimeout(() => uiManager.hideDownloadProgress(), 600);
      }
    },
    /**
     * Click en una palabra interactiva de la tipografía cinética.
     * Re-renderizamos la escena 3D usando esa palabra como nuevo prompt
     * y luego regeneramos el guion tipográfico.
     */
    onTypoWordClick: (word: string) => {
      // Actualizamos el textarea para feedback visual.
      uiManager.setIdeaValue(word);
      // Re-renderizamos con la palabra.
      void uiManager.triggerRenderWithIdea(word);
    }
  });

  downloader.onProgress = (percent) => uiManager.setDownloadProgress(percent);

  // 9. Conexión de stats en vivo a la UI.
  sceneManager.onStatsUpdate = (fps, tris, objs) => {
    uiManager.updateStats(fps, tris, objs);
  };

  // 10. Renderizado inicial: una "escena bienvenida" sutil.
  generativeEngine.iniciarRenderizadoGenerativo('Bienvenida · cristal etéreo', {
    seed: 123456
  }).then(() => {
    const recipe = generativeEngine.lastRecipe;
    if (recipe) {
      lastProfile = recipe.profile;
      lastSeed = recipe.seed;
      const script = textualizer.generate('Bienvenida · cristal etéreo', recipe.profile, recipe.seed);
      uiManager.playTypographicSequence(script);
    }
    uiManager.enableDownloads();
    uiManager.showScrollHint();
  });

  // 11. Exposición de depuración.
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__motor3d = {
      sceneManager,
      modelLoader,
      generativeEngine,
      textualizer,
      downloader,
      uiManager
    };
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

// El DOM ya está listo al cargar este módulo (script tipo módulo se
// ejecuta después del parseo del HTML), pero por si se inyecta tarde:
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
