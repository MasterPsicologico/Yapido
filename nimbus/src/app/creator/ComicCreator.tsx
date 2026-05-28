

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, AlertTriangle, RefreshCcw, BookCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { generateComicAnalysisFlow, generateComicPageFlow, continueComicStoryFlow } from '@/app/creator/actions';
import type { GeneratedComicPage, ComicAnalysis, ComicCreation } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent } from '../ui/card';
import { useComicHistory } from './useComicHistory';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { Label } from '../ui/label';

const ComicDisplay = ({ pages, isRegenerating, onRegenerate, onNotesChange, regenNotes }: { 
    pages: GeneratedComicPage[], 
    isRegenerating: Record<number, boolean>, 
    onRegenerate: (pageIndex: number) => void,
    onNotesChange: (index: number, text: string) => void,
    regenNotes: Record<number, string>,
}) => (
    <div className="w-full max-w-2xl mx-auto space-y-8">
        {pages.map((page, index) => (
            <motion.div
                key={`${page.pageNumber}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
            >
                <Card className="overflow-hidden bg-card/50">
                    <div className="relative aspect-square sm:aspect-[4/5] md:aspect-[3/4]">
                        {isRegenerating[index] ? (
                            <div className="w-full h-full bg-muted/50 flex flex-col items-center justify-center text-primary text-center p-4">
                                <Loader2 className="h-8 w-8 animate-spin"/>
                                <p className="text-xs font-semibold mt-2">Recreando escena...</p>
                            </div>
                        ) : page.imageUrl && page.imageUrl !== 'error' ? (
                           <Image src={page.imageUrl} alt={`Página ${page.pageNumber}`} layout="fill" objectFit="cover" />
                        ) : page.imageUrl === 'error' ? (
                           <div className="w-full h-full bg-destructive/10 flex items-center justify-center text-destructive text-center p-4">
                               <div>
                                   <AlertTriangle className="h-8 w-8 mx-auto"/>
                                   <p className="text-xs font-semibold mt-2">Error al generar esta página</p>
                               </div>
                           </div>
                        ) : (
                           <Skeleton className="w-full h-full bg-muted/50" />
                        )}
                    </div>
                    <CardContent className="p-4 bg-background/50">
                        {page.scenes.map((scene, sceneIdx) => (
                            <div key={sceneIdx} className="mb-2 last:mb-0">
                                {scene.narration && <p className="text-sm text-muted-foreground italic">"{scene.narration}"</p>}
                                {scene.dialogue && <p className="mt-1 text-base text-foreground">{scene.dialogue}</p>}
                            </div>
                        ))}
                         <div className="mt-4 pt-4 border-t border-dashed space-y-2">
                             <Textarea 
                                placeholder="Notas del Director para regenerar (ej: 'haz el fondo más oscuro')..."
                                value={regenNotes[index] || ''}
                                onChange={(e) => onNotesChange(index, e.target.value)}
                                className="text-xs"
                                rows={2}
                             />
                             <Button onClick={() => onRegenerate(index)} variant="outline" size="sm" disabled={isRegenerating[index]}>
                                 <RefreshCcw className="h-4 w-4 mr-2" />
                                 Regenerar Página
                             </Button>
                         </div>
                    </CardContent>
                </Card>
            </motion.div>
        ))}
    </div>
);

interface ComicCreatorProps {
    onBack: () => void;
    initialComic: ComicCreation | null;
}

export default function ComicCreator({ onBack, initialComic }: ComicCreatorProps) {
    const [story, setStory] = useState('');
    const [directorNotes, setDirectorNotes] = useState('');
    const [generationState, setGenerationState] = useState<'idle' | 'analyzing' | 'generating' | 'done'>('idle');
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [comicData, setComicData] = useState<ComicAnalysis | null>(null);
    const [isRegenerating, setIsRegenerating] = useState<Record<number, boolean>>({});
    const [regenNotes, setRegenNotes] = useState<Record<number, string>>({});
    const { toast } = useToast();
    const { addComicToHistory } = useComicHistory();
    const [isContinuing, setIsContinuing] = useState(false);
    
    useEffect(() => {
        if (initialComic) {
            setStory(initialComic.story);
            // This is tricky. We need to reconstruct a ComicAnalysis object.
            const initialAnalysis: ComicAnalysis = {
                title: initialComic.story.substring(0, 30), // approx title
                chapter: 1, // Assume chapter 1 for old data
                chapterTitle: 'Capítulo 1',
                style: initialComic.style,
                styleSeed: "unknown-seed-from-history", // placeholder
                characters: initialComic.characters,
                pages: initialComic.pages.map(p => ({
                    pageNumber: p.pageNumber,
                    panelLayout: p.panelLayout || 'auto',
                    scenes: p.scenes
                }))
            };
            setComicData(initialAnalysis);
            setGenerationState('done');
        } else {
            setStory('');
            setDirectorNotes('');
            setComicData(null);
            setGenerationState('idle');
        }
    }, [initialComic]);

    const handleReset = () => {
        onBack();
    };

    const handleGenerate = async () => {
        if (!story.trim()) {
            toast({ variant: 'destructive', title: 'Historia Vacía', description: 'Por favor, escribe una idea para tu cómic.' });
            return;
        }

        setGenerationState('analyzing');
        setComicData(null);
        setProgress({ current: 0, total: 0 });

        try {
            // Step 1: Analyze Story & Create Script/Layout
            const analysis: ComicAnalysis = await generateComicAnalysisFlow({ story, directorNotes });
            if (!analysis || !analysis.pages || analysis.pages.length === 0) {
                 throw new Error("La IA no pudo dividir la historia en páginas.");
            }
            
            const placeholderPages: GeneratedComicPage[] = analysis.pages.map(page => ({
                pageNumber: page.pageNumber,
                scenes: page.scenes,
                panelLayout: page.panelLayout,
                imageUrl: '',
            }));
            
            setComicData({ ...analysis, pages: placeholderPages });

            // Step 2: Generate Pages sequentially
            setGenerationState('generating');
            const totalPages = analysis.pages.length;
            setProgress({ current: 0, total: totalPages });
            
            let finalPages: GeneratedComicPage[] = [];

            for (let i = 0; i < totalPages; i++) {
                setProgress(prev => ({ ...prev, current: i + 1 }));
                const page = analysis.pages[i];
                let newPage: GeneratedComicPage;
                try {
                    const { imageUrl, postGenerationDescription } = await generateComicPageFlow({ page, characters: analysis.characters, style: analysis.style, styleSeed: analysis.styleSeed, directorNotes });
                    newPage = { ...page, imageUrl, scenes: page.scenes.map(s => ({...s, postGenerationDescription})) };
                } catch (pageError) {
                     console.error(`Error generating page ${i + 1}:`, pageError);
                     newPage = { ...page, imageUrl: 'error' };
                }
                finalPages.push(newPage);
                 setComicData(prev => prev ? ({ ...prev, pages: prev.pages.map((p, idx) => idx === i ? newPage : p) }) : null);
            }

            setGenerationState('done');
            toast({ title: '¡Capítulo 1 Completo!', description: 'Todas las páginas han sido generadas.' });
            
            const finalAnalysis = { ...analysis, pages: finalPages };
            setComicData(finalAnalysis);
            
            await addComicToHistory({
                id: initialComic?.id || uuidv4(),
                story,
                style: finalAnalysis.style,
                characters: finalAnalysis.characters,
                pages: finalAnalysis.pages,
                createdAt: initialComic?.createdAt || new Date().toISOString()
            });

        } catch (error: any) {
            console.error('Error generating comic:', error);
            toast({ variant: 'destructive', title: 'Error de Creación', description: error.message || 'No se pudo generar el cómic.' });
            setGenerationState('idle');
        }
    };
    
    const handleRegeneratePage = async (pageIndex: number) => {
        if (!comicData) return;

        setIsRegenerating(prev => ({ ...prev, [pageIndex]: true }));
        
        const pageToRegenerate = comicData.pages[pageIndex];

        try {
            const { imageUrl } = await generateComicPageFlow({
                page: pageToRegenerate,
                characters: comicData.characters,
                style: comicData.style,
                styleSeed: comicData.styleSeed,
                directorNotes: regenNotes[pageIndex] || undefined,
            });
            
            const updatedPages = comicData.pages.map((p, idx) => idx === pageIndex ? {...p, imageUrl} : p);
            const updatedComicData = {...comicData, pages: updatedPages };
            setComicData(updatedComicData);

            await addComicToHistory({
                id: initialComic?.id || uuidv4(),
                story: story,
                ...updatedComicData
            });
            toast({title: "Página Regenerada", description: "La página ha sido actualizada con una nueva versión."})

        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error de Regeneración',
                description: 'No se pudo volver a generar esta página.',
            });
        } finally {
            setIsRegenerating(prev => ({ ...prev, [pageIndex]: false }));
        }
    };

     const handleContinueStory = async () => {
        if (!comicData) return;
        setIsContinuing(true);
        toast({title: 'Continuando la Saga...', description: 'El guionista está escribiendo el siguiente capítulo.'});

        try {
            const nextChapterAnalysis = await continueComicStoryFlow({ previousAnalysis: comicData });
            
            const newChapterPages = nextChapterAnalysis.pages;
            
            setComicData(prev => prev ? ({
                ...prev,
                chapter: nextChapterAnalysis.chapter,
                chapterTitle: nextChapterAnalysis.chapterTitle,
                pages: [...prev.pages, ...newChapterPages.map(p => ({...p, imageUrl: ''}))], // Add placeholders
            }) : null);

            setGenerationState('generating');
            const totalPages = comicData.pages.length + newChapterPages.length;
            const startIdx = comicData.pages.length;

            let currentPages = [...comicData.pages];

            for (let i = 0; i < newChapterPages.length; i++) {
                const pageIdx = startIdx + i;
                setProgress({ current: pageIdx + 1, total: totalPages });
                const page = newChapterPages[i];
                let newPage: GeneratedComicPage;
                try {
                    const { imageUrl, postGenerationDescription } = await generateComicPageFlow({ 
                        page, 
                        characters: comicData.characters, 
                        style: comicData.style, 
                        styleSeed: comicData.styleSeed 
                    });
                    newPage = { ...page, imageUrl, scenes: page.scenes.map(s => ({...s, postGenerationDescription})) };
                } catch (e) {
                    console.error("error generating continued page", e);
                    newPage = { ...page, imageUrl: 'error' };
                }
                currentPages.push(newPage);
                 setComicData(prev => prev ? ({...prev, pages: currentPages}) : null);
            }
            
            setGenerationState('done');
            toast({title: `¡Capítulo ${nextChapterAnalysis.chapter} Completo!`, description: "La historia continúa."});

        } catch (error) {
            console.error("Failed to continue story", error);
            toast({variant: 'destructive', title: "Error al continuar", description: "No se pudo generar el siguiente capítulo."});
        } finally {
            setIsContinuing(false);
        }
    }

    if (generationState !== 'idle' || comicData) {
         return (
             <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
                    <Button onClick={handleReset} variant="outline">
                        Crear Nueva Historieta
                    </Button>
                     {generationState === 'done' && (
                        <Button onClick={handleContinueStory} disabled={isContinuing}>
                            {isContinuing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BookCopy className="h-4 w-4 mr-2" />}
                            {isContinuing ? 'Escribiendo...' : 'Continuar Historia'}
                        </Button>
                     )}
                </div>
                 
                 {comicData && (
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold">{comicData.title}</h2>
                        <p className="text-lg text-primary font-semibold">{`Capítulo ${comicData.chapter}: ${comicData.chapterTitle}`}</p>
                    </div>
                 )}

                {(generationState === 'analyzing' || generationState === 'generating') && (
                    <div className="mb-8">
                        <Progress value={generationState === 'analyzing' ? 5 : (progress.current / progress.total) * 100} className="w-full h-2" />
                        <p className="text-center text-sm text-muted-foreground mt-2">
                           {generationState === 'analyzing' 
                             ? 'El guionista está analizando la historia...' 
                             : `Generando página ${progress.current} de ${progress.total}...`
                           }
                        </p>
                    </div>
                )}

                {comicData?.pages && <ComicDisplay pages={comicData.pages} isRegenerating={isRegenerating} onRegenerate={handleRegeneratePage} onNotesChange={(index, text) => setRegenNotes(prev => ({...prev, [index]: text}))} regenNotes={regenNotes} />}
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Creador de Historietas</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Escribe tu historia, una idea o un recuerdo. La IA lo transformará en una historieta visual y profesional, página por página.
                </p>
            </motion.div>

            <div className="mt-8 max-w-2xl mx-auto space-y-4">
                 <div>
                    <Label htmlFor="story-input" className="sr-only">Tu Historia</Label>
                    <Textarea
                        id="story-input"
                        value={story}
                        onChange={(e) => setStory(e.target.value)}
                        placeholder="Ej: Un astronauta encuentra una flor solitaria en un planeta desolado y decide cuidarla..."
                        className="min-h-[150px] text-base"
                        disabled={generationState !== 'idle'}
                    />
                 </div>
                 <div>
                    <Label htmlFor="director-notes" className="text-left block mb-1 text-sm font-medium text-muted-foreground">Notas del Director (Opcional)</Label>
                    <Textarea
                        id="director-notes"
                        value={directorNotes}
                        onChange={(e) => setDirectorNotes(e.target.value)}
                        placeholder="Ej: 'Estilo visual oscuro y gótico', 'que el personaje secundario sea un robot oxidado', 'un final agridulce'..."
                        className="text-base"
                        disabled={generationState !== 'idle'}
                        rows={2}
                    />
                 </div>
                <Button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generationState !== 'idle'}
                    className="mt-4 h-12 px-8 text-base"
                    size="lg"
                >
                    {generationState !== 'idle' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                    <span className="ml-2">{generationState !== 'idle' ? 'Generando...' : 'Generar Historieta'}</span>
                </Button>
            </div>
        </div>
    );
}
