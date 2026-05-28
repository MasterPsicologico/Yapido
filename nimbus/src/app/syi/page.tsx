'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, BrainCircuit, Atom, RefreshCw, Loader2, LineChart, Radar, Info } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useCollection, useFirestore } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { doc, getDocs, collection, query, orderBy, Timestamp, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import type { ChatbotState, Chat, Message } from '@/lib/types';
import { updatePsychologicalBlueprint } from '@/ai/flows/update-psychological-blueprint';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

import StrategyRadarChart from '@/components/syi/StrategyRadarChart';
import ConfidenceLineChart from '@/components/syi/ConfidenceLineChart';


// Componente para visualizar el "Yo" del Agente
const SelfModelGraph = ({ blueprint, updatedAt }: { blueprint: any | null, updatedAt: Timestamp | null }) => {
  if (!blueprint) {
    return (
        <Card className="bg-card/50 h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Atom className="w-5 h-5"/>
                    Cianotipo Psicológico (Yo Interno)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-24 w-full" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="bg-card/50 h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2 text-primary">
                <Atom className="w-5 h-5"/>
                Última Reflexión
                </CardTitle>
                <CardDescription>La autoevaluación más reciente de la IA.</CardDescription>
            </div>
             <p className="text-xs text-muted-foreground flex-shrink-0 pt-1">{updatedAt ? format(updatedAt.toDate(), "d MMM, HH:mm", { locale: es }) : 'N/A'}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div>
          <Label className="text-xs text-muted-foreground">Auto-Reflexión</Label>
          <p className="font-mono text-sm p-2 bg-background/50 rounded h-24 overflow-y-auto">{blueprint.self_reflection}</p>
        </div>
         <div>
          <Label className="text-xs text-muted-foreground">Estrategia Actual</Label>
          <p className="font-mono text-sm p-2 bg-background/50 rounded">{blueprint.strategy_adjustment}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para el log del "Diálogo Interno"
const InternalMonologue = ({ blueprint }: { blueprint: any | null }) => {
    if (!blueprint) {
        return (
             <Card className="bg-card/50 h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5" />
                        Entendimiento del Usuario
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        );
    }
  return (
    <Card className="bg-card/50 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5" />
            Modelo Actual del Usuario
        </CardTitle>
        <CardDescription>Cómo la IA te percibe en este momento.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
          <div className="font-mono text-xs space-y-2 text-muted-foreground p-2 bg-background/50 rounded h-full overflow-y-auto">
            {blueprint.updated_understanding_of_user}
          </div>
      </CardContent>
    </Card>
  );
};


export default function SYIPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedState, setSelectedState] = useState<ChatbotState | null>(null);

  const historyQuery = useMemo(() =>
    user ? query(collection(firestore, `users/${user.uid}/chatbotStateHistory`), orderBy('updatedAt', 'desc')) : undefined,
    [user, firestore]
  );
  const { data: stateHistory, loading: historyLoading } = useCollection<ChatbotState>(historyQuery);

  const chatsQuery = useMemo(
    () => (user?.uid && firestore ? query(collection(firestore, `users/${user.uid}/chats`), orderBy('createdAt', 'asc')) : undefined),
    [user?.uid, firestore]
  );
  const { data: chats, loading: chatsLoading } = useCollection<Chat>(chatsQuery);

  const latestState = useMemo(() => {
    if (selectedState) return selectedState;
    return stateHistory && stateHistory.length > 0 ? stateHistory[0] : null;
  }, [stateHistory, selectedState]);


  const handleAutoUpdate = useCallback(async () => {
    if (!user || !firestore || !chats || !stateHistory) {
      return;
    }

    const lastReflectionTime = latestState?.updatedAt?.toMillis() || 0;
    const latestMessageTime = chats.reduce((latest, chat) => {
        const messageTime = chat.latestMessageAt?.toMillis() || 0;
        return Math.max(latest, messageTime);
    }, 0);
    
    // Only update if there are new messages since the last reflection
    if (latestMessageTime > lastReflectionTime) {
      setIsUpdating(true);
      toast({ title: 'Actualización automática...', description: 'Analizando nuevas interacciones para actualizar el cianotipo.'});

      try {
          let fullChatHistory = '';
          for (const chat of chats) {
              fullChatHistory += `--- INICIO DEL CHAT: ${chat.title} ---\n`;
              const messagesQuery = query(collection(firestore, `users/${user.uid}/chats/${chat.id}/messages`), orderBy('timestamp', 'asc'));
              const messagesSnapshot = await getDocs(messagesQuery);
              messagesSnapshot.forEach(doc => {
                  const msg = doc.data() as Message;
                  const date = msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : new Date();
                  fullChatHistory += `[${date.toISOString()}] ${msg.role}: ${msg.content}\n`;
              });
              fullChatHistory += `--- FIN DEL CHAT ---\n\n`;
          }

          if (!fullChatHistory.trim()) return;

          const previousBlueprintString = latestState ? JSON.stringify(latestState.blueprint) : '{}';

          const newBlueprint = await updatePsychologicalBlueprint({
              fullChatHistory,
              previousBlueprint: previousBlueprintString,
          });
          
          const historyCollectionRef = collection(firestore, `users/${user.uid}/chatbotStateHistory`);
          await addDoc(historyCollectionRef, {
              blueprint: newBlueprint,
              updatedAt: serverTimestamp(),
          });
          
          toast({ title: 'Reflexión Completa', description: 'El cianotipo psicológico ha sido actualizado.'});
      } catch (e: any) {
          console.error("Error en la actualización automática:", e);
          toast({ variant: 'destructive', title: 'Error en la Reflexión', description: e.message || 'No se pudo completar el proceso.' });
      } finally {
          setIsUpdating(false);
      }
    }
  }, [user, firestore, chats, stateHistory, latestState, toast]);

  useEffect(() => {
    // Trigger auto-update check once all data is loaded
    if (!authLoading && !historyLoading && !chatsLoading) {
      handleAutoUpdate();
    }
  }, [authLoading, historyLoading, chatsLoading, handleAutoUpdate]);


  if (!user && !authLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Card className="max-w-md text-center p-8">
                <CardHeader>
                    <CardTitle>Acceso Denegado</CardTitle>
                    <CardDescription>Debes iniciar sesión para acceder al laboratorio.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild><Link href="/">Volver al Inicio</Link></Button>
                </CardContent>
              </Card>
          </div>
      )
  }

  const isLoading = authLoading || historyLoading || chatsLoading;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex-shrink-0 flex items-center justify-between p-2 md:p-4 border-b">
          <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="icon" className="-ml-2 text-muted-foreground hover:bg-accent/10 hover:text-foreground">
                  <Link href="/">
                      <ChevronLeft className="h-5 w-5" />
                  </Link>
              </Button>
              <div>
                  <h1 className="text-xl font-bold tracking-tight text-primary">Laboratorio SYI</h1>
                  <p className="text-xs text-muted-foreground">Sismógrafo de la Conciencia del Chatbot</p>
              </div>
          </div>
          {isUpdating && (
             <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analizando...</span>
             </div>
          )}
      </header>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
            
            {isLoading && !latestState ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-80 w-full" />
                        <Skeleton className="h-80 w-full" />
                    </div>
                </div>
            ) : stateHistory && stateHistory.length > 0 && latestState ? (
                <AnimatePresence>
                    <motion.div 
                      key={latestState.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SelfModelGraph blueprint={latestState.blueprint} updatedAt={latestState.updatedAt} />
                            <InternalMonologue blueprint={latestState.blueprint} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-card/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Radar className="w-5 h-5 text-primary"/>Evolución de Estrategias</CardTitle>
                                    <CardDescription>Cómo han cambiado las tácticas del chatbot.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-80">
                                    <StrategyRadarChart history={stateHistory} onPointClick={setSelectedState} />
                                </CardContent>
                            </Card>
                            <Card className="bg-card/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><LineChart className="w-5 h-5 text-primary"/>Línea de Confianza del Modelo</CardTitle>
                                    <CardDescription>La "seguridad" del chatbot en su propio análisis.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-80">
                                    <ConfidenceLineChart history={stateHistory} onPointClick={setSelectedState} />
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                </AnimatePresence>
            ) : (
                <Card className="text-center p-8 mt-8">
                    <CardHeader>
                        <CardTitle>Sin Datos de Conciencia</CardTitle>
                        <CardDescription>
                            El chatbot aún no ha desarrollado un estado mental. Inicia una conversación para que comience su proceso de reflexión. Si ya lo hiciste, el sistema lo detectará automáticamente.
                        </CardDescription>
                    </CardHeader>
                     <CardContent>
                       <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>¿Cómo funciona?</AlertTitle>
                        <AlertDescription>
                            El proceso de reflexión se iniciará automáticamente la próxima vez que visites esta página después de tener una nueva conversación.
                        </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Subcomponente de Label para evitar redefinición
const Label = ({ className, ...props }: React.HTMLAttributes<HTMLLabelElement>) => (
  <label className={`block ${className}`} {...props} />
);
