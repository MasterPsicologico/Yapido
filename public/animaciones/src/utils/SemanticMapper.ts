import type { SemanticProfile } from '../types';

/** Tipo unión con las 4 categorías semánticas soportadas. */
type SemanticCategory = 'cyberpunk' | 'organic' | 'ethereal' | 'volcanic';

/**
 * SemanticMapper
 * ------------------------------------------------------------------
 * Convierte una idea textual del usuario en un perfil semántico
 * numérico. Es el "puente" entre el lenguaje humano y la matemática
 * de la generación procedural. Se basa en:
 *  - Diccionario bilingüe (ES/EN) de palabras clave.
 *  - Sistema de ponderación: cada coincidencia acumula "peso" sobre
 *    un eje (cyberpunk, orgánico, etéreo, volcánico).
 *  - En ausencia de matches relevantes, recurre a un generador
 *    pseudoaleatorio (PRNG sembrado) para mantener la impredecibilidad.
 *
 * Implementación: PRNG Mulberry32 para permitir reproducibilidad
 * cuando se exporta la receta.
 */
export class SemanticMapper {
  /** Tipos literales de las categorías semánticas. */
  private static readonly CATEGORIES: ReadonlyArray<SemanticCategory> = ['cyberpunk', 'organic', 'ethereal', 'volcanic'];

  /** Palabras clave agrupadas por "estética objetivo". */
  private static readonly KEYWORDS: Record<SemanticCategory, ReadonlyArray<string>> = {
    cyberpunk: [
      'cyberpunk', 'neon', 'neón', 'cibernetico', 'cibernético', 'futurista',
      'futuro', 'matrix', 'holograma', 'digital', 'tecnologia', 'tecnología',
      'robot', 'ia', 'android', 'ciber', 'tech', 'wireframe', 'glitch',
      'pantalla', 'circuito', 'chip', 'cyber'
    ],
    organic: [
      'organico', 'orgánico', 'natural', 'planta', 'flor', 'bosque', 'selva',
      'arbol', 'árbol', 'hoja', 'serpiente', 'raiz', 'raíz', 'coral',
      'biologico', 'biológico', 'vida', 'mushroom', 'hongo', 'naturaleza',
      'jungla', 'crecimiento', 'micelio', 'microscopic', 'microscopico'
    ],
    ethereal: [
      'etereo', 'etérea', 'cristal', 'glass', 'cristalino', 'cristales',
      'luz', 'luces', 'fantasma', 'mistico', 'místico', 'magico', 'mágico',
      'angelical', 'celestial', 'aura', 'spirit', 'espiritu', 'espíritu',
      'hielo', 'ice', 'glass', 'water', 'agua', 'transparente'
    ],
    volcanic: [
      'volcan', 'volcán', 'lava', 'fuego', 'fire', 'magma', 'infernal',
      'demoniaco', 'demoníaco', 'hell', 'infierno', 'rojo', 'brasas',
      'ceniza', 'ash', 'dark', 'oscuro', 'negro', 'metal', 'heavy'
    ]
  };

  /** Pesos acumulados durante el análisis. */
  private scores: Record<SemanticCategory, number> = { cyberpunk: 0, organic: 0, ethereal: 0, volcanic: 0 };

  /**
   * Analiza un prompt y devuelve un perfil semántico.
   * @param prompt Texto libre del usuario.
   * @param seed Semilla PRNG (opcional). Si se omite, usa Date.now().
   */
  public analyze(prompt: string, seed?: number): SemanticProfile {
    // Reset de scores.
    this.scores = { cyberpunk: 0, organic: 0, ethereal: 0, volcanic: 0 };
    const normalized = prompt.toLowerCase().trim();

    // Si hay texto, recorremos los diccionarios y acumulamos peso.
    if (normalized.length > 0) {
      const tokens = normalized.split(/[\s,;.\-_/]+/);
      for (const k of SemanticMapper.CATEGORIES) {
        for (const word of SemanticMapper.KEYWORDS[k]) {
          if (normalized.includes(word)) {
            this.scores[k] += 1;
            // Si la palabra aparece como token exacto, suma extra.
            if (tokens.includes(word)) this.scores[k] += 1;
          }
        }
      }
    }

    // PRNG sembrado para reproducibilidad.
    const rng = this.makeRng(seed ?? Date.now());

    // Decidimos la paleta a partir de los scores (mayoritario) o al azar.
    const total = this.scores.cyberpunk + this.scores.organic + this.scores.ethereal + this.scores.volcanic;
    const dominant = this.getDominant(this.scores);

    let baseHue: number;
    let accentHue: number;
    let saturationBias: number;
    let isCyberpunk = false;
    let isOrganic = false;
    let isEthereal = false;
    let isVolcanic = false;

    if (total === 0) {
      // Sin coincidencias → azar puro.
      baseHue = rng() * 360;
      accentHue = (baseHue + 180 + (rng() * 60 - 30) + 360) % 360;
      saturationBias = 0.5 + rng() * 0.4;
    } else {
      switch (dominant) {
        case 'cyberpunk':
          isCyberpunk = true;
          // Cyberpunk: cian / magenta / púrpura, alto contraste.
          baseHue = 180 + (rng() * 80 - 40); // 140-220
          accentHue = 300 + (rng() * 60 - 30); // 270-330
          saturationBias = 0.85 + rng() * 0.15;
          break;
        case 'organic':
          isOrganic = true;
          // Orgánico: verdes, tierras, marrones, baja saturación.
          baseHue = 80 + (rng() * 80 - 20); // 60-140
          accentHue = 30 + rng() * 40; // 30-70
          saturationBias = 0.4 + rng() * 0.25;
          break;
        case 'ethereal':
          isEthereal = true;
          // Etéreo: blanco-azul-violeta, alto brillo.
          baseHue = 200 + (rng() * 60 - 30); // 170-230
          accentHue = 260 + (rng() * 40); // 260-300
          saturationBias = 0.6 + rng() * 0.2;
          break;
        case 'volcanic':
          isVolcanic = true;
          // Volcánico: rojo-naranja-negro.
          baseHue = 0 + (rng() * 30); // 0-30
          accentHue = 30 + (rng() * 30); // 30-60
          saturationBias = 0.7 + rng() * 0.25;
          break;
        default:
          baseHue = rng() * 360;
          accentHue = (baseHue + 180) % 360;
          saturationBias = 0.5;
      }
    }

    // Mapeo de forma: orgánico → curvo, volcánico → angular, etc.
    let form: SemanticProfile['form'];
    if (isOrganic || isEthereal) form = 'curved';
    else if (isVolcanic || isCyberpunk) form = 'angular';
    else form = rng() < 0.5 ? 'curved' : 'angular';

    // Mezcla de propiedades según sesgo.
    const profile: SemanticProfile = {
      baseHue,
      accentHue,
      saturationBias,
      speed: isCyberpunk ? 1.3 : isEthereal ? 0.7 : 0.9 + rng() * 0.4,
      roughness: isCyberpunk ? 0.15 : isVolcanic ? 0.85 : isEthereal ? 0.05 : 0.4 + rng() * 0.4,
      metalness: isCyberpunk ? 0.9 : isVolcanic ? 0.6 : isEthereal ? 0.2 : 0.5 + rng() * 0.4,
      form,
      particleDensity: isEthereal ? 0.9 : isCyberpunk ? 0.8 : isOrganic ? 0.5 : 0.6,
      lightIntensity: isVolcanic ? 1.2 : isEthereal ? 0.8 : 1.0,
      isCyberpunk,
      isOrganic,
      isEthereal,
      isVolcanic
    };

    return profile;
  }

  /** Devuelve la clave con mayor score acumulado. */
  private getDominant(s: Record<SemanticCategory, number>): SemanticCategory {
    let max = -1;
    let winner: SemanticCategory = 'cyberpunk';
    (Object.keys(s) as SemanticCategory[]).forEach((k) => {
      if (s[k] > max) {
        max = s[k];
        winner = k;
      }
    });
    return winner;
  }

  /** PRNG Mulberry32: 32 bits de estado, distribución uniforme, rápido. */
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
}
