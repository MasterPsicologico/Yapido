
'use client';

import { useComicHistory } from './useComicHistory';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, History, PlusCircle, BookImage } from 'lucide-react';
import type { ComicCreation } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SheetHeader, SheetTitle } from '../ui/sheet';
import Image from 'next/image';
import Link from 'next/link';

interface ComicHistoryProps {
    onGoToCreator: () => void;
    onSelectComic: () => void;
}

export default function ComicHistory({ onGoToCreator, onSelectComic }: ComicHistoryProps) {
  const { comics, isLoading, deleteComic, clearHistory } = useComicHistory();

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
                Historial de Historietas
            </span>
             <Button variant="outline" size="sm" onClick={onGoToCreator}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Historieta
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
          ) : comics.length > 0 ? (
            comics.map(comic => {
              const relativeDate = getFormattedDate(comic.createdAt);
              const imageUrl = comic.pages?.[0]?.imageUrl;
              
              return (
                 <div key={comic.id} className="group relative">
                    <Link href={`/creator/comics/${comic.id}`} passHref onClick={onSelectComic} className="block">
                      <Card className="overflow-hidden transition-all bg-card/50 hover:bg-card/80 cursor-pointer">
                        <div className="flex gap-4">
                          <div className="relative h-28 w-28 flex-shrink-0 bg-muted/50">
                            {imageUrl && imageUrl !== 'error' ? (
                              <Image 
                                src={imageUrl} 
                                alt={`Previsualización de ${comic.story}`}
                                layout="fill"
                                objectFit="cover" 
                                className="group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <BookImage className="h-full w-full p-8 text-muted-foreground/50" />
                            )}
                          </div>
                          <div className="flex min-w-0 flex-col justify-center py-2 pr-10">
                            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary whitespace-normal break-words">
                              {comic.story}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {comic.pages?.length || 0} Páginas
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
                            <AlertDialogTitle>¿Eliminar esta historieta?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción es permanente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={(e) => { e.preventDefault(); deleteComic(comic.id); }} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm">
                <p>No has generado ninguna historieta.</p>
            </div>
          )}
        </div>
      </ScrollArea>
       {comics.length > 0 && (
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
                      <AlertDialogDescription>Esto eliminará permanentemente TODAS las historietas de tu historial local.</AlertDialogDescription>
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
