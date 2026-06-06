import type { SemanticProfile } from '../types';

/**
 * Textualizer
 * ------------------------------------------------------------------
 * Convierte un prompt libre + un SemanticProfile en un "guion
 * tipográfico" (TextScript) listo para ser ejecutado por el
 * TypographicStage que vive en el UIManager.
 *
 * El guion describe QUÉ palabras aparecen, CUÁNDO, DÓNDE y con
 * qué efecto visual. Es 100% procedural: misma semilla → mismo
 * guion → misma coreografía textual (idempotente).
 *
 * Estructura del ciclo (14 segundos, en loop):
 *  - 0.0–2.5s  → TITLE  (palabra clave más evocadora, grande)
 *  - 2.8–4.8s  → SUBTITLE (2-3 keywords combinados)
 *  - 5.0–10.5s → KEYWORDS (5-7 dispersos, cada uno con categoría)
 *  - 10.5–13.0s → DESCRIPTORS (3-4 frases cortas tipo "running text")
 *  - 13.0–14.0s → pausa (todo en negro)
 *  - loop
 *
 * Cada categoría semántica tiene su propio lenguaje visual:
 *  - cyberpunk : glitch, monospace, neón
 *  - organic   : serif italic, glow suave
 *  - ethereal  : thin, blur, aura
 *  - volcanic  : bold, temblor, brasas
 *  - neutral   : limpio, clásico
 */

/** Categoría visual que puede tomar una palabra. */
export type TextCategory = 'cyberpunk' | 'organic' | 'ethereal' | 'volcanic' | 'neutral';

/** Efectos de entrada disponibles. */
export type EntryEffect =
  | 'fade'
  | 'glitch'
  | 'slide-up'
  | 'slide-down'
  | 'scale'
  | 'split-chars'
  | 'blur'
  | 'rotate'
  | 'typewriter';

/** Efectos de salida disponibles. */
export type ExitEffect = 'fade' | 'scale-down' | 'slide-up' | 'dissolve' | 'burn';

/** Un evento individual del guion tipográfico. */
export interface TextEvent {
  readonly id: string;
  readonly type: 'title' | 'subtitle' | 'keyword' | 'descriptor';
  readonly text: string;
  readonly category: TextCategory;
  /** Inicio relativo al inicio del ciclo (segundos). */
  readonly startAt: number;
  /** Cuánto tiempo permanece visible (segundos). */
  readonly duration: number;
  /** Posición horizontal 0-100 (% del viewport). */
  readonly x: number;
  /** Posición vertical 0-100 (% del viewport). */
  readonly y: number;
  /** Tamaño de fuente en rem. */
  readonly size: number;
  /** Rotación base en grados. */
  readonly rotation: number;
  readonly entryEffect: EntryEffect;
  readonly exitEffect: ExitEffect;
  /** Si responde a clicks (re-render con esa palabra). */
  readonly interactive: boolean;
}

/** Paleta cromática derivada del SemanticProfile. */
export interface TextPalette {
  readonly accent: string;
  readonly base: string;
  readonly glow: string;
  readonly secondary: string;
}

/** Guion tipográfico completo. */
export interface TextScript {
  readonly totalDuration: number;
  readonly events: ReadonlyArray<TextEvent>;
  readonly palette: TextPalette;
  readonly titleText: string;
  readonly subtitleText: string;
}

interface ClassifiedWord {
  readonly word: string;
  readonly category: TextCategory;
}

export class Textualizer {
  /** Stopwords en español + inglés para filtrar del prompt. */
  private static readonly STOPWORDS = new Set<string>([
    // Español
    'a', 'al', 'algo', 'algunas', 'algunos', 'ante', 'antes', 'como', 'con', 'contra',
    'cual', 'cuando', 'de', 'del', 'desde', 'donde', 'durante', 'e', 'el', 'ella',
    'ellas', 'ellos', 'en', 'entre', 'era', 'erais', 'eran', 'eras', 'eres', 'es',
    'esa', 'esas', 'ese', 'eso', 'esos', 'esta', 'estaba', 'estabais', 'estaban',
    'estabas', 'estad', 'estada', 'estadas', 'estado', 'estados', 'estais', 'estamos',
    'estan', 'estando', 'estar', 'estará', 'estarán', 'estarás', 'estaré', 'estaréis',
    'estas', 'este', 'esto', 'estos', 'estoy', 'etc', 'fue', 'fuera', 'fuerais',
    'fueran', 'fueras', 'fueron', 'fui', 'fuimos', 'ha', 'habida', 'habidas',
    'habido', 'habidos', 'habiendo', 'habrá', 'habrán', 'había', 'habíamos', 'han',
    'has', 'hasta', 'hay', 'haya', 'hayamos', 'hayan', 'hayas', 'he', 'hemos', 'hube',
    'hubo', 'la', 'las', 'le', 'les', 'lo', 'los', 'más', 'me', 'mi', 'mis', 'mucho',
    'muchos', 'muy', 'nada', 'ni', 'no', 'nos', 'nosotras', 'nosotros', 'nuestra',
    'nuestras', 'nuestro', 'nuestros', 'o', 'os', 'otra', 'otras', 'otro', 'otros',
    'para', 'pero', 'poco', 'por', 'porque', 'que', 'quien', 'quienes', 'se', 'sea',
    'seamos', 'sean', 'seas', 'ser', 'sería', 'si', 'sido', 'siendo', 'sin', 'sobre',
    'sois', 'somos', 'son', 'soy', 'su', 'sus', 'también', 'tanto', 'te', 'tendrá',
    'tendrán', 'tendrás', 'tendré', 'tendríamos', 'tendrían', 'tenemos', 'tener',
    'tengo', 'ti', 'tiene', 'tienen', 'tienes', 'todo', 'todos', 'tu', 'tus', 'tuya',
    'tuyas', 'tuyo', 'tuyos', 'un', 'una', 'uno', 'unos', 'vosotras', 'vosotros',
    'vuestra', 'vuestras', 'vuestro', 'vuestros', 'y', 'ya', 'yo',
    // English
    'the', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'of', 'in', 'on', 'at',
    'to', 'for', 'with', 'by', 'from', 'as', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'its', 'our', 'their', 'will', 'would', 'can', 'could',
    'should', 'shall', 'may', 'might', 'must', 'just', 'than', 'then', 'now', 'so'
  ]);

  /** Diccionarios de fallback por categoría. */
  private static readonly FALLBACK_TITLE: Record<TextCategory, string> = {
    cyberpunk: 'Neon',
    organic: 'Naturaleza',
    ethereal: 'Etereo',
    volcanic: 'Volcan',
    neutral: 'Escena'
  };

  private static readonly FALLBACK_SUBTITLE: Record<TextCategory, string> = {
    cyberpunk: 'Sistema · Matrix · Neón',
    organic: 'Vida · Bosque · Crecimiento',
    ethereal: 'Luz · Cristal · Aura',
    volcanic: 'Lava · Fuego · Ceniza',
    neutral: 'Generación Procedural'
  };

  private static readonly FALLBACK_KEYWORDS: Record<TextCategory, ReadonlyArray<string>> = {
    cyberpunk: ['NEON', 'CIRCUIT', 'GLITCH', 'MATRIX', 'HOLO', 'PIXEL', 'BINARY', 'WIRE'],
    organic: ['BOSQUE', 'FLORA', 'RAIZ', 'HOJA', 'CRECIMIENTO', 'VIDA', 'POLEN', 'MIEL'],
    ethereal: ['CRISTAL', 'LUZ', 'AURA', 'ASTRAL', 'GLASS', 'ETERN', 'MIEL', 'NIMBO'],
    volcanic: ['LAVA', 'FUEGO', 'MAGMA', 'CENIZA', 'METAL', 'BRASA', 'INFERNO', 'EMBR'],
    neutral: ['MATERIA', 'ENERGIA', 'TIEMPO', 'ESPACIO', 'FLUJO', 'FORMA', 'RITMO']
  };

  private static readonly FALLBACK_DESCRIPTORS: Record<TextCategory, ReadonlyArray<string>> = {
    cyberpunk: [
      '// SYSTEM ACTIVE',
      '0xFF · ENCRYPTED',
      'STREAM::CHANNEL_07',
      'USER::UNKNOWN',
      '> executing render'
    ],
    organic: [
      'crecimiento lento',
      'flujo natural',
      'materia viva',
      'respirar el verde',
      'miel de la tierra'
    ],
    ethereal: [
      '~ flotando ~',
      'luz en silencio',
      'aura cristalina',
      'materia sutil',
      'espacio que respira'
    ],
    volcanic: [
      '¡arde!',
      'metal fundido',
      'calor en aumento',
      'temperatura crítica',
      'ceniza en el aire'
    ],
    neutral: [
      '— en proceso —',
      '// sincronizando',
      '...',
      'en movimiento',
      'cambiando'
    ]
  };

  /**
   * Genera un guion tipográfico a partir del prompt y el perfil.
   */
  public generate(prompt: string, profile: SemanticProfile, seed: number): TextScript {
    const rng = this.makeRng(seed);
    const tokens = this.tokenize(prompt);
    const keywords = this.extractKeywords(tokens, profile);

    const dominantCategory: TextCategory = this.dominantCategory(profile);
    const totalDuration = 14;

    const events: TextEvent[] = [];

    // 1) TITLE — palabra más evocadora o fallback.
    const titleWord = keywords[0]?.word ?? Textualizer.FALLBACK_TITLE[dominantCategory];
    const titleText = this.toTitleCase(titleWord);
    events.push({
      id: 'title',
      type: 'title',
      text: titleText,
      category: keywords[0]?.category ?? dominantCategory,
      startAt: 0.2,
      duration: 2.4,
      x: 50,
      y: 20,
      size: 5.5,
      rotation: 0,
      entryEffect: this.pickEntryEffect('title', profile),
      exitEffect: 'fade',
      interactive: false
    });

    // 2) SUBTITLE — 2-3 keywords.
    const subtitleTokens = keywords.slice(1, 4).map((k) => k.word);
    const subtitleText = subtitleTokens.length > 0
      ? this.toTitleCase(subtitleTokens.join(' · '))
      : Textualizer.FALLBACK_SUBTITLE[dominantCategory];
    events.push({
      id: 'subtitle',
      type: 'subtitle',
      text: subtitleText,
      category: 'neutral',
      startAt: 2.7,
      duration: 2.0,
      x: 50,
      y: 33,
      size: 1.1,
      rotation: 0,
      entryEffect: 'slide-up',
      exitEffect: 'fade',
      interactive: false
    });

    // 3) KEYWORDS — 5-7 dispersos.
    let keywordPool: ReadonlyArray<ClassifiedWord> = keywords.slice(0, 7);
    if (keywordPool.length < 4) {
      const fallbacks = Textualizer.FALLBACK_KEYWORDS[dominantCategory] ?? Textualizer.FALLBACK_KEYWORDS.neutral ?? [];
      const needed = 5 - keywordPool.length;
      const extra: ClassifiedWord[] = fallbacks.slice(0, needed).map((w) => ({ word: w, category: dominantCategory }));
      keywordPool = [...keywordPool, ...extra];
    }

    const keywordsStart = 5.0;
    const keywordsSpan = 5.5;
    keywordPool.forEach((k, i) => {
      // Distribuimos las keywords evitando el centro (donde está el title/subtitle).
      const angle = (i / keywordPool.length) * Math.PI * 2 + rng() * 0.5;
      const radius = 22 + rng() * 14;
      const cx = 50 + Math.cos(angle) * radius;
      const cy = 56 + Math.sin(angle) * radius * 0.55;
      const x = Math.max(8, Math.min(92, cx));
      const y = Math.max(42, Math.min(82, cy));
      events.push({
        id: `kw-${i}`,
        type: 'keyword',
        text: this.toTitleCase(k.word),
        category: k.category,
        startAt: keywordsStart + (i / keywordPool.length) * keywordsSpan,
        duration: 1.6,
        x,
        y,
        size: 1.3 + rng() * 0.8,
        rotation: (rng() - 0.5) * 8,
        entryEffect: this.pickEntryEffect('keyword', profile, k.category),
        exitEffect: this.pickExitEffect(k.category),
        interactive: true
      });
    });

    // 4) DESCRIPTORS — frases cortas estilo "running text" en la base.
    const descriptorPool = Textualizer.FALLBACK_DESCRIPTORS[dominantCategory] ?? Textualizer.FALLBACK_DESCRIPTORS.neutral ?? [];
    const descriptorsStart = 10.5;
    descriptorPool.slice(0, 4).forEach((d, i) => {
      events.push({
        id: `desc-${i}`,
        type: 'descriptor',
        text: d,
        category: dominantCategory,
        startAt: descriptorsStart + i * 0.4,
        duration: 2.5,
        x: 12 + i * 22 + (rng() - 0.5) * 6,
        y: 90,
        size: 0.65,
        rotation: 0,
        entryEffect: 'typewriter',
        exitEffect: 'fade',
        interactive: false
      });
    });

    return {
      totalDuration,
      events,
      palette: {
        accent: `hsl(${profile.accentHue}, ${Math.round(profile.saturationBias * 100)}%, 65%)`,
        base: `hsl(${profile.baseHue}, ${Math.round(profile.saturationBias * 100)}%, 60%)`,
        glow: `hsl(${profile.accentHue}, ${Math.round(profile.saturationBias * 100)}%, 50%)`,
        secondary: `hsl(${(profile.accentHue + 30) % 360}, ${Math.round(profile.saturationBias * 100)}%, 55%)`
      },
      titleText,
      subtitleText
    };
  }

  /** Tokeniza el prompt en palabras (lowercase, sin puntuación). */
  private tokenize(prompt: string): string[] {
    return prompt
      .toLowerCase()
      .split(/[\s,;.!?¿¡\-_/()\[\]"'`]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  /** Filtra stopwords y devuelve las keywords ordenadas por "evocación" (largo desc). */
  private extractKeywords(tokens: string[], _profile: SemanticProfile): ClassifiedWord[] {
    const seen = new Set<string>();
    const out: ClassifiedWord[] = [];

    const unique = [...new Set(tokens)]
      .filter((t) => !Textualizer.STOPWORDS.has(t))
      .filter((t) => t.length >= 2)
      .filter((t) => /^[\p{L}\p{N}]+$/u.test(t))
      .sort((a, b) => b.length - a.length);

    for (const word of unique) {
      if (seen.has(word)) continue;
      seen.add(word);
      out.push({ word, category: this.classifyWord(word) });
      if (out.length >= 8) break;
    }

    return out;
  }

  /** Clasifica una palabra libre en una TextCategory usando heurísticas. */
  private classifyWord(word: string): TextCategory {
    const cyberRe = /neon|cyber|tech|holo|digital|glitch|circuit|chip|robot|android|matrix|wire|code|binary|quantum|laser|cyborg|datastream|hyperlink/i;
    const organicRe = /organic|natural|plant|flora|bosque|forest|leaf|root|tree|wood|life|mushroom|nature|crecimiento|semilla|garden|jardin|selva|wild/i;
    const etherealRe = /cristal|crystal|glass|spirit|light|ice|water|aura|mist|celestial|angel|star|moon|sun|sky|cloud|soul|dream|ethereo|astral|divin/i;
    const volcanicRe = /lava|fire|volcan|magma|hell|metal|ash|ember|burn|rojo|red|inferno|demon|forge|steel|iron|smoke|flame/i;

    if (cyberRe.test(word)) return 'cyberpunk';
    if (organicRe.test(word)) return 'organic';
    if (etherealRe.test(word)) return 'ethereal';
    if (volcanicRe.test(word)) return 'volcanic';
    return 'neutral';
  }

  /** Devuelve la categoría dominante del perfil. */
  private dominantCategory(profile: SemanticProfile): TextCategory {
    if (profile.isCyberpunk) return 'cyberpunk';
    if (profile.isOrganic) return 'organic';
    if (profile.isEthereal) return 'ethereal';
    if (profile.isVolcanic) return 'volcanic';
    return 'neutral';
  }

  /** Selecciona un efecto de entrada según el contexto. */
  private pickEntryEffect(
    type: 'title' | 'keyword' | 'descriptor',
    profile: SemanticProfile,
    wordCat?: TextCategory
  ): EntryEffect {
    const cat = wordCat ?? this.dominantCategory(profile);
    if (type === 'title') {
      if (cat === 'cyberpunk') return 'glitch';
      if (cat === 'ethereal') return 'blur';
      if (cat === 'volcanic') return 'scale';
      if (cat === 'organic') return 'split-chars';
      return 'split-chars';
    }
    if (type === 'descriptor') return 'typewriter';
    // keyword
    switch (cat) {
      case 'cyberpunk': return 'glitch';
      case 'organic': return 'slide-up';
      case 'ethereal': return 'blur';
      case 'volcanic': return 'scale';
      default: return 'fade';
    }
  }

  /** Selecciona un efecto de salida según la categoría. */
  private pickExitEffect(cat: TextCategory): ExitEffect {
    switch (cat) {
      case 'volcanic': return 'burn';
      case 'ethereal': return 'dissolve';
      case 'organic': return 'fade';
      case 'cyberpunk': return 'scale-down';
      default: return 'fade';
    }
  }

  /** Capitaliza cada palabra. */
  private toTitleCase(s: string): string {
    return s.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** PRNG Mulberry32. */
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
