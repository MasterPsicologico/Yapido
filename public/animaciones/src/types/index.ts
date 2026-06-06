/**
 * Tipos compartidos por todo el motor.
 * Mantener este archivo como única fuente de verdad tipada.
 */

/** Resultado del análisis semántico del prompt del usuario. */
export interface SemanticProfile {
  /** Paleta base en HSL (hue 0-360, sat 0-100, light 0-100). */
  readonly baseHue: number;
  /** Paleta secundaria en HSL. */
  readonly accentHue: number;
  /** Diferencia máxima de saturación permitida (sesgo cromático). */
  readonly saturationBias: number;
  /** Velocidad base de las animaciones (multiplicador 0.4 - 1.6). */
  readonly speed: number;
  /** Rugosidad global de los materiales (0 espejo, 1 mate). */
  readonly roughness: number;
  /** Metalicidad global (0 dieléctrico, 1 metálico). */
  readonly metalness: number;
  /** Tipo de forma dominante. */
  readonly form: 'curved' | 'angular' | 'mixed';
  /** Densidad del sistema de partículas (0-1). */
  readonly particleDensity: number;
  /** Intensidad de las luces (0-1). */
  readonly lightIntensity: number;
  /** Si la escena se considera cyberpunk. */
  readonly isCyberpunk: boolean;
  /** Si la escena se considera orgánica. */
  readonly isOrganic: boolean;
  /** Si la escena se considera etérea / cristal. */
  readonly isEthereal: boolean;
  /** Si la escena se considera volcánica / fuego. */
  readonly isVolcanic: boolean;
}

/** Resultado de generar la escena. Se usa para export JSON. */
export interface GenerativeRecipe {
  readonly id: string;
  readonly timestamp: number;
  readonly prompt: string;
  readonly profile: SemanticProfile;
  readonly seed: number;
  readonly camera: {
    readonly startPosition: { x: number; y: number; z: number };
    readonly keyframes: ReadonlyArray<{
      readonly t: number;
      readonly position: { x: number; y: number; z: number };
      readonly lookAt: { x: number; y: number; z: number };
      readonly easing: string;
    }>;
  };
  readonly lights: ReadonlyArray<{
    readonly type: 'directional' | 'point' | 'spot';
    readonly color: string;
    readonly intensity: number;
    readonly position: { x: number; y: number; z: number };
  }>;
  readonly particles: {
    readonly count: number;
    readonly hue: number;
    readonly size: number;
  };
  readonly materials: ReadonlyArray<{
    readonly name: string;
    readonly color: string;
    readonly metalness: number;
    readonly roughness: number;
    readonly emissiveIntensity: number;
  }>;
  readonly modelSource: 'procedural' | string;
}

/** Loader DRACO y base path para los decoders. */
export interface DracoConfig {
  readonly decoderPath: string;
}
