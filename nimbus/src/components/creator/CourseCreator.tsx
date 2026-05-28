'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateCourseStructure } from '@/app/creator/actions';
import type { CourseStructure } from '@/lib/types';
import CourseDisplay from './CourseDisplay';
import { AnimatePresence, motion } from 'framer-motion';
import { useCourseHistory } from './useCourseHistory';
import { v4 as uuidv4 } from 'uuid';

interface CourseCreatorProps {
    onBack: () => void;
    initialCourse: CourseStructure | null;
}

export default function CourseCreator({ onBack, initialCourse }: CourseCreatorProps) {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [courseStructure, setCourseStructure] = useState<CourseStructure | null>(initialCourse);
  const { toast } = useToast();
  const { addCourseToHistory } = useCourseHistory();
  const router = useRouter();

  useEffect(() => {
    setCourseStructure(initialCourse);
  }, [initialCourse]);

  const handleGenerateStructure = async () => {
    if (!topic.trim()) {
      toast({
        variant: 'destructive',
        title: 'Tema Vacío',
        description: 'Por favor, ingresa un tema para el curso.',
      });
      return;
    }
    setIsLoading(true);
    setCourseStructure(null);
    try {
      const generatedStructure = await generateCourseStructure({ topic });
      const structureWithId = { 
        ...generatedStructure, 
        id: uuidv4().slice(0, 12), // Shortened UUID
        createdAt: new Date().toISOString() 
      };
      await addCourseToHistory(structureWithId);
      router.push(`/creator/${structureWithId.id}`);
    } catch (error: any) {
      console.error('Error generating course structure:', error);
      toast({
        variant: 'destructive',
        title: 'Error de Estructuración',
        description: error.message || 'No se pudo generar la estructura del curso.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
      onBack();
  }
  
  if (courseStructure) {
    return <CourseDisplay initialStructure={courseStructure} onReset={handleReset} />;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Creación de Cursos con IA</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Introduce un tema o una palabra clave. La IA diseñará un curso completo para ti, listo para ser explorado y generado capítulo por capítulo.
            </p>
        </motion.div>
        
        <div className="mt-8 max-w-xl mx-auto">
            <div className="flex w-full items-center space-x-2">
                <Input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ej: Sueños lúcidos, Neurociencia, Cocina..."
                    className="h-12 text-base"
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateStructure()}
                />
                <Button 
                    type="button" 
                    onClick={handleGenerateStructure} 
                    disabled={isLoading}
                    className="h-12 px-6"
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                    <span className="ml-2 hidden sm:inline">{isLoading ? 'Diseñando...' : 'Diseñar Curso'}</span>
                </Button>
            </div>
        </div>

        <AnimatePresence>
        {isLoading && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-12 text-center"
            >
                <div className="inline-block p-4 bg-card/50 border rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <p className="mt-2 text-muted-foreground">La IA está diseñando el plan de estudios...</p>
            </motion.div>
        )}
        </AnimatePresence>
    </div>
  );
}
