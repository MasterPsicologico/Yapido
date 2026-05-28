'use client';

import { useCourseHistory } from './useCourseHistory';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, History, PlusCircle, School } from 'lucide-react';
import type { CourseStructure } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SheetHeader, SheetTitle } from '../ui/sheet';
import Image from 'next/image';
import Link from 'next/link';

interface CourseHistoryProps {
    onSelectCourse: () => void;
    onGoToCreator: () => void;
}

export default function CourseHistory({ onSelectCourse, onGoToCreator }: CourseHistoryProps) {
  const { courses, isLoading, deleteCourse, clearHistory } = useCourseHistory();

  const getFormattedDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="h-full flex flex-col">
       <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Creaciones
            </span>
             <Button variant="outline" size="sm" onClick={onGoToCreator}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Curso
            </Button>
          </SheetTitle>
        </SheetHeader>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : courses.length > 0 ? (
            courses.map(course => {
              const relativeDate = getFormattedDate(course.createdAt);
              const imageUrl = course.modules?.[0]?.chapters?.[0]?.imageUrl;
              const totalChapters = course.modules.reduce((acc, mod) => acc + (mod.chapters?.length || 0), 0);

              return (
                 <div key={course.id} className="group relative">
                    <Link href={`/creator/courses/${course.id}`} passHref onClick={onSelectCourse}>
                        <Card className="overflow-hidden transition-all hover:shadow-lg bg-card/50 hover:bg-card/80 cursor-pointer">
                          <div className="flex gap-4">
                            <div className="relative h-28 w-28 flex-shrink-0 bg-muted/50">
                              {imageUrl ? (
                                <Image 
                                  src={imageUrl} 
                                  alt={`Previsualización de ${course.title}`}
                                  layout="fill"
                                  objectFit="cover" 
                                  className="group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <School className="h-full w-full p-8 text-muted-foreground/50" />
                              )}
                            </div>
                            <div className="flex min-w-0 flex-col justify-center py-2 pr-10">
                              <h3 className="font-semibold text-sm text-foreground group-hover:text-primary">
                                {course.title}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {course.modules.length} Módulos • {totalChapters} Capítulos
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {relativeDate}
                              </p>
                            </div>
                          </div>
                        </Card>
                    </Link>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-destructive/70 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4"/>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar este curso?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción es permanente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCourse(course.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm">
                <p>No has generado ningún curso.</p>
            </div>
          )}
        </div>
      </ScrollArea>
       {courses.length > 0 && (
           <div className="p-2 border-t border-sidebar-border">
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="ghost" size="sm" className="w-full justify-center text-xs text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="mr-2 h-3 w-3" />
                      Limpiar Historial
                     </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>Esto eliminará permanentemente TODOS los cursos de tu historial local.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={clearHistory} className="bg-destructive hover:bg-destructive/90">Sí, limpiar todo</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
           </div>
        )}
    </div>
  );
}
