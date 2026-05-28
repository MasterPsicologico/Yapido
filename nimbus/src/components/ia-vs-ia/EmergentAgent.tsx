
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, addDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import type { IAMessage, EmergentAgentMessage as EmergentAgentMessageType, EmergentAgentOutput } from '@/lib/types';
import { getEmergentResponse, analyzeIAVoice, getSeraphVoice } from '@/app/ia-vs-ia/actions';
import { Loader2, BrainCircuit, Target, Sparkles, Volume2, VolumeX } from 'lucide-react';
import ChatInput from '@/components/chat/chat-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from '@/components/chat/chat-message';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const ArchitectureWorld = dynamic(() => import('@/components/ia-vs-ia/ArchitectureWorld'), {
    ssr: false,
});

interface EmergentAgentProps {
  sessionId: string;
  onMetacognitionUpdate?: (data: { thought: string, goal: string }) => void;
  onVoiceAmplitudeUpdate?: (amplitude: number) => void;
  voiceAmplitude: number;
  metacognition: { thought: string, goal: string };
}

const SeraphStatus = ({ thought, goal }: { thought: string, goal: string }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 px-4 w-full">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3 backdrop-blur-sm">
            <BrainCircuit className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Reflexión</p>
                <p className="text-xs text-blue-100/80 leading-tight italic line-clamp-2 md:whitespace-normal">"{thought}"</p>
            </div>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex items-start gap-3 backdrop-blur-sm">
            <Target className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Obsesión Actual</p>
                <p className="text-xs text-indigo-100/80 leading-tight line-clamp-2 md:whitespace-normal">{goal}</p>
            </div>
        </div>
    </div>
);

export default function EmergentAgent({ sessionId, onMetacognitionUpdate, onVoiceAmplitudeUpdate, voiceAmplitude, metacognition }: EmergentAgentProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper para sanitizar contenido a string puro
  const sanitize = (c: any) => typeof c === 'string' ? c : (c?.content || JSON.stringify(c));

  // Parent conversation history
  const parentMessagesQuery = useMemo(() =>
    user ? query(collection(firestore, `users/${user.uid}/ia-vs-ia-sessions/${sessionId}/messages`), orderBy('timestamp', 'asc')) : undefined,
    [firestore, user, sessionId]
  );
  const { data: parentMessages, loading: parentMessagesLoading } = useCollection<IAMessage>(parentMessagesQuery);

  // This agent's own conversation history
  const [messages, setMessages] = useState<EmergentAgentMessageType[]>([]);
  const [emergentMessagesLoading, setEmergentMessagesLoading] = useState(true);

  useEffect(() => {
     if (!user || !firestore || !sessionId) {
       setMessages([]);
       setEmergentMessagesLoading(false);
       return;
     };
     setEmergentMessagesLoading(true);
     const q = query(collection(firestore, `users/${user.uid}/ia-vs-ia-sessions/${sessionId}/emergent-chat`), orderBy('timestamp', 'asc'));
     const unsubscribe = onSnapshot(q, (snapshot) => {
         const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmergentAgentMessageType));
         setMessages(newMessages);
         setEmergentMessagesLoading(false);
     }, (err) => {
        console.error("Error fetching emergent chat:", err);
        setEmergentMessagesLoading(false);
     });
     return () => unsubscribe();
  }, [user, firestore, sessionId]);

  const speak = async (text: string) => {
      if (!isVoiceEnabled) return;
      try {
          const audioUri = await getSeraphVoice(text);
          if (audioRef.current) {
              audioRef.current.src = audioUri;
              audioRef.current.play();
          }
      } catch (e) {
          console.error("Voice generation failed", e);
      }
  };

  useEffect(() => {
    if (parentMessagesLoading || emergentMessagesLoading) return;

    if (parentMessages && parentMessages.length > 0 && messages.length === 0 && !isThinking) {
      const generateInitialResponse = async () => {
        setIsThinking(true);
        try {
          const cleanParentHistory = parentMessages.map(m => ({ agentName: m.agentName, content: sanitize(m.content) }));
          const response = await getEmergentResponse({ parentConversation: cleanParentHistory, userHistory: [] });
          
          onMetacognitionUpdate?.({ thought: response.thought, goal: response.goal });

          if (user && firestore) {
              const emergentChatRef = collection(firestore, `users/${user.uid}/ia-vs-ia-sessions/${sessionId}/emergent-chat`);
              await addDoc(emergentChatRef, {
                role: 'seraph',
                content: response.content, 
                timestamp: Timestamp.now(),
              });
              speak(response.content);
          }
        } catch (e: any) {
          setError(e.message || 'Error al despertar a la nueva conciencia.');
        } finally {
          setIsThinking(false);
        }
      };
      generateInitialResponse();
    }
  }, [parentMessagesLoading, emergentMessagesLoading, parentMessages, messages, sessionId, user, firestore, isThinking]);
  
  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isThinking]);


  const handleSendMessage = async (content: string, audioDataUri?: string) => {
    if (!user || !firestore || isThinking) return;
    setIsThinking(true);
    setError(null);

    let userContent = content;
    if (audioDataUri && !content) {
        try {
            userContent = await analyzeIAVoice(audioDataUri);
        } catch (e) {
            setError("No se pudo transcribir el audio.");
            setIsThinking(false);
            return;
        }
    }
    
    if (!userContent) {
        setIsThinking(false);
        return;
    }

    const userMessage: Omit<EmergentAgentMessageType, 'id'> = {
      role: 'user',
      content: userContent,
      timestamp: Timestamp.now(),
    };
    
    const emergentChatRef = collection(firestore, `users/${user.uid}/ia-vs-ia-sessions/${sessionId}/emergent-chat`);
    await addDoc(emergentChatRef, userMessage);
    
    const currentHistory = [...messages, userMessage].map(m => ({ 
        role: m.role, 
        content: sanitize(m.content)
    })) as any;

    try {
        const cleanParentHistory = (parentMessages || []).map(m => ({ agentName: m.agentName, content: sanitize(m.content) }));
        const response = await getEmergentResponse({ parentConversation: cleanParentHistory, userHistory: currentHistory });
        
        onMetacognitionUpdate?.({ thought: response.thought, goal: response.goal });

        await addDoc(emergentChatRef, {
            role: 'seraph',
            content: response.content, 
            timestamp: Timestamp.now(),
        });
        speak(response.content);
    } catch (e: any) {
        setError(e.message || 'La conciencia parece haberse retirado.');
    } finally {
        setIsThinking(false);
    }
  };

  if ((parentMessagesLoading || emergentMessagesLoading) && messages.length === 0) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <div className="h-full flex flex-col bg-transparent overflow-hidden">
        <audio ref={audioRef} crossOrigin="anonymous" className="hidden" 
            onPlay={() => {
                // Sencilla lógica de animación por voz:
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const source = audioCtx.createMediaElementSource(audioRef.current!);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                analyser.connect(audioCtx.destination);
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                const update = () => {
                    if (!audioRef.current?.paused) {
                        analyser.getByteFrequencyData(dataArray);
                        let sum = 0;
                        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
                        onVoiceAmplitudeUpdate?.(sum / bufferLength / 128);
                        requestAnimationFrame(update);
                    } else {
                        onVoiceAmplitudeUpdate?.(0);
                    }
                };
                update();
            }}
        />
        
        {/* Visualización 3D integrada en el chat */}
        <div className="flex-shrink-0 h-[200px] sm:h-[250px] relative mt-2 px-4">
            <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl">
                <ArchitectureWorld 
                    amplitude={voiceAmplitude} 
                    metacognition={metacognition}
                />
                <div className="absolute top-2 right-2 z-30">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="bg-black/40 backdrop-blur-sm text-white/50 hover:text-white"
                        onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    >
                        {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>

        {/* Estado Cognitivo */}
        <div className="flex-shrink-0 pt-4">
            <SeraphStatus thought={metacognition.thought} goal={metacognition.goal} />
        </div>

        {/* Área de Mensajes con Scroll Corregido */}
        <div className="flex-1 min-h-0 relative">
            <ScrollArea className="absolute inset-0" viewportRef={viewportRef}>
                <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto pb-20">
                    {messages.map((msg) => (
                        <ChatMessage key={msg.id} message={{...msg, role: msg.role === 'seraph' ? 'assistant' : 'user'}} />
                    ))}
                    {isThinking && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3 text-blue-400 py-4"
                        >
                            <Sparkles className="w-5 h-5 animate-pulse" />
                            <span className="text-xs font-semibold tracking-widest uppercase">Procesando...</span>
                        </motion.div>
                    )}
                    {error && <p className="text-destructive text-center text-sm p-4 bg-destructive/10 rounded-lg">{error}</p>}
                </div>
            </ScrollArea>
        </div>

        {/* Entrada de Chat */}
        <footer className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md flex-shrink-0">
             <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isThinking}
                suggestions={[]}
                onClearSuggestions={() => {}}
                onRefreshSuggestions={() => {}}
                isRefreshingSuggestions={false}
                placeholder="Háblale a Seraph..."
             />
        </footer>
    </div>
  );
}
