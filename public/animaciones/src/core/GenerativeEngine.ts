import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { SceneManager } from './SceneManager';
import type { ModelLoader, ModelLoadResult } from './ModelLoader';
import type { SemanticMapper } from '../utils/SemanticMapper';
import type { GenerativeRecipe, SemanticProfile } from '../types';

gsap.registerPlugin(ScrollTrigger);

/** Datos opcionales para cargar un modelo Blender en lugar de procedural. */
export interface GenerativeEngineOptions {
  /** URL del modelo Blender a cargar (opcional). */
  modelUrl?: string;
  /** Semilla PRNG (opcional). */
  seed?: number;
  /** Si se debe reproducir una animación nativa del modelo. */
  playAnimation?: number;
}

/** Estructura interna mutable de luces (para push interno). */
type MutableLight = {
  type: 'directional' | 'point' | 'spot';
  color: string;
  intensity: number;
  position: { x: number; y: number; z: number };
};
/** Estructura interna mutable de materiales. */
type MutableMaterial = {
  name: string;
  color: string;
  metalness: number;
  roughness: number;
  emissiveIntensity: number;
};

/**
 * GenerativeEngine
 * ------------------------------------------------------------------
 * Cerebro procedural. Se encarga de:
 *  1. Limpiar la VRAM con la mayor agresividad posible.
 *  2. Cargar un modelo Blender (o generar uno procedural).
 *  3. Inyectar partículas, luces y materiales.
 *  4. Coreografiar la cámara con GSAP y vincular ScrollTrigger.
 *  5. Exponer una receta JSON reproducible.
 */
export class GenerativeEngine {
  /** Escena gestionada. */
  private readonly sceneManager: SceneManager;
  /** Cargador de modelos. */
  private readonly modelLoader: ModelLoader;
  /** Mapeador semántico. */
  private readonly semanticMapper: SemanticMapper;

  /** Timeline de GSAP activo (lo mantenemos para poder matarlo). */
  private currentTimeline: gsap.core.Timeline | null = null;
  /** Triggers de Scroll activos. */
  private scrollTriggers: ScrollTrigger[] = [];

  /** Última receta generada. */
  public lastRecipe: GenerativeRecipe | null = null;
  /** Grupo principal con todos los elementos procedurales (para scroll). */
  private proceduralGroup: THREE.Group = new THREE.Group();

  constructor(
    sceneManager: SceneManager,
    modelLoader: ModelLoader,
    semanticMapper: SemanticMapper
  ) {
    this.sceneManager = sceneManager;
    this.modelLoader = modelLoader;
    this.semanticMapper = semanticMapper;
  }

  /**
   * Punto de entrada principal. Orquesta todo el ciclo de vida
   * de un renderizado generativo.
   */
  public async iniciarRenderizadoGenerativo(
    ideaUsuario: string,
    options: GenerativeEngineOptions = {}
  ): Promise<void> {
    // 1. ANÁLISIS SEMÁNTICO — lo primero, alimenta todo lo demás.
    const profile = this.semanticMapper.analyze(ideaUsuario, options.seed);

    // 2. LIMPIEZA AGRESIVA DE VRAM (mata timelines, libera mallas, etc).
    this.disposePreviousRender();

    // 3. CREACIÓN DEL NUEVO GRUPO.
    this.proceduralGroup = new THREE.Group();
    this.proceduralGroup.name = 'ProceduralRoot';
    this.sceneManager.scene.add(this.proceduralGroup);

    // 4. CARGA DEL MODELO (Blender o procedural de respaldo).
    let modelResult: ModelLoadResult | null = null;
    if (options.modelUrl) {
      try {
        modelResult = await this.modelLoader.loadModel(options.modelUrl);
        this.proceduralGroup.add(modelResult.root);
        if (modelResult.mixer) {
          this.sceneManager.mixer = modelResult.mixer;
        }
      } catch (err) {
        // Si falla, caemos al procedural.
        // eslint-disable-next-line no-console
        console.warn('No se pudo cargar el modelo, usando fallback procedural:', err);
        modelResult = null;
      }
    }
    if (!modelResult) {
      this.injectProceduralFallback(profile);
    }

    // 4.5 Si hay modelo y se pidió animación, la iniciamos.
    if (modelResult && modelResult.mixer && options.playAnimation !== undefined) {
      const clip = modelResult.clips[options.playAnimation];
      if (clip) {
        this.modelLoader.playClip(modelResult.mixer, clip, true);
      }
    }

    // 5. INYECCIÓN PROCEDURAL: partículas, luces, atmósfera.
    const lights = this.injectLightsAndAtmosphere(profile);
    const particlesData = this.injectParticles(profile);

    // 6. MATERIALES: tweak global sobre todos los meshes existentes.
    const materialsData = this.applyMaterialProfile(profile);

    // 7. COREOGRAFÍA GSAP de cámara.
    const cameraRecipe = this.choreographCamera(profile);

    // 8. SCROLL TRIGGER: la materia reacciona al scroll.
    this.bindScrollToMaterials(profile);

    // 9. ACTUALIZAR ESTADÍSTICAS de la UI.
    this.sceneManager.updateStats();

    // 10. CONSTRUIR RECETA reproducible.
    this.lastRecipe = {
      id: this.generateId(),
      timestamp: Date.now(),
      prompt: ideaUsuario,
      profile,
      seed: options.seed ?? Date.now(),
      camera: cameraRecipe,
      lights,
      particles: particlesData,
      materials: materialsData,
      modelSource: options.modelUrl ?? 'procedural'
    };
  }

  /** Limpia el renderizado previo: libera mallas, mata timelines. */
  private disposePreviousRender(): void {
    // 1) Matar timelines + scrolltriggers.
    if (this.currentTimeline) {
      this.currentTimeline.kill();
      this.currentTimeline = null;
    }
    this.scrollTriggers.forEach((st) => st.kill());
    this.scrollTriggers = [];

    // 2) Limpieza profunda de la escena.
    this.sceneManager.disposeScene();

    // 3) Reset del group procedural.
    this.proceduralGroup = new THREE.Group();
  }

  /**
   * Fallback procedural: si no se carga modelo Blender, generamos
   * un objeto interesante con primitivas según el perfil.
   */
  private injectProceduralFallback(profile: SemanticProfile): void {
    const rng = this.makeRng(Math.floor(profile.baseHue * 1000));
    const group = new THREE.Group();
    group.name = 'ProceduralModel';

    // Construimos una "figura hero" combinando primitivas.
    const figureType = Math.floor(rng() * 4);
    const baseMat = this.makeStandardMaterial(profile, 0);

    if (figureType === 0) {
      // Esfera icosaédrica (orgánica o etérea).
      const geo = new THREE.IcosahedronGeometry(1.2, 3);
      const mesh = new THREE.Mesh(geo, baseMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    } else if (figureType === 1) {
      // TorusKnot (cyberpunk / volcánico).
      const geo = new THREE.TorusKnotGeometry(0.9, 0.3, 220, 32);
      const mesh = new THREE.Mesh(geo, baseMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    } else if (figureType === 2) {
      // Octaedro facetado.
      const geo = new THREE.OctahedronGeometry(1.3, 0);
      const mesh = new THREE.Mesh(geo, baseMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    } else {
      // Cluster de cubos (cyberpunk).
      for (let i = 0; i < 7; i++) {
        const s = 0.5 + rng() * 0.4;
        const geo = new THREE.BoxGeometry(s, s, s);
        const mat = this.makeStandardMaterial(profile, i);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (rng() - 0.5) * 2.5,
          (rng() - 0.5) * 2.5,
          (rng() - 0.5) * 2.5
        );
        mesh.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      }
    }

    this.proceduralGroup.add(group);
  }

  /** Inyecta luces direccionales, puntuales y spot. */
  private injectLightsAndAtmosphere(profile: SemanticProfile): GenerativeRecipe['lights'] {
    const rng = this.makeRng(Math.floor(profile.baseHue * 100) + 7);
    const baseColor = new THREE.Color().setHSL(profile.baseHue / 360, profile.saturationBias, 0.5);
    const accentColor = new THREE.Color().setHSL(profile.accentHue / 360, profile.saturationBias, 0.55);

    const lights: MutableLight[] = [];

    // ----- Key light (direccional, sombras dramáticas) -----
    const keyLight = new THREE.DirectionalLight(baseColor.getHex(), profile.lightIntensity * 1.2);
    keyLight.position.set(6, 8, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0005;
    this.proceduralGroup.add(keyLight);
    lights.push({
      type: 'directional',
      color: '#' + baseColor.getHexString(),
      intensity: profile.lightIntensity * 1.2,
      position: { x: keyLight.position.x, y: keyLight.position.y, z: keyLight.position.z }
    });

    // ----- Rim light (contraluz) -----
    const rimLight = new THREE.PointLight(accentColor.getHex(), profile.lightIntensity * 1.5, 18, 1.4);
    rimLight.position.set(-5, 3, -4);
    this.proceduralGroup.add(rimLight);
    lights.push({
      type: 'point',
      color: '#' + accentColor.getHexString(),
      intensity: profile.lightIntensity * 1.5,
      position: { x: rimLight.position.x, y: rimLight.position.y, z: rimLight.position.z }
    });

    // ----- Luces spot aleatorias para dramatismo -----
    const spotCount = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < spotCount; i++) {
      const useAccent = rng() < 0.5;
      const color = useAccent ? accentColor : baseColor;
      const intensity = profile.lightIntensity * (0.6 + rng() * 0.6);
      const spot = new THREE.SpotLight(
        color.getHex(),
        intensity,
        12,
        Math.PI / 5,
        0.5,
        1.5
      );
      spot.position.set(
        (rng() - 0.5) * 10,
        4 + rng() * 4,
        (rng() - 0.5) * 10
      );
      spot.castShadow = true;
      spot.shadow.mapSize.set(512, 512);
      spot.target.position.set(0, 0, 0);
      this.proceduralGroup.add(spot);
      this.proceduralGroup.add(spot.target);
      lights.push({
        type: 'spot',
        color: '#' + color.getHexString(),
        intensity,
        position: { x: spot.position.x, y: spot.position.y, z: spot.position.z }
      });
    }

    // ----- Ambient suave para evitar negros absolutos -----
    const ambient = new THREE.AmbientLight(0x202836, 0.4);
    this.proceduralGroup.add(ambient);

    // Congelamos el array en readonly para cumplir el contrato de GenerativeRecipe.
    return lights.map((l): GenerativeRecipe['lights'][number] => ({
      type: l.type,
      color: l.color,
      intensity: l.intensity,
      position: { x: l.position.x, y: l.position.y, z: l.position.z }
    }));
  }

  /** Genera un sistema de partículas con THREE.Points. */
  private injectParticles(profile: SemanticProfile): GenerativeRecipe['particles'] {
    const rng = this.makeRng(Math.floor(profile.accentHue * 100) + 13);
    const count = Math.floor(800 * profile.particleDensity);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const baseColor = new THREE.Color().setHSL(profile.baseHue / 360, profile.saturationBias, 0.6);
    const accentColor = new THREE.Color().setHSL(profile.accentHue / 360, profile.saturationBias, 0.7);

    for (let i = 0; i < count; i++) {
      // Distribución esférica con jitter.
      const r = 4 + rng() * 6;
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const useAccent = rng() < 0.5;
      const c = useAccent ? accentColor : baseColor;
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Textura procedural para los puntos: un canvas radial.
    const texture = this.makeRadialTexture();

    const material = new THREE.PointsMaterial({
      size: 0.06 + profile.particleDensity * 0.05,
      map: texture,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'ParticleSystem';
    this.proceduralGroup.add(points);

    // Animamos la rotación lenta del sistema de partículas.
    gsap.to(points.rotation, {
      y: Math.PI * 2,
      duration: 60 / profile.speed,
      repeat: -1,
      ease: 'none'
    });

    return {
      count,
      hue: profile.accentHue,
      size: material.size
    };
  }

  /** Crea una textura radial procedural (canvas) para partículas. */
  private makeRadialTexture(): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.4, 'rgba(255,255,255,0.4)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, size, size);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  /** Aplica el perfil de material a todos los meshes del grupo. */
  private applyMaterialProfile(profile: SemanticProfile): GenerativeRecipe['materials'] {
    const materials: MutableMaterial[] = [];
    const baseColor = new THREE.Color().setHSL(profile.baseHue / 360, profile.saturationBias, 0.55);
    const accentColor = new THREE.Color().setHSL(profile.accentHue / 360, profile.saturationBias, 0.6);

    this.proceduralGroup.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.isMeshStandardMaterial) {
          mat.color = baseColor;
          mat.roughness = profile.roughness;
          mat.metalness = profile.metalness;
          mat.emissive = accentColor;
          mat.emissiveIntensity = profile.isEthereal ? 0.4 : 0.15;
          mat.envMapIntensity = 1.0;
          mat.needsUpdate = true;
          materials.push({
            name: mesh.name || `mat_${materials.length}`,
            color: '#' + baseColor.getHexString(),
            metalness: profile.metalness,
            roughness: profile.roughness,
            emissiveIntensity: mat.emissiveIntensity
          });
        }
      }
    });

    return materials.map((m): GenerativeRecipe['materials'][number] => ({
      name: m.name,
      color: m.color,
      metalness: m.metalness,
      roughness: m.roughness,
      emissiveIntensity: m.emissiveIntensity
    }));
  }

  /** Crea un material PBR según el perfil. */
  private makeStandardMaterial(profile: SemanticProfile, variant: number): THREE.MeshStandardMaterial {
    const baseColor = new THREE.Color().setHSL(profile.baseHue / 360, profile.saturationBias, 0.5 + (variant * 0.05));
    const emissive = new THREE.Color().setHSL(profile.accentHue / 360, profile.saturationBias, 0.5);
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: profile.roughness,
      metalness: profile.metalness,
      emissive,
      emissiveIntensity: profile.isEthereal ? 0.5 : 0.2,
      envMapIntensity: 1.0
    });
  }

  /** Crea la coreografía de cámara (keyframes + GSAP timeline). */
  private choreographCamera(profile: SemanticProfile): GenerativeRecipe['camera'] {
    const rng = this.makeRng(Math.floor(profile.baseHue * 50) + 41);
    const easings = ['power1.inOut', 'power2.inOut', 'power3.inOut', 'power4.inOut', 'elastic.out', 'back.out', 'sine.inOut'];
    interface CameraKeyframe {
      t: number;
      position: THREE.Vector3;
      lookAt: THREE.Vector3;
      easing: string;
    }
    const keyframes: CameraKeyframe[] = [];

    const startPos = this.sceneManager.camera.position.clone();
    keyframes.push({
      t: 0,
      position: startPos.clone(),
      lookAt: new THREE.Vector3(0, 0, 0),
      easing: 'none'
    });

    // 4 keyframes aleatorios para una órbita cinemática.
    for (let i = 0; i < 4; i++) {
      const angle = (i + 1) * (Math.PI * 2 / 4) + rng() * 0.6;
      const radius = 6 + rng() * 4;
      const height = (rng() - 0.5) * 4;
      const pos = new THREE.Vector3(
        Math.cos(angle) * radius,
        height + 2,
        Math.sin(angle) * radius
      );
      const lookAt = new THREE.Vector3(
        (rng() - 0.5) * 1.5,
        (rng() - 0.5) * 1.5,
        (rng() - 0.5) * 1.5
      );
      keyframes.push({
        t: (i + 1) * 2.5,
        position: pos,
        lookAt,
        easing: easings[Math.floor(rng() * easings.length)] ?? 'power2.inOut'
      });
    }

    // Timeline GSAP.
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    for (let i = 1; i < keyframes.length; i++) {
      const kf = keyframes[i];
      if (!kf) continue;
      const dur = (kf.t - keyframes[i - 1]!.t) / profile.speed;
      tl.to(this.sceneManager.camera.position, {
        x: kf.position.x,
        y: kf.position.y,
        z: kf.position.z,
        duration: dur,
        ease: kf.easing
      });
      tl.to(this.sceneManager.controls.target, {
        x: kf.lookAt.x,
        y: kf.lookAt.y,
        z: kf.lookAt.z,
        duration: dur,
        ease: kf.easing
      }, '<');
    }

    this.currentTimeline = tl;

    return {
      startPosition: { x: startPos.x, y: startPos.y, z: startPos.z },
      keyframes: keyframes.map((kf) => ({
        t: kf.t,
        position: { x: kf.position.x, y: kf.position.y, z: kf.position.z },
        lookAt: { x: kf.lookAt.x, y: kf.lookAt.y, z: kf.lookAt.z },
        easing: kf.easing
      }))
    };
  }

  /**
   * Vincula ScrollTrigger para que al hacer scroll, los materiales
   * cambien su metalicidad y la cámara se acerque/aleje.
   */
  private bindScrollToMaterials(profile: SemanticProfile): void {
    // Materiales: al avanzar el scroll, aumenta metalness y baja roughness.
    const st1 = ScrollTrigger.create({
      trigger: '.scroll-spacer',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        this.proceduralGroup.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh && mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat.isMeshStandardMaterial) {
              // El metal se vuelve espejo, el cristal cambia refracción.
              mat.metalness = Math.min(1, profile.metalness + p * 0.8);
              mat.roughness = Math.max(0, profile.roughness - p * 0.7);
              mat.emissiveIntensity = (profile.isEthereal ? 0.4 : 0.15) + p * 0.6;
              mat.needsUpdate = false;
            }
          }
        });
      }
    });
    this.scrollTriggers.push(st1);

    // Cámara: zoom dramático en el centro de la escena.
    const st2 = ScrollTrigger.create({
      trigger: '.scroll-spacer',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (self) => {
        // Mantenemos la cámara sobre su órbita pero acercamos el target.
        const p = self.progress;
        const cam = this.sceneManager.camera;
        // Reducimos la distancia multiplicando por (1 - 0.5 * p).
        const currentDistance = cam.position.length();
        const targetDistance = currentDistance * (1 - 0.45 * p);
        cam.position.setLength(targetDistance);
      }
    });
    this.scrollTriggers.push(st2);
  }

  /** PRNG Mulberry32 (misma implementación que SemanticMapper). */
  private makeRng(seed: number): () => number {
    let a = seed >>> 0;
    return function (): number {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Genera un ID corto alfanumérico. */
  private generateId(): string {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
}
