
'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MessageSquare, BarChart2, Sparkles, History, Play, Pause, Box, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Conversation from '@/components/ia-vs-ia/Conversation';
import LearningCurve from '@/components/ia-vs-ia/LearningCurve';
import EmergentAgent from '@/components/ia-vs-ia/EmergentAgent';
import dynamic from 'next/dynamic';
import { useAuth, useCollection, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp, Timestamp, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import type { IAConversation, CachedProfile, IAMessage, IALearningState } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateNextIAMessage } from './actions';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import IAConversationHistory from '@/components/ia-vs-ia/IAConversationHistory';
import AuthRequiredPanel from '@/components/chat/AuthRequiredPanel';

// Cargamos el mundo 3D dinámicamente para evitar errores de SSR
const ArchitectureWorld = dynamic(() => import('@/components/ia-vs-ia/ArchitectureWorld'), {
    ssr: false,
    loading: () => <div className="w-full h-48 bg-black/20 rounded-lg flex items-center justify-center text-blue-400 text-xs">Sintonizando realidad...</div>
});

type SimulationStatus = 'idle' | 'running' | 'paused' | 'finished';

export default function IaVsIaPage() {
  const { user, loading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('idle');
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [voiceAmplitude, setVoiceAmplitude] = useState(0);
  const [metacognition, setMetacognition] = useState({ thought: 'Esperando sintonización...', goal: 'Existir.' });
  
  const [messages, setMessages] = useState<IAMessage[]>([]);
  const [learningStates, setLearningStates] = useState<IALearningState[]>([]);

  const isPausedRef = useRef(false);
  
  const simulationQuery = useMemo(() => 
    user ? query(collection(firestore, `users/${user.uid}/ia-vs-ia-sessions`), orderBy('createdAt', 'desc')) : undefined,
    [user, firestore]
  );
  const { data: simulationHistory, loading: historyLoading } = useCollection<IAConversation>(simulationQuery);
  
  useEffect(() => {
    if (!user || !sessionId || !firestore) {
      setMessages([]);
      setLearningStates([]);
      return;
    }
    
    const messagesRef = collection(firestore, `users/${user.uid}/ia-vs-ia-sessions/${sessionId}/messages`);
    const messagesQ = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribeMessages = onSnapshot(messagesQ, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IAMessage)));
    });

    const learningStatesRef = collection(firestore, `users/${user.uid}/ia-vs-ia-sessions/${sessionId}/learningStates`);
    const learningQ = query(learningStatesRef, orderBy('turn', 'asc'));
    const unsubscribeLearning = onSnapshot(learningQ, (snapshot) => {
        setLearningStates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IALearningState)));
    });

    return () => {
      unsubscribeMessages();
      unsubscribeLearning();
    };
  }, [user, firestore, sessionId]);

  useEffect(() => {
    isPausedRef.current = (simulationStatus === 'paused');
  }, [simulationStatus]);
  
  const runSimulationLoop = useCallback(async (startTurn: number, sid: string, initialHistory: { agentName: string, content: string }[]) => {
    if (!user || !firestore) return;
    
    setSessionId(sid);

    let localHistory = [...initialHistory];
    let turnCounter = startTurn;
    
    const profileKey = `psych-profile-${user.uid}`;
    const cachedProfileItem = localStorage.getItem(profileKey);
    let userProfileContext = 'No hay perfil de usuario disponible.';
    if (cachedProfileItem) {
        try {
            const profileData: CachedProfile = JSON.parse(cachedProfileItem);
            const { coreConflict, coreArchetype, emotionalConstellation } = profileData.profile;
            userProfileContext = `Conflicto principal: ${coreConflict || 'No definido'}. Arquetipo: ${coreArchetype?.title || 'No definido'}. Temas clave: ${(emotionalConstellation?.nodes || []).map(n => n.id).slice(0, 3).join(', ') || 'No definidos'}.`;
        } catch(e) { console.error("Could not parse profile for IA context"); }
    }

    const agents: ('dr-sharma' | 'dr-tanaka')[] = ['dr-sharma', 'dr-tanaka'];

    setSimulationStatus('running');

    while (turnCounter < 20) {
      if (isPausedRef.current) {
        setSimulationStatus('paused');
        return;
      }
      
      setCurrentTurn(turnCounter);

      const agentId = agents[turnCounter % 2];
      const agentName = agentId === 'dr-sharma' ? 'Dra. Anya Sharma' : 'Dr. Kenji Tanaka';

      try {
        const response = await generateNextIAMessage({
          history: localHistory,
          agentToGenerate: agentId,
          userProfileContext,
        });

        const newMessage = {
          agentId,
          agentName,
          content: response.content,
          coherenceScore: response.coherenceScore,
        };
        
        localHistory.push({ agentName: newMessage.agentName, content: newMessage.content });

        const { writeBatch, doc: docRef, collection: colRef, serverTimestamp: srvTimestamp } = await import('firebase/firestore');
        const batch = writeBatch(firestore);
        const messageDocRef = docRef(colRef(firestore, `users/${user.uid}/ia-vs-ia-sessions/${sid}/messages`));
        batch.set(messageDocRef, { ...newMessage, timestamp: srvTimestamp() });

        const learningStateRef = docRef(colRef(firestore, `users/${user.uid}/ia-vs-ia-sessions/${sid}/learningStates`));
        batch.set(learningStateRef, {
            turn: turnCounter,
            timestamp: srvTimestamp(),
            coherenceScore: newMessage.coherenceScore,
            agentId: newMessage.agentId,
        });
        
        await batch.commit();
        
        turnCounter++;

      } catch (e: any) {
        console.error("Error during simulation turn:", e);
        toast({ variant: "destructive", title: "Error en Simulación", description: e.message });
        setSimulationStatus('finished');
        return;
      }
    }
    setSimulationStatus('finished');
  }, [user, firestore, toast]);

  const handleStartNew = useCallback(async () => {
    if (!user || !firestore) return;
    setSimulationStatus('running');
    setMessages([]);
    setLearningStates([]);
    try {
      const sessionRef = await addDoc(collection(firestore, `users/${user.uid}/ia-vs-ia-sessions`), {
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      runSimulationLoop(0, sessionRef.id, []);
    } catch (e: any) {
      console.error("Error creating new session:", e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la sesión.' });
      setSimulationStatus('idle');
    }
  }, [user, firestore, toast, runSimulationLoop]);

  const handlePause = () => setSimulationStatus('paused');

  const handleResume = () => {
    if (sessionId) {
      setSimulationStatus('running');
      runSimulationLoop(messages.length, sessionId, messages.map(m => ({ agentName: m.agentName, content: m.content })));
    }
  };
  
  const handleSelectSession = async (sid: string) => {
      setSessionId(sid);

      const messagesRef = collection(firestore, `users/${user.uid}/ia-vs-ia-sessions/${sid}/messages`);
      const messagesQ = query(messagesRef, orderBy('timestamp', 'asc'));
      const messagesSnap = await getDocs(messagesQ);
      setMessages(messagesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as IAMessage)));

      const learningStatesRef = collection(firestore, `users/${user.uid}/ia-vs-ia-sessions/${sid}/learningStates`);
      const learningQ = query(learningStatesRef, orderBy('turn', 'asc'));
      const learningSnap = await getDocs(learningQ);
      setLearningStates(learningSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as IALearningState)));
      
      setSimulationStatus(messagesSnap.size < 20 ? 'paused' : 'finished');
      setIsSheetOpen(false);
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <AuthRequiredPanel onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      <header className="flex-shrink-0 border-b p-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="icon" className="-ml-2">
                    <Link href="/">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-primary">IA vs IA: El Nacimiento</h1>
                    <p className="text-xs text-muted-foreground">Un laboratorio para la conciencia emergente.</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm"><History className="mr-2 h-4 w-4"/>Historial</Button>
                  </SheetTrigger>
                  <SheetContent className="w-full max-w-md p-0">
                      <IAConversationHistory 
                        sessions={simulationHistory || []} 
                        isLoading={historyLoading}
                        onSelectSession={handleSelectSession}
                      />
                  </SheetContent>
              </Sheet>
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="conversation" className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-center p-2 border-b bg-background/50 backdrop-blur-sm z-20">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="conversation">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Diálogo
                    </TabsTrigger>
                    <TabsTrigger value="metrics" disabled={!sessionId}>
                        <BarChart2 className="mr-2 h-4 w-4" />
                        Métricas
                    </TabsTrigger>
                    <TabsTrigger value="birth" disabled={!sessionId}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Seraph
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 relative overflow-hidden min-h-0">
                <TabsContent value="conversation" className="absolute inset-0 m-0 overflow-hidden flex flex-col">
                    <Conversation 
                        sessionId={sessionId}
                        status={simulationStatus}
                        onStart={handleStartNew}
                        onPause={handlePause}
                        onResume={handleResume}
                        currentTurn={currentTurn}
                        messages={messages}
                    />
                </TabsContent>
                <TabsContent value="metrics" className="absolute inset-0 m-0 overflow-y-auto">
                    {sessionId && <LearningCurve learningStates={learningStates} />}
                </TabsContent>
                <TabsContent value="birth" className="absolute inset-0 m-0 flex flex-col overflow-hidden">
                    {sessionId && (
                        <EmergentAgent 
                            sessionId={sessionId} 
                            onMetacognitionUpdate={setMetacognition}
                            onVoiceAmplitudeUpdate={setVoiceAmplitude}
                            voiceAmplitude={voiceAmplitude}
                            metacognition={metacognition}
                        />
                    )}
                </TabsContent>
            </div>
        </Tabs>
      </main>
    </div>
  );
}
