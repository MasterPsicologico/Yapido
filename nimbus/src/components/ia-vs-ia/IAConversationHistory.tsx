'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { History, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { IAConversation } from '@/lib/types';
import { SheetHeader, SheetTitle } from '../ui/sheet';

interface IAConversationHistoryProps {
  sessions: IAConversation[];
  isLoading: boolean;
  onSelectSession: (sessionId: string) => void;
}

export default function IAConversationHistory({ sessions, isLoading, onSelectSession }: IAConversationHistoryProps) {
  
  const getFormattedDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha desconocida';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch { return 'Fecha inválida'; }
  };

  return (
    <div className="h-full flex flex-col">
       <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Simulaciones
            </span>
          </SheetTitle>
        </SheetHeader>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : sessions.length > 0 ? (
            sessions.map(session => (
              <Card 
                key={session.id} 
                className="cursor-pointer bg-card/50 hover:bg-card/80 transition-colors"
                onClick={() => onSelectSession(session.id)}
              >
                <CardHeader className="p-3">
                  <CardTitle className="text-sm font-semibold truncate">
                    Simulación #{session.id.substring(0, 6)}...
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Iniciada {getFormattedDate(session.createdAt)}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm">
                <p>No hay simulaciones guardadas.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
