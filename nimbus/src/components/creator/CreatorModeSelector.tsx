'use client';

import { motion } from 'framer-motion';
import CreatorCard from './CreatorCard';
import type { CreatorMode } from '@/app/creator/page';

import { GraduationCap, BookImage, BookCopy, Brush, School, Baby, Hand, ShieldQuestion } from 'lucide-react';

const modes = [
    { id: 'courses', title: 'Creación de Cursos', description: 'Transforma un tema en un curso estructurado.', icon: GraduationCap },
    { id: 'comics', title: 'Crear Historietas', description: 'Convierte ideas en narrativas visuales tipo cómic.', icon: BookImage },
    { id: 'books', title: 'Crear Libros', description: 'Genera un libro completo con capítulos e ilustraciones.', icon: BookCopy },
    { id: 'tales', title: 'Crear Cuentos Ilustrados', description: 'Da vida a cuentos cortos con imágenes evocadoras.', icon: Brush },
    { id: 'educational', title: 'Material Educativo', description: 'Desarrolla guías, resúmenes y material de estudio.', icon: School },
    { id: 'kids', title: 'Contenido Infantil', description: 'Crea historias y actividades para los más pequeños.', icon: Baby },
    { id: 'spiritual', title: 'Historias Bíblicas / Espirituales', description: 'Ilustra y narra pasajes o conceptos espirituales.', icon: Hand },
    { id: 'therapeutic', title: 'Contenido Psicoeducativo', description: 'Genera recursos sobre bienestar emocional y mental.', icon: ShieldQuestion },
];

interface CreatorModeSelectorProps {
  onSelectMode: (mode: CreatorMode) => void;
}

export default function CreatorModeSelector({ onSelectMode }: CreatorModeSelectorProps) {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Selecciona un Modo de Creación</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Elige el tipo de contenido que quieres generar. La IA adaptará la estructura, el tono y el estilo visual.
        </p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
      >
        {modes.map((mode, index) => (
          <motion.div
            key={mode.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <CreatorCard
              title={mode.title}
              description={mode.description}
              icon={mode.icon}
              onClick={() => onSelectMode(mode.id as CreatorMode)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
