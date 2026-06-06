import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * ModelLoader
 * ------------------------------------------------------------------
 * Encargado de cargar modelos exportados desde Blender en formato
 * .gltf o .glb. Aplica automáticamente:
 *  - Compresión DRACO si el archivo fue exportado con Draco.
 *  - Activación de sombras en cada Mesh (castShadow + receiveShadow).
 *  - Aislaminento del AnimationMixer para reproducir animaciones
 *    nativas exportadas desde Blender (Action Editor / Dope Sheet).
 *
 * Esta clase NO crea geometría procedural: se centra solo en el
 * pipeline de assets. La inyección procedural la hace GenerativeEngine.
 */
export class ModelLoader {
  /** Instancia configurada de GLTFLoader. */
  private readonly gltfLoader: GLTFLoader;
  /** Decodificador DRACO (compresión de geometría). */
  private readonly dracoLoader: DRACOLoader;
  /** URL del último modelo cargado (para export en receta). */
  public lastLoadedUrl: string | null = null;

  /**
   * @param dracoDecoderPath Ruta donde Vite sirve los decoders DRACO
   *   (por defecto apunta a three/examples). En este proyecto asumimos
   *   que el loader ya incluye los decoders vía three/examples/jsm.
   */
  constructor(dracoDecoderPath: string = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/') {
    // DRACO primero.
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(dracoDecoderPath);
    this.dracoLoader.setDecoderConfig({ type: 'js' });

    // GLTFLoader con DRACO precargado.
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }

  /**
   * Carga un modelo desde una URL y devuelve la raíz del grafo de
   * escena. Activa sombras, escala uniforme y devuelve el AnimationMixer
   * si el archivo trae AnimationClips.
   *
   * @param url URL del archivo .glb / .gltf
   * @returns Promise<{ root: THREE.Group; mixer: THREE.AnimationMixer | null; clips: THREE.AnimationClip[] }>
   */
  public async loadModel(url: string): Promise<ModelLoadResult> {
    return new Promise<ModelLoadResult>((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf: GLTF) => {
          try {
            const root = gltf.scene as THREE.Group;

            // Aplicamos sombras recursivamente a cada Mesh.
            root.traverse((obj: THREE.Object3D) => {
              const mesh = obj as THREE.Mesh;
              if (mesh.isMesh) {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                // Aseguramos que el material sea PBR-friendly y responda a luces.
                if (mesh.material) {
                  const mat = mesh.material as THREE.MeshStandardMaterial;
                  if (mat.isMeshStandardMaterial) {
                    mat.needsUpdate = true;
                  }
                }
              }
            });

            // Calculamos la caja envolvente para centrar y escalar.
            const box = new THREE.Box3().setFromObject(root);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            // Centramos en el origen.
            root.position.x -= center.x;
            root.position.y -= center.y;
            root.position.z -= center.z;
            // Normalizamos escala a ~3 unidades para encajar en cámara.
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
              const targetSize = 3.0;
              const scale = targetSize / maxDim;
              root.scale.setScalar(scale);
            }

            // Mixer para animaciones nativas.
            let mixer: THREE.AnimationMixer | null = null;
            const clips = gltf.animations ?? [];
            if (clips.length > 0) {
              mixer = new THREE.AnimationMixer(root);
            }

            this.lastLoadedUrl = url;

            resolve({
              root,
              mixer,
              clips
            });
          } catch (err) {
            reject(err);
          }
        },
        undefined,
        (err: unknown) => reject(err)
      );
    });
  }

  /**
   * Reproduce una animación específica del modelo cargado.
   * @param mixer AnimationMixer devuelto por loadModel().
   * @param clip AnimationClip a reproducir.
   * @param loop Si debe reproducirse en bucle.
   */
  public playClip(
    mixer: THREE.AnimationMixer,
    clip: THREE.AnimationClip,
    loop: boolean = true
  ): THREE.AnimationAction {
    const action = mixer.clipAction(clip);
    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.play();
    return action;
  }

  /** Libera los recursos del loader. */
  public dispose(): void {
    this.dracoLoader.dispose();
  }
}

/** Resultado estructurado de una carga de modelo. */
export interface ModelLoadResult {
  root: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  clips: THREE.AnimationClip[];
}
