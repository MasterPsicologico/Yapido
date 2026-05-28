'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, History } from 'lucide-react';
import Link from 'next/link';
import CreatorModeSelector from '@/components/creator/CreatorModeSelector';
import CourseCreator from '@/components/creator/CourseCreator';
import ComicCreator from '@/components/creator/ComicCreator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import CourseHistory from '@/components/creator/CourseHistory';
import ComicHistory from '@/components/creator/ComicHistory';
import type { CourseStructure, ComicCreation } from '@/lib/types';
import { useCourseHistory } from '@/components/creator/useCourseHistory';
import { useComicHistory } from '@/components/creator/useComicHistory';


export type CreatorMode = 
  | 'courses' 
  | 'comics' 
  | 'books' 
  | 'tales' 
  | 'educational' 
  | 'kids' 
  | 'spiritual' 
  | 'therapeutic'
  | null;

export default function GICIPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.slug) ? params.slug : [];
  
  const activeModeFromSlug = (slug[0] as CreatorMode) || null;
  const itemId = slug[1] || null;

  const { courses, isLoading: coursesHistoryLoading } = useCourseHistory();
  const { comics, isLoading: comicsHistoryLoading } = useComicHistory();

  const [activeMode, setActiveMode] = useState<CreatorMode>(activeModeFromSlug);
  
  const [initialCourse, setInitialCourse] = useState<CourseStructure | null>(null);
  const [initialComic, setInitialComic] = useState<ComicCreation | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isHistoryLoading = coursesHistoryLoading || comicsHistoryLoading;

  // This effect will sync the component state with the URL
  useEffect(() => {
    const newMode = (slug[0] as CreatorMode) || null;
    const currentItemId = slug[1] || null;

    setActiveMode(newMode);
    
    // Reset initial data when mode changes or no item is selected
    if (newMode !== 'courses' || !currentItemId) {
        setInitialCourse(null);
    }
    if (newMode !== 'comics' || !currentItemId) {
        setInitialComic(null);
    }
    
    if (isHistoryLoading) return; // Wait for histories to load

    if (newMode === 'courses' && currentItemId) {
      const foundCourse = courses.find(c => c.id === currentItemId);
      if (foundCourse) {
        setInitialCourse(foundCourse);
      } else {
        router.replace('/creator/courses');
      }
    } else if (newMode === 'comics' && currentItemId) {
      const foundComic = comics.find(c => c.id === currentItemId);
      if (foundComic) {
        setInitialComic(foundComic);
      } else {
        router.replace('/creator/comics');
      }
    }

  }, [slug, courses, comics, isHistoryLoading, router]);

  const handleSetMode = (mode: CreatorMode) => {
      setActiveMode(mode);
      if (mode) {
          router.push(`/creator/${mode}`);
      } else {
          router.push('/creator');
      }
  }

  const handleBack = () => {
    // If we are viewing an item, back goes to the mode's root.
    // If we are at the mode's root, back goes to the mode selector.
    if (itemId) {
        router.push(`/creator/${activeMode}`);
    } else {
        handleSetMode(null);
    }
  };

  const handleHistorySelection = () => {
    // The Link component in history handles navigation, just close sheet
    setIsSheetOpen(false);
  };
  
  const handleGoToCreator = () => {
      if (activeMode) {
          router.push(`/creator/${activeMode}`);
      } else {
          router.push('/creator');
      }
      setIsSheetOpen(false);
  }

  const renderActiveMode = () => {
    switch(activeMode) {
      case 'courses':
        return <CourseCreator onBack={handleBack} initialCourse={initialCourse} />;
      case 'comics':
        return <ComicCreator onBack={handleBack} initialComic={initialComic} />;
      default:
        return <CreatorModeSelector onSelectMode={handleSetMode} />;
    }
  };

  const renderHistorySheet = () => {
      switch(activeMode) {
          case 'comics':
              return <ComicHistory onGoToCreator={handleGoToCreator} onSelectComic={handleHistorySelection} />;
          case 'courses':
          default: // Default to course history if no mode or other modes
              return <CourseHistory onSelectCourse={handleHistorySelection} onGoToCreator={handleGoToCreator} />;
      }
  }


  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex-shrink-0 flex items-center justify-between p-2 md:p-4 border-b">
        <div className="flex items-center gap-2">
            <Button 
                asChild={!activeMode}
                variant="ghost" 
                size="icon" 
                className="-ml-2 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                onClick={activeMode ? handleBack : undefined}
            >
                {activeMode && !itemId ? (
                     <div onClick={handleBack} className="cursor-pointer">
                        <ChevronLeft className="h-5 w-5" />
                    </div>
                ) : (
                    <Link href={activeMode && itemId ? `/creator/${activeMode}` : "/"}>
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                )}
            </Button>
            <div>
                <h1 className="text-xl font-bold tracking-tight text-primary">GICI</h1>
                <p className="text-xs text-muted-foreground">Generador Inteligente de Contenido Ilustrado</p>
            </div>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
             <Button variant="outline">
              <History className="mr-2 h-4 w-4"/>
              Historial
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full max-w-md p-0">
             {renderHistorySheet()}
          </SheetContent>
        </Sheet>
      </header>
      <main className="flex-1 overflow-y-auto">
        {renderActiveMode()}
      </main>
    </div>
  );
}
