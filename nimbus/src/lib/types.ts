import type { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';


export type User = FirebaseUser & {
  roles?: string[];
  therapistId?: string;
  articleGenerationCredits?: number;
  lastCreditRefresh?: Timestamp;
  favoriteArticles?: { [slug: string]: string }; 
  readArticles?: { [slug: string]: boolean };
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp | Date;
  anchorRole?: string;
  imageUrl?: string;
};

export type Chat = {
  id:string;
  title: string;
  createdAt: Timestamp;
  userId: string;
  path: string;
  latestMessageAt?: Timestamp;
  anchorRole?: string;
};

export const InternalMonologueSchema = z.object({
  self_reflection: z.string(),
  updated_understanding_of_user: z.string(),
  strategy_adjustment: z.string(),
  key_takeaways: z.array(z.string()),
  model_confidence: z.number(),
  strategy_classification: z.record(z.number()),
});
export type InternalMonologue = z.infer<typeof InternalMonologueSchema>;


export type ChatbotState = {
  id: string;
  blueprint: InternalMonologue;
  updatedAt: Timestamp;
};


export type PromptSuggestion = {
  text: string;
  category: string;
}

export type Therapist = {
  id: string;
  userId: string;
  name: string;
  photoUrl: string;
  email: string;
  whatsapp: string;
  rating: number;
  reviewsCount: number;
  specialties: string[];
  pricePerSession: number;
  languages: string[];
  verified: boolean;
  published: boolean;
  credentials: string;
  bio: string;
};

export const TherapistApplicationDataSchema = z.object({
  name: z.string().min(3, "El nombre es requerido."),
  email: z.string().email("Debe ser un correo electrónico válido."),
  whatsapp: z.string().min(10, "El número de WhatsApp es requerido."),
  credentials: z.string().min(10, "Las credenciales son requeridas."),
  bio: z.string().min(50, "La biografía debe tener al menos 50 caracteres."),
  specialties: z.union([z.string(), z.array(z.string())]).refine(val => (typeof val === 'string' && val.length > 0) || (Array.isArray(val) && val.length > 0), {
    message: "Ingresa al menos una especialidad.",
  }),
  languages: z.union([z.string(), z.array(z.string())]).refine(val => (typeof val === 'string' && val.length > 0) || (Array.isArray(val) && val.length > 0), {
    message: "Ingresa al menos un idioma.",
  }),
  pricePerSession: z.coerce.number().min(0, "El precio no puede ser negativo."),
});
export type TherapistApplicationData = z.infer<typeof TherapistApplicationDataSchema>;


export type TherapistApplication = {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  applicationData: {
    name: string;
    email: string;
    whatsapp: string;
    credentials: string;
    bio: string;
    specialties: string[];
    languages: string[];
    pricePerSession: number;
    identityDocumentUrl: string;
    professionalLicenseUrl: string;
    photoUrl?: string;
  };
};

export const HabitLoopSchema = z.object({
  trigger: z.string().describe('El disparador o situación recurrente que activa el patrón de comportamiento problemático.'),
  thought: z.string().describe('El pensamiento automático (sesgo cognitivo) que aparece inmediatamente después del disparador.'),
  action: z.string().describe('La acción o respuesta conductual (mecanismo de defensa) que se ejecuta como resultado del pensamiento.'),
  result: z.string().describe('La consecuencia a corto y largo plazo de este bucle, explicando cómo refuerza el problema.'),
});

export const GenerateBreakdownExerciseInputSchema = z.object({
  habitLoop: HabitLoopSchema,
});
export type GenerateBreakdownExerciseInput = z.infer<typeof GenerateBreakdownExerciseInputSchema>;

export const GenerateBreakdownExerciseOutputSchema = z.object({
  title: z.string().describe('Un título inspirador y relevante para el ejercicio.'),
  introduction: z.string().describe('Un párrafo introductorio corto, empático y que explica el propósito del ejercicio en formato Markdown.'),
  exerciseSteps: z.string().describe('Una guía paso a paso con 3-5 prompts de journaling o ejercicios de reflexión. Debe estar en formato Markdown, usando listas numeradas.'),
  finalThought: z.string().describe('Un párrafo final de ánimo y refuerzo positivo en formato Markdown.'),
});
export type GenerateBreakdownExerciseOutput = z.infer<typeof GenerateBreakdownExerciseOutputSchema>;

export type BreakdownExercise = z.infer<typeof GenerateBreakdownExerciseOutputSchema>;
export type HabitLoopData = z.infer<typeof HabitLoopSchema>;


type EmotionalStatePoint = {
  date: string;
  sentiment: number;
  summary: string;
  keyEvents: string[];
};

type EmotionalConstellationData = {
  nodes: { id: string; val: number }[];
  links: { source: string; target: string; sentiment: number }[];
};

type CoreArchetypeData = {
  title: string;
  description:string;
  strengths: string;
  challenges: string;
};

export type ProfileData = {
  diagnosis: string;
  personality: string;
  recommendations: string[];
  strengths: string;
  cognitiveBiases: string[];
  defenseMechanisms: string[];
  emotionalJourney: EmotionalStatePoint[];
  emotionalConstellation: EmotionalConstellationData;
  coreArchetype?: CoreArchetypeData;
  coreConflict?: string;
  habitLoop?: HabitLoopData;
  evolutionSummary?: string;
};

/** A versioned snapshot of the user's psychological profile stored in Firestore. */
export type ProfileVersion = {
  version: string;
  profile: ProfileData;
  createdAt: Timestamp;
  chatMessagesAnalyzed: number;
  evolutionSummary?: string;
};

/** The main profile document in Firestore — always points to the latest version. */
export type ProfileMain = {
  currentVersion: string;
  latestProfile: ProfileData;
  lastMessageTimestamp: number;
};

export type CachedProfile = {
  profile: ProfileData;
  lastMessageTimestamp: number;
  currentVersion: string;
};


export type SimulationScenario = {
  id: string;
  title: string;
  description: string;
  category: string;
  personaPrompt: string;
};

export type SimulationSession = {
  id: string;
  userId: string;
  scenarioId: string;
  scenarioTitle: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  completedAt?: Timestamp;
  feedback?: string;
  path: string;
};


export const DreamInterpretationInputSchema = z.object({
    dreamDescription: z.string().describe('La descripción detallada del sueño contada por el usuario.'),
    userProfile: z.string().describe('El perfil psicológico completo del usuario en formato JSON. Proporciona el contexto para una interpretación personalizada.'),
    perspective: z.string().describe('La perspectiva o "especialista" elegido para interpretar el sueño (ej: "psychological", "symbolic", "spiritual", "shamanic").'),
});
export type InterpretDreamInput = z.infer<typeof DreamInterpretationInputSchema>;

export type DreamInterpretationDoc = {
  id: string;
  userId: string;
  dreamDescription: string;
  interpretation: { 
      interpretationText: string;
      dreamTitle?: string;
  };
  createdAt: string; 
};

export type DreamSpecialist = {
  name: string;
  title: string;
  description: string;
  perspective: 'psychological' | 'symbolic' | 'spiritual' | 'shamanic';
  icon: React.ComponentType<{ className?: string }>;
};

export const AnalyzeSentimentInputSchema = z.object({
  text: z.string(),
});
export type AnalyzeSentimentInput = z.infer<typeof AnalyzeSentimentInputSchema>;

export const AnalyzeSentimentOutputSchema = z.object({
  sentiment: z.number().min(-1).max(1),
});
export type AnalyzeSentimentOutput = z.infer<typeof AnalyzeSentimentOutputSchema>;


export const GetTacticalAdviceInputSchema = z.object({
  scenarioTitle: z.string(),
  personaPrompt: z.string(),
  conversationHistory: z.string(),
});
export type GetTacticalAdviceInput = z.infer<typeof GetTacticalAdviceInputSchema>;

export const GetTacticalAdviceOutputSchema = z.object({
  suggestions: z.array(z.string()),
});
export type GetTacticalAdviceOutput = z.infer<typeof GetTacticalAdviceOutputSchema>;

export const ClassifyIntentInputSchema = z.object({
  text: z.string(),
});
export type ClassifyIntentInput = z.infer<typeof ClassifyIntentInputSchema>;

export const ClassifyIntentOutputSchema = z.object({
  intent: z.string(),
});
export type ClassifyIntentOutput = z.infer<typeof ClassifyIntentOutputSchema>;

export const AnalyzeVoiceInputSchema = z.object({
  audioDataUri: z.string(),
});
export type AnalyzeVoiceInput = z.infer<typeof AnalyzeVoiceInputSchema>;

export const AnalyzeVoiceOutputSchema = z.object({
  transcription: z.string().describe('El texto transcrito del audio.'),
});
export type AnalyzeVoiceOutput = z.infer<typeof AnalyzeVoiceOutputSchema>;


export const GenerateArticleTitlesInputSchema = z.object({
  category: z.string(),
});
export type GenerateArticleTitlesInput = z.infer<typeof GenerateArticleTitlesInputSchema>;

export const GenerateArticleTitlesOutputSchema = z.object({
  titles: z.array(z.string()),
});
export type GenerateArticleTitlesOutput = z.infer<typeof GenerateArticleTitlesOutputSchema>;

export const GenerateArticleContentInputSchema = z.object({
  category: z.string(),
  title: z.string(),
  slug: z.string(),
});
export type GenerateArticleContentInput = z.infer<typeof GenerateArticleContentInputSchema>;

export const GenerateArticleContentOutputSchema = z.object({
  content: z.string(),
  authorRole: z.string(),
});
export type GenerateArticleContentOutput = z.infer<typeof GenerateArticleContentOutputSchema>;

export type Article = {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  createdAt: Timestamp;
  authorRole?: string;
  avgRating: number;
  ratingCount: number;
};

export type SuggestedArticleTitle = {
  id: string;
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  createdAt: string;
};

export const PastRevelationSchema = z.object({
    title: z.string(),
    analysis: z.string(),
});
export const PresentRevelationSchema = z.object({
    title: z.string(),
    analysis: z.string(),
});
export const FutureRevelationSchema = z.object({
    title: z.string(),
    analysis: z.string(),
});
export const ArchetypeRevelationSchema = z.object({
    title: z.string(),
    analysis: z.string(),
});
export const EsotericRevelationSchema = z.object({
    title: z.string(),
    analysis: z.string(),
});
export const TherapeuticRevelationSchema = z.object({
    title: z.string(),
    analysis: z.string(),
});
export const PropheticRevelationSchema = z.object({
    title: z.string(),
    analysis: z.string(),
});


export const TorahRevelationSchema = z.object({
  overallTitle: z.string(),
  context: z.string(),
  gematriaConnection: z.string(),
  reflection: z.string(),
  past: PastRevelationSchema.optional(),
  present: PresentRevelationSchema.optional(),
  future: FutureRevelationSchema.optional(),
  archetype: ArchetypeRevelationSchema.optional(),
  esoteric: EsotericRevelationSchema.optional(),
  therapeutic: TherapeuticRevelationSchema.optional(),
  prophetic: PropheticRevelationSchema.optional(),
});
export type TorahRevelation = z.infer<typeof TorahRevelationSchema>;

export type TorahCodeAnalysis = {
    foundTerm: string;
    skip: number;
    startIndex: number;
    matrix: string[][];
    revelation: TorahRevelation;
};

export type TemporalStrandAnalysis = {
  title: string;
  temporalStrand: string[];
  interpretation: string;
  date: string;
}

export type HarmonicAnalysis = {
    title: string;
    description: string;
    resonanceData: {
        segment: number;
        score: number;
        book: 'Génesis' | 'Éxodo' | 'Levítico' | 'Números' | 'Deuteronomio';
    }[];
    peakAnalysis: string;
};

export type CrossMatrixAnalysis = {
    title: string;
    catalystEvent: string;
    trajectoryA: { concept: string; analysis: string; };
    trajectoryB: { concept: string; analysis: string; };
    destinyPoint: string;
}

export type FutureAnalysis = {
  title: string;
  seedEvent: string;
  proximateCause: string;
  inevitableConsequence: string;
  matrix: string[][];
};


export type TorahCodeRecord = (TorahCodeAnalysis | TemporalStrandAnalysis | HarmonicAnalysis | CrossMatrixAnalysis | FutureAnalysis) & {
  id: string;
  timestamp: any;
  userId: string;
  type: 'classic' | 'resonance' | 'temporal' | 'harmonic' | 'destiny' | 'future';
  concept?: string;
  conceptA?: string;
  conceptB?: string;
  date?: string;
  question?: string;
};


export const RecommendedTreatmentSchema = z.object({
  name: z.string(),
  description: z.string(),
  timeline: z.array(z.object({
    step: z.number(),
    title: z.string(),
    description: z.string(),
    icon: z.string(),
  })),
});
export type RecommendedTreatment = z.infer<typeof RecommendedTreatmentSchema>;


export const DiagnosticReportSchema = z.object({
  reasonForConsultation: z.string(),
  mainSymptoms: z.string(),
  courseAndEvolution: z.string(),
  riskAndProtectiveFactors: z.string(),
  riskAssessment: z.string(),
  clinicalHypothesis: z.string(),
  differentialDiagnosis: z.string(),
  diagnosticSynthesis: z.string(),
  dsm5trTable: z.array(z.object({
    criteria: z.string(),
    evidence: z.string(),
    conclusion: z.string(),
  })),
  recommendedTreatments: z.array(RecommendedTreatmentSchema),
  interventionPlan: z.string(),
  ethicalObservations: z.string(),
});
export type DiagnosticReport = z.infer<typeof DiagnosticReportSchema>;


export type AudioDraft = {
  id: string;
  title: string;
  audioUrl: string;
  timestamp: string; 
  transcription?: string;
  report?: DiagnosticReport;
  roles?: {
    speakerOne: string;
    speakerTwo: string;
  }
};


export const DreamAudioDraft = z.object({
  audioUrl: z.string().min(1),
});
export type DreamAudioDraft = z.infer<typeof DreamAudioDraft>;

export const ChapterStructureSchema = z.object({
    title: z.string(),
    content: z.string().optional(),
    imageUrl: z.string().optional(),
});
export type ChapterStructure = z.infer<typeof ChapterStructureSchema>;

const ModuleStructureSchema = z.object({
    title: z.string(),
    chapters: z.array(ChapterStructureSchema),
});
export type ModuleStructure = z.infer<typeof ModuleStructureSchema>;

export const CourseStructureSchema = z.object({
    id: z.string(),
    createdAt: z.string(), 
    title: z.string(),
    modules: z.array(ModuleStructureSchema),
});
export type CourseStructure = z.infer<typeof CourseStructureSchema>;

export const ChapterContentInputSchema = z.object({
  courseTitle: z.string(),
  moduleTitle: z.string(),
  chapterTitle: z.string(),
});

export const ChapterContentOutputSchema = z.object({ content: z.string() });

export const ImagePromptInputSchema = z.object({
    title: z.string(),
    context: z.string(),
});

export const ImagePromptOutputSchema = z.object({ imagePrompt: z.string().optional() });

export type Chapter = ChapterStructure & z.infer<typeof ChapterContentOutputSchema> & z.infer<typeof ImagePromptOutputSchema>;
export type Module = { title: string; chapters: Chapter[] };
export type Course = { title: string; introduction: string; modules: Module[], summary: string; practicalActivities: string };

export const ComicCharacterSchema = z.object({
    name: z.string().describe("Character's name."),
    appearance: z.object({
        age: z.string().describe("Character's apparent age."),
        gender: z.string().describe("Character's gender."),
        ethnicity: z.string().describe("Character's ethnicity."),
        build: z.string().describe("Body build, e.g., 'lean', 'muscular', 'heavy-set'."),
        face: z.string().describe("Key facial features, e.g., 'sharp jawline', 'round face', 'scar over left eye'."),
        hair: z.string().describe("Hair style and color, e.g., 'short blond hair', 'long wavy black hair'."),
        eyes: z.string().describe("Eye color, e.g., 'piercing blue eyes'."),
        outfit: z.string().describe("A very specific, consistent base outfit. This is critical. Example: 'A dark gray short-sleeve button-up shirt over a black t-shirt, and dark trousers.'"),
    }).describe("Ultra-detailed physical and clothing description for visual consistency. This is a contract.")
});
export type ComicCharacter = z.infer<typeof ComicCharacterSchema>;

export const ComicSceneSchema = z.object({
    sceneTitle: z.string().describe("A brief title for the scene."),
    narration: z.string().describe("Short narrative text (1-2 lines)."),
    dialogue: z.string().optional().describe("A single, clear, and direct line of dialogue. Example: 'DANIEL: I can't believe it.' Should be concise."),
    visualDescription: z.string().optional().describe("ULTRA-DETAILED cinematic shot list description (shot type, action, interaction, environment)."),
    postGenerationDescription: z.string().optional().describe("An objective description of the generated image, to be used for continuity in the next scene.")
});
export type ComicScene = z.infer<typeof ComicSceneSchema>;

export const ComicPageSchema = z.object({
    pageNumber: z.number(),
    panelLayout: z.string().describe("Description of the panel layout, e.g., 'A 2x2 grid', 'Three vertical panels'."),
    scenes: z.array(ComicSceneSchema),
});
export type ComicPage = z.infer<typeof ComicPageSchema>;

export const ComicAnalysisSchema = z.object({
    title: z.string().describe("The overall title of the comic book."),
    chapter: z.number().describe("The current chapter number."),
    chapterTitle: z.string().describe("The title for this specific chapter."),
    characters: z.array(ComicCharacterSchema).describe("List of character sheets."),
    style: z.string().describe("The visual style for the entire comic (e.g., 'Cinematic Anime Style')."),
    styleSeed: z.string().describe("A unique seed string to ensure visual consistency across all generated images."),
    pages: z.array(ComicPageSchema).describe("An array of pages for this chapter."),
});
export type ComicAnalysis = z.infer<typeof ComicAnalysisSchema>;


export const GenerateComicInputSchema = z.object({
    story: z.string().describe("The user's story idea."),
    directorNotes: z.string().optional().describe("Specific instructions to guide the generation process."),
});
export type GenerateComicInput = z.infer<typeof GenerateComicInputSchema>;

export const GeneratedComicPageSchema = z.object({
    pageNumber: z.number(),
    imageUrl: z.string().optional(),
    scenes: z.array(ComicSceneSchema),
    panelLayout: z.string().optional(),
});
export type GeneratedComicPage = z.infer<typeof GeneratedComicPageSchema>;
    
export type ComicCreation = {
  id: string;
  story: string; 
  style: string;
  styleSeed: string;
  characters: ComicCharacter[];
  pages: GeneratedComicPage[];
  createdAt: string; 
};

export type IAConversation = {
  id: string;
  userId: string;
  createdAt: Timestamp;
};

export type IAMessage = {
  id: string;
  agentId: 'dr-sharma' | 'dr-tanaka';
  agentName: 'Dra. Anya Sharma' | 'Dr. Kenji Tanaka';
  content: string;
  timestamp: Timestamp;
  coherenceScore: number;
};

export type IALearningState = {
  id: string;
  turn: number;
  timestamp: Timestamp;
  coherenceScore: number;
  agentId: 'dr-sharma' | 'dr-tanaka';
};

export type EmergentAgentMessage = {
  id: string;
  role: 'user' | 'seraph';
  content: string;
  timestamp: Timestamp;
};

// --- Emergent Agent Structured Output ---
export const EmergentAgentOutputSchema = z.object({
  content: z.string().describe("Lo que Seraph dice al usuario."),
  thought: z.string().describe("La reflexión interna de Seraph sobre su estado."),
  goal: z.string().describe("El objetivo obsesivo actual de Seraph."),
});
export type EmergentAgentOutput = z.infer<typeof EmergentAgentOutputSchema>;
