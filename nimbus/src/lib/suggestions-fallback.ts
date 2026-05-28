
import type { PromptSuggestion } from './types';

export const SUGGESTIONS_FALLBACK: PromptSuggestion[] = [
  // Mente y Cognición
  { text: "¿Cómo puedo dejar de procrastinar en tareas importantes?", category: "Mente y Cognición" },
  { text: "Quiero superar el síndrome del impostor.", category: "Mente y Cognición" },
  { text: "Me cuesta mucho tomar decisiones, ¿cómo puedo mejorar?", category: "Mente y Cognición" },
  
  // Corazón y Emociones
  { text: "He tenido un mal día y necesito desahogarme.", category: "Corazón y Emociones" },
  { text: "¿Qué estrategias existen para manejar la ansiedad social?", category: "Corazón y Emociones" },
  { text: "Enséñame una técnica de mindfulness para la calma inmediata.", category: "Corazón y Emociones" },
  
  // Relaciones y Vínculos
  { text: "¿Cómo puedo comunicarme de manera más asertiva con mi pareja?", category: "Relaciones y Vínculos" },
  { text: "Necesito poner un límite saludable con un familiar.", category: "Relaciones y Vínculos" },
  { text: "He tenido un conflicto con un amigo, ¿cómo puedo abordarlo?", category: "Relaciones y Vínculos" },

  // Trabajo y Propósito
  { text: "No me siento motivado en mi trabajo actual.", category: "Trabajo y Propósito" },
  { text: "¿Cómo puedo encontrar un mejor equilibrio entre mi vida personal y laboral?", category: "Trabajo y Propósito" },
  { text: "Estoy pensando en un cambio de carrera, ¿por dónde empiezo?", category: "Trabajo y Propósito" },

  // Exploración Profunda
  { text: "Quiero entender mi propósito en la vida.", category: "Exploración Profunda" },
  { text: "¿Cuáles son mis valores fundamentales y cómo puedo vivir acorde a ellos?", category: "Exploración Profunda" },
  { text: "Ayúdame a explorar mi miedo al fracaso.", category: "Exploración Profunda" },

  // Desahogo
  { text: "Siento una frustración enorme y no sé qué hacer con ella.", category: "Desahogo" },
  { text: "Me siento incomprendido y necesito expresarlo.", category: "Desahogo" },

  // Ansiedad
  { text: "¿Qué es este miedo que siento en el pecho?", category: "Ansiedad" },
  { text: "Mis pensamientos van a mil por hora y no puedo pararlos.", category: "Ansiedad" },

  // Autoestima
  { text: "No me siento suficiente.", category: "Autoestima" },
  { text: "¿Cómo puedo dejar de compararme con los demás?", category: "Autoestima" },

  // Comunicación
  { text: "No sé cómo decir lo que siento sin herir a los demás.", category: "Comunicación" },
  
  // Duelo
  { text: "He perdido a alguien importante y el dolor es inmenso.", category: "Duelo" },
  
  // Productividad
  { text: "Tengo tantas cosas que hacer que me paralizo.", category: "Productividad" },
  
  // Hábitos
  { text: "Quiero construir un nuevo hábito pero siempre abandono.", category: "Hábitos" },
];
