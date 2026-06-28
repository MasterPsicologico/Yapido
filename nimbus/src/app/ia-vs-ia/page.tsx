'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MessageSquare, BarChart2, Sparkles, History, Play, Pause, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Conversation from '@/components/ia-vs-ia/Conversation';
import LearningCurve from '@/components/ia-vs-ia/LearningCurve';
import EmergentAgent from '@/components/ia-vs-ia/EmergentAgent';
import dynamic from 'next/dynamic';
import { useAuth, useCollection, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import type { IAConversation, CachedProfile, IAMessage, IALearningState } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateNextIAMessage } from './actions';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import IAConversationHistory from '@/components/ia-vs-ia/IAConversationHistory';
import AuthRequiredPanel from '@/components/chat/AuthRequiredPanel';

const ArchitectureWorld = dynamic(() => import('@/components/ia-vs-ia/ArchitectureWorld'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[hsl(220,15%,8%)] flex items-center justify-center text-[hsl(190,80%,50%)] text-xs tracking-widest uppercase">Sintonizando realidad...</div>
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
  const [activeTab, setActiveTab] = useState('conversation');

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

  const runSimulationLoop = useCallback(async (startTurn: number, sid: string, initialHistory: { agentName: string; content: string }[]) => {
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
        console.log('[IAvsIA] Calling AI for turn', turnCounter, 'agent:', agentId);
        const response = await generateNextIAMessage({
          history: localHistory,
          agentToGenerate: agentId,
          userProfileContext,
        });
        console.log('[IAvsIA] AI response received:', response.content.substring(0, 100));

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
    if (!user || !firestore) {
      console.error('[IAvsIA] No user or firestore', { user: !!user, firestore: !!firestore });
      toast({ variant: 'destructive', title: 'Error', description: 'No hay sesión de usuario.' });
      return;
    }
    console.log('[IAvsIA] Starting new simulation...');
    setSimulationStatus('running');
    setMessages([]);
    setLearningStates([]);
    try {
      const sessionRef = await addDoc(collection(firestore, `users/${user.uid}/ia-vs-ia-sessions`), {
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      console.log('[IAvsIA] Session created:', sessionRef.id);
      runSimulationLoop(0, sessionRef.id, []);
    } catch (e: any) {
      console.error('[IAvsIA] Error creating session:', e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la sesión: ' + e.message });
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
      <div className="ia-page">
        <div className="ia-loading">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ia-page">
        <AuthRequiredPanel onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className="ia-page">
      <header className="ia-header">
        <div className="ia-header-inner">
            <div className="ia-header-left">
                <Button asChild variant="ghost" size="icon" className="ia-back-btn">
                    <Link href="/">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="ia-title">IA vs IA: El Nacimiento</h1>
                    <p className="ia-subtitle">Un laboratorio para la conciencia emergente.</p>
                </div>
            </div>
            <div className="ia-header-right">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="ia-history-btn">
                      <History className="mr-2 h-4 w-4"/>
                      Historial
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full max-w-md p-0 ia-sheet-content">
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

      <main className="ia-main">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="ia-tabs">
            <div className="ia-tabs-list-wrap">
                <TabsList className="ia-tabs-list">
                    <TabsTrigger value="conversation" className="ia-tab-trigger">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Diálogo
                    </TabsTrigger>
                    <TabsTrigger value="metrics" disabled={!sessionId} className="ia-tab-trigger">
                        <BarChart2 className="mr-2 h-4 w-4" />
                        Métricas
                    </TabsTrigger>
                    <TabsTrigger value="birth" disabled={!sessionId} className="ia-tab-trigger">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Seraph
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="ia-tabs-content">
                <TabsContent value="conversation" className="ia-tab-panel">
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
                <TabsContent value="metrics" className="ia-tab-panel">
                    <LearningCurve learningStates={learningStates} />
                </TabsContent>
                <TabsContent value="birth" className="ia-tab-panel">
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