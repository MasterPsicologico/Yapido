'use client';

import * as React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import type { CourseStructure } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Image as ImageIcon, ChevronLeft, ChevronRight, CheckCircle, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { generateChapterContent, generateImagePrompt, generateImageX } from '@/app/creator/actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { useCourseHistory } from './useCourseHistory';
import { useCourseProgress } from './useCourseProgress';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';


const CourseIndex = React.memo(({ course, chapterStatus, handleSelectChapter, selectedChapter, scrollProgress }: {
    course: CourseStructure;
    chapterStatus: Record<string, 'idle' | 'processing' | 'done'>;
    handleSelectChapter: (moduleIndex: number, chapterIndex: number) => void;
    selectedChapter: { moduleIndex: number; chapterIndex: number } | null;
    scrollProgress: Record<string, number>;
}) => {
    return (
        <div className="h-full p-4 space-y-4">
            {course.modules.map((module, moduleIndex) => {
                const chaptersInModule = module.chapters.length;
                const completedChapters = module.chapters.filter((_, cIdx) => scrollProgress[`${moduleIndex}-${cIdx}`] >= 100).length;
                const moduleProgress = chaptersInModule > 0 ? (completedChapters / chaptersInModule) * 100 : 0;
                
                return (
                <Card key={moduleIndex} className="bg-card/50 overflow-hidden">
                    <CardHeader className="p-4">
                        <CardTitle className="text-base">{module.title}</CardTitle>
                         {chaptersInModule > 0 && (
                            <div className="space-y-1 pt-1">
                                <Progress value={moduleProgress} className="h-1"/>
                                <p className="text-xs text-muted-foreground">{completedChapters} de {chaptersInModule} capítulos completados</p>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        <ul className="divide-y divide-border/50">
                            {module.chapters.map((chapter, chapterIndex) => {
                                const chapterKey = `${moduleIndex}-${chapterIndex}`;
                                const status = chapterStatus[chapterKey] || 'idle';
                                const readingProgress = scrollProgress[chapterKey] || 0;
                                return (
                                    <li key={chapterIndex} className="relative">
                                        <button
                                            onClick={() => handleSelectChapter(moduleIndex, chapterIndex)}
                                            className={cn(
                                                "w-full text-left p-3 text-sm transition-colors flex items-center justify-between gap-3",
                                                selectedChapter?.moduleIndex === moduleIndex && selectedChapter?.chapterIndex === chapterIndex
                                                    ? "bg-primary/10"
                                                    : "hover:bg-accent/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <p className={cn(
                                                    "whitespace-normal break-words", 
                                                    selectedChapter?.moduleIndex === moduleIndex && selectedChapter?.chapterIndex === chapterIndex && "text-primary font-semibold"
                                                )}>
                                                    {chapter.title}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                                {status === 'processing' ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                ) : status === 'done' ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : null}
                                            </div>
                                        </button>
                                        {status === 'done' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 px-3 pointer-events-none">
                                                <Progress value={readingProgress} className="h-1 w-full bg-accent/10 [&>div]:bg-primary/50" />
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </CardContent>
                </Card>
            )})}
        </div>
    );
});
CourseIndex.displayName = 'CourseIndex';

const ChapterContent = React.memo(({ selectedChapter, course, generatedContent, chapterStatus, isMobile, setSelectedChapter, prevChapter, nextChapter, handleSelectChapter, isBulkGenerating }: {
    selectedChapter: { moduleIndex: number; chapterIndex: number } | null;
    course: CourseStructure;
    generatedContent: Record<string, { content?: string, imageUrl?: string }>;
    chapterStatus: Record<string, 'idle' | 'processing' | 'done'>;
    isMobile: boolean;
    setSelectedChapter: (chapter: { moduleIndex: number; chapterIndex: number } | null) => void;
    prevChapter: { moduleIndex: number; chapterIndex: number } | null;
    nextChapter: { moduleIndex: number; chapterIndex: number } | null;
    handleSelectChapter: (moduleIndex: number, chapterIndex: number) => void;
    isBulkGenerating: boolean;
}) => {
    const activeChapterKey = selectedChapter ? `${selectedChapter.moduleIndex}-${selectedChapter.chapterIndex}` : null;
    const activeChapterData = activeChapterKey ? course.modules[selectedChapter!.moduleIndex].chapters[selectedChapter!.chapterIndex] : null;
    const activeChapterContent = activeChapterKey ? generatedContent[activeChapterKey]?.content : null;
    const activeChapterImageUrl = activeChapterKey ? generatedContent[activeChapterKey]?.imageUrl : null;
    const isLoadingThisChapter = activeChapterKey ? chapterStatus[activeChapterKey] === 'processing' : false;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeChapterKey || 'empty'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeChapterData ? (
                        <>
                            {isMobile && (
                                <Button onClick={() => setSelectedChapter(null)} variant="ghost" className="mb-4 -ml-4">
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Volver al Índice
                                </Button>
                            )}
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-6 bg-card">
                                {isLoadingThisChapter && !activeChapterImageUrl ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 p-4 text-center">
                                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2"/>
                                      <p className="text-sm text-muted-foreground">Generando imagen...</p>
                                    </div>
                                ) : activeChapterImageUrl ? (
                                    <Image 
                                        src={activeChapterImageUrl}
                                        alt={activeChapterData.title}
                                        layout="fill"
                                        objectFit="cover"
                                        className="transition-transform duration-500 hover:scale-105"
                                        data-ai-hint="abstract education"
                                    />
                                ): (
                                    <div className="w-full h-full flex items-center justify-center bg-muted/50">
                                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                                    <h2 className="text-xl sm:text-3xl font-bold text-white shadow-2xl">{activeChapterData.title}</h2>
                                </div>
                            </div>
                            <div className="prose dark:prose-invert max-w-none break-words">
                                {isLoadingThisChapter && !activeChapterContent ? (
                                     <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <Loader2 className="h-4 w-4 animate-spin"/>
                                          <span>Generando contenido...</span>
                                        </div>
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                ) : activeChapterContent ? (
                                    <ReactMarkdown>{activeChapterContent}</ReactMarkdown>
                                ) : (
                                    <p className="text-muted-foreground">Haz clic para generar el contenido de este capítulo.</p>
                                )}
                            </div>

                             <div className="flex justify-between mt-12 border-t pt-6">
                                <Button variant="outline" onClick={() => prevChapter && handleSelectChapter(prevChapter.moduleIndex, prevChapter.chapterIndex)} disabled={!prevChapter || isBulkGenerating}>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Anterior
                                </Button>
                                <Button onClick={() => nextChapter && handleSelectChapter(nextChapter.moduleIndex, nextChapter.chapterIndex)} disabled={!nextChapter || isBulkGenerating}>
                                    Siguiente
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-96 text-center">
                            <p className="text-muted-foreground">Selecciona un capítulo del índice para ver su contenido.</p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
});
ChapterContent.displayName = 'ChapterContent';


interface CourseDisplayProps {
  initialStructure: CourseStructure;
  onReset: () => void;
}

export default function CourseDisplay({ initialStructure, onReset }: CourseDisplayProps) {
  const [course, setCourse] = useState<CourseStructure>(initialStructure);
  const [generatedContent, setGeneratedContent] = useState<Record<string, { content?: string, imageUrl?: string }>>({});
  const [chapterStatus, setChapterStatus] = useState<Record<string, 'idle' | 'processing' | 'done'>>({});
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<{ moduleIndex: number; chapterIndex: number } | null>(null);
  
  const { toast } = useToast();
  const { updateCourseHistory } = useCourseHistory();
  const { progress: scrollProgress, updateChapterProgress } = useCourseProgress(course?.id);
  const isMobile = useIsMobile();
  
  // Create refs for the scrolling containers
  const mainContentRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);


  useEffect(() => {
    setCourse(initialStructure);
    const initialContent: Record<string, { content?: string, imageUrl?: string }> = {};
    const initialStatus: Record<string, 'idle' | 'processing' | 'done'> = {};
    if (initialStructure.modules) {
      initialStructure.modules.forEach((mod, mIdx) => {
        if (mod.chapters) {
          mod.chapters.forEach((chap, cIdx) => {
            const chapterKey = `${mIdx}-${cIdx}`;
            const isDone = !!(chap.content && chap.imageUrl);
            initialStatus[chapterKey] = isDone ? 'done' : 'idle';
            if (isDone) {
              initialContent[chapterKey] = {
                content: chap.content,
                imageUrl: chap.imageUrl,
              };
            }
          });
        }
      });
    }
    setGeneratedContent(initialContent);
    setChapterStatus(initialStatus);
    setSelectedChapter(null);
    setIsBulkGenerating(false);
  }, [initialStructure]);

  const generateSingleChapterAndUpdate = useCallback(async (
    currentCourse: CourseStructure,
    moduleIndex: number,
    chapterIndex: number
  ): Promise<CourseStructure> => {
    const chapterKey = `${moduleIndex}-${chapterIndex}`;
    setChapterStatus(prev => ({ ...prev, [chapterKey]: 'processing' }));
    
    try {
      const chapter = currentCourse.modules[moduleIndex].chapters[chapterIndex];

      const { content } = await generateChapterContent({
        courseTitle: currentCourse.title,
        moduleTitle: currentCourse.modules[moduleIndex].title,
        chapterTitle: chapter.title,
      });
      if (!content) throw new Error('La IA no pudo generar el contenido.');

      const { imagePrompt } = await generateImagePrompt({
        title: chapter.title,
        context: content.substring(0, 300),
      });
      if (!imagePrompt) throw new Error("No se pudo crear un prompt para la imagen.");

      const { imageUrl } = await generateImageX({ prompt: imagePrompt });
      if (!imageUrl) throw new Error("La IA no pudo generar la imagen.");

      setGeneratedContent(prev => ({ ...prev, [chapterKey]: { content, imageUrl } }));
      
      const updatedCourse = JSON.parse(JSON.stringify(currentCourse)); // Deep copy for safety
      updatedCourse.modules[moduleIndex].chapters[chapterIndex] = { ...chapter, content, imageUrl };
      
      await updateCourseHistory(updatedCourse);
      
      setChapterStatus(prev => ({ ...prev, [chapterKey]: 'done' }));
      return updatedCourse;
    } catch (error) {
      setChapterStatus(prev => ({ ...prev, [chapterKey]: 'idle' }));
      throw error;
    }
  }, [updateCourseHistory]);

  const handleBulkGenerate = async () => {
    setIsBulkGenerating(true);
    toast({ title: 'Iniciando creación completa', description: 'La IA generará todos los capítulos secuencialmente.' });
    
    let currentCourseState = JSON.parse(JSON.stringify(course));

    for (let mIndex = 0; mIndex < currentCourseState.modules.length; mIndex++) {
      for (let cIndex = 0; cIndex < currentCourseState.modules[mIndex].chapters.length; cIndex++) {
        const chapter = currentCourseState.modules[mIndex].chapters[cIndex];

        if (!chapter.content && !chapter.imageUrl) {
          try {
            const updatedCourse = await generateSingleChapterAndUpdate(currentCourseState, mIndex, cIndex);
            currentCourseState = updatedCourse;
            setCourse(updatedCourse); // Update main state to reflect UI changes in real-time
          } catch (error: any) {
            console.error(`Error en la generación del capítulo ${chapter.title}:`, error);
            toast({
              variant: 'destructive',
              title: `Error en capítulo "${chapter.title}"`,
              description: 'Se ha detenido la generación automática. Puede continuar manualmente o reintentar.',
            });
            setIsBulkGenerating(false);
            return;
          }
        } else {
           const chapterKey = `${mIndex}-${cIndex}`;
           setChapterStatus(prev => ({ ...prev, [chapterKey]: 'done' }));
        }
      }
    }
    
    setIsBulkGenerating(false);
    toast({ title: "¡Curso completo!", description: "Se han generado todos los capítulos e imágenes." });
  };


  const handleSelectChapter = useCallback(async (moduleIndex: number, chapterIndex: number) => {
    // Scroll to top whenever a new chapter is selected
    if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
    }
    if (viewportRef.current) {
        viewportRef.current.scrollTop = 0;
    }

    if (isBulkGenerating) {
        setSelectedChapter({ moduleIndex, chapterIndex });
        return;
    }

    setSelectedChapter({ moduleIndex, chapterIndex });
    const chapterKey = `${moduleIndex}-${chapterIndex}`;
    
    if (chapterStatus[chapterKey] === 'idle') {
        try {
            const updatedCourse = await generateSingleChapterAndUpdate(course, moduleIndex, chapterIndex);
            setCourse(updatedCourse);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error de Generación',
                description: error.message || 'No se pudo generar el contenido.',
            });
            setSelectedChapter(null);
        }
    }
  }, [chapterStatus, course, generateSingleChapterAndUpdate, toast, isBulkGenerating]);

  const getAdjacentChapter = (direction: 'next' | 'prev') => {
    if (!selectedChapter) return null;
    let { moduleIndex, chapterIndex } = selectedChapter;

    if (direction === 'next') {
        if (chapterIndex < course.modules[moduleIndex].chapters.length - 1) {
            return { moduleIndex, chapterIndex: chapterIndex + 1 };
        } else if (moduleIndex < course.modules.length - 1) {
            return { moduleIndex: moduleIndex + 1, chapterIndex: 0 };
        }
    } else { // prev
        if (chapterIndex > 0) {
            return { moduleIndex, chapterIndex: chapterIndex - 1 };
        } else if (moduleIndex > 0) {
            const prevModuleIndex = moduleIndex - 1;
            const prevModuleChapterCount = course.modules[prevModuleIndex].chapters.length;
            return { moduleIndex: prevModuleIndex, chapterIndex: prevModuleChapterCount - 1 };
        }
    }
    return null;
  };
  
  const nextChapter = getAdjacentChapter('next');
  const prevChapter = getAdjacentChapter('prev');

  const totalChapters = useMemo(() => {
      return course.modules.reduce((acc, mod) => acc + (mod.chapters?.length || 0), 0);
  }, [course.modules]);
  
  const overallReadingProgress = useMemo(() => {
    if (totalChapters === 0) return 0;
    const totalProgressSum = Object.values(scrollProgress).reduce((sum, progress) => sum + progress, 0);
    return totalProgressSum / totalChapters;
  }, [scrollProgress, totalChapters]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!selectedChapter) return;
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const chapterKey = `${selectedChapter.moduleIndex}-${selectedChapter.chapterIndex}`;

    let progress = 0;
    if (scrollHeight > clientHeight) {
      progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    } else if (scrollHeight > 0) {
      progress = 100;
    }
    
    updateChapterProgress(chapterKey, progress);
  };

  return (
    <div className="flex h-full flex-col">
        <div className="p-4 border-b flex-shrink-0">
             <div className="max-w-7xl mx-auto space-y-3">
                <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                        <p className="text-sm text-primary font-semibold">Curso Generado</p>
                        <h1 className="text-xl font-bold truncate">{course.title}</h1>
                    </div>
                    <Button onClick={handleBulkGenerate} disabled={isBulkGenerating}>
                        {isBulkGenerating ? (
                            <Loader2 className="h-5 w-5 animate-spin"/>
                        ) : (
                            <Wand2 className="h-5 w-5"/>
                        )}
                        <span className="ml-2 hidden sm:inline">
                          {isBulkGenerating ? "Creando..." : "Creación Completa"}
                        </span>
                    </Button>
                </div>
                 <div>
                    <Progress value={overallReadingProgress} className="h-2"/>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Progreso de Lectura</span>
                        <span>{Math.round(overallReadingProgress)}% completado</span>
                    </div>
                </div>
            </div>
        </div>
        
        {isMobile ? (
             <ScrollArea className="flex-1" onScroll={handleScroll} viewportRef={viewportRef}>
                 {selectedChapter ? (
                     <ChapterContent 
                        selectedChapter={selectedChapter}
                        course={course}
                        generatedContent={generatedContent}
                        chapterStatus={chapterStatus}
                        isMobile={isMobile}
                        setSelectedChapter={setSelectedChapter}
                        prevChapter={prevChapter}
                        nextChapter={nextChapter}
                        handleSelectChapter={handleSelectChapter}
                        isBulkGenerating={isBulkGenerating}
                     />
                 ) : (
                     <CourseIndex 
                        course={course}
                        chapterStatus={chapterStatus}
                        handleSelectChapter={handleSelectChapter}
                        selectedChapter={selectedChapter}
                        scrollProgress={scrollProgress}
                     />
                 )}
             </ScrollArea>
        ) : (
            <div className="grid md:grid-cols-12 flex-1 overflow-auto max-w-7xl mx-auto w-full">
                <aside className="md:col-span-4 lg:col-span-3 border-r">
                    <ScrollArea className="h-full">
                        <CourseIndex 
                            course={course}
                            chapterStatus={chapterStatus}
                            handleSelectChapter={handleSelectChapter}
                            selectedChapter={selectedChapter}
                            scrollProgress={scrollProgress}
                        />
                    </ScrollArea>
                </aside>
                <main ref={mainContentRef} className="md:col-span-8 lg:col-span-9 overflow-y-auto" onScroll={handleScroll}>
                   <ChapterContent 
                        selectedChapter={selectedChapter}
                        course={course}
                        generatedContent={generatedContent}
                        chapterStatus={chapterStatus}
                        isMobile={isMobile}
                        setSelectedChapter={setSelectedChapter}
                        prevChapter={prevChapter}
                        nextChapter={nextChapter}
                        handleSelectChapter={handleSelectChapter}
                        isBulkGenerating={isBulkGenerating}
                   />
                </main>
            </div>
        )}
    </div>
  );
}
