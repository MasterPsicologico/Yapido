'use client';

import { useAudioDrafts } from './useAudioDrafts';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircle, Music4 } from 'lucide-react';
import type { AudioDraft } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

interface DraftListProps {
  onSelectDraft: (draft: AudioDraft) => void;
  onNewRecording: () => void;
  activeDraftId?: string | null;
}

export default function DraftList({ onSelectDraft, onNewRecording, activeDraftId }: DraftListProps) {
  const { drafts, isLoading } = useAudioDrafts();

  const getFormattedDate = (date: Date) => {
    return {
      relative: formatDistanceToNow(date, { addSuffix: true, locale: es }),
      absolute: format(date, "d MMM, HH:mm", { locale: es }),
    };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <Button onClick={onNewRecording} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Grabación
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 pt-2 space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : drafts.length > 0 ? (
            drafts.map(draft => {
              const { relative } = getFormattedDate(new Date(draft.timestamp));
              return (
                <Card 
                  key={draft.id} 
                  className={cn("cursor-pointer bg-card/50 hover:bg-card/80 transition-colors", activeDraftId === draft.id && "border-primary bg-primary/10")}
                  onClick={() => onSelectDraft(draft)}
                >
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-semibold truncate">{draft.title}</CardTitle>
                    <CardDescription className="text-xs">{relative}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm">
                <Music4 className="mx-auto h-8 w-8 mb-2"/>
                <p>No hay grabaciones guardadas.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
