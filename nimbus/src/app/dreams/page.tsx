'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { CachedProfile, ProfileData, DreamInterpretationDoc, Chat, DreamSpecialist } from '@/lib/types';
import { interpretDreamAction, analyzeDreamVoiceAction } from '@/app/dreams/actions';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Wand2, Info, BookOpen, Trash2, Mic, Square, Pause, Play, Loader2, Calendar, Clock, X } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ChatSidebar from '@/components/chat/chat-sidebar';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { v4 as uuidv4 } from 'uuid';
import { useAuth, useFirestore, useCollection } from '@/firebase';
import { query, collection, orderBy, doc, setDoc, deleteDoc, getDocs, Timestamp } from 'firebase/firestore';
import { useIsMobile } from '@/hooks/use-mobile';
import anime from 'animejs';
import DreamSpecialistSelection from '@/components/dreams/DreamSpecialistSelection';
import AudioVisualizer from '@/components/dreams/AudioVisualizer';
import RecordingControls from '@/components/dreams/RecordingControls';
import AdsterraRectangle from '@/components/AdsterraRectangle';
import './dreams.css';

type AnalysisStep = 'input' | 'specialist';
type RecordingStatus = 'idle' | 'recording' | 'paused' | 'transcribing' | 'done';

const SILENCE_TIMEOUT = 7000;

interface StarConfig {
  id: number;
  size: number;
  left: number;
  top: number;
}

const STARS_CONFIG: StarConfig[] = [];

export default function DreamWeaverPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [dreamText, setDreamText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('input');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const portalRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const textareaWrapRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<StarConfig[]>([]);

  const chatsQuery = useMemo(
    () => (user?.uid && firestore ? query(collection(firestore, `users/${user.uid}/chats`), orderBy('createdAt', 'desc')) : undefined),
    [user?.uid, firestore]
  );
  const { data: chats, loading: chatsLoading } = useCollection<Chat>(chatsQuery);

  const dreamsQuery = useMemo(
    () => (user?.uid && firestore ? query(collection(firestore, `users/${user.uid}/dreams`), orderBy('createdAt', 'desc')) : undefined),
    [user?.uid, firestore]
  );
  const { data: dreamHistory, loading: isLoadingHistory } = useCollection<DreamInterpretationDoc>(dreamsQuery);

  useEffect(() => {
    if (user) {
      const storageKey = `psych-profile-${user.uid}`;
      const cachedItem = localStorage.getItem(storageKey);
      if (cachedItem) {
        try {
          const data: CachedProfile = JSON.parse(cachedItem);
          setProfile(data.profile);
        } catch (e) {
          setProfileError("No se pudo cargar tu perfil psicológico. La interpretación del sueño puede ser menos precisa.");
        }
      } else {
        setProfileError("No se ha generado un perfil psicológico. Ve a la sección 'Perfil Psicológico' para crear uno y obtener interpretaciones más profundas.");
      }
    }
  }, [user]);

  // --- Generate stars on client only (Post-Mount) to prevent SSR hydration mismatch with Math.random ---
  useEffect(() => {
    const generated: StarConfig[] = [];
    for (let i = 0; i < 28; i++) {
      const size = Math.random() > 0.85 ? 3 : Math.random() > 0.5 ? 2 : 1.5;
      generated.push({
        id: i,
        size,
        left: Math.random() * 100,
        top: Math.random() * 100,
      });
    }
    setStars(generated);
  }, []);

  // --- Panel toggle animation ---
  useEffect(() => {
    if (!panelRef.current) return;
    if (isHistoryOpen) {
      anime({
        targets: panelRef.current,
        translateX: isMobile ? [window.innerWidth, 0] : [360, 0],
        opacity: [0, 1],
        duration: 350,
        easing: 'easeOutCubic',
      });
    } else {
      anime({
        targets: panelRef.current,
        translateX: [0, isMobile ? window.innerWidth : 360],
        opacity: [1, 0],
        duration: 280,
        easing: 'easeInCubic',
      });
    }
  }, [isHistoryOpen, isMobile]);

  // --- Entrance animations ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    anime({
      targets: '.dream-star',
      opacity: [
        { value: () => anime.random(2, 7) / 10, duration: () => anime.random(1800, 3500) },
        { value: 0.08, duration: () => anime.random(1800, 3500) },
      ],
      easing: 'easeInOutSine',
      direction: 'alternate',
      loop: true,
      delay: () => anime.random(0, 2500),
    });

    anime({
      targets: moonRef.current,
      translateY: [-5, 5],
      duration: 6000,
      direction: 'alternate',
      easing: 'easeInOutSine',
      loop: true,
    });

    const tl = anime.timeline({ easing: 'easeOutExpo' });
    tl.add({ targets: moonRef.current, opacity: [0, 1], translateY: [-30, 0], duration: 1600 }, 0);
    tl.add({ targets: '.dream-star', delay: anime.stagger(60, { start: 400 }), scale: [0, 1], opacity: [0, 0.6], duration: 600 }, 200);
    tl.add({ targets: heroRef.current, opacity: [0, 1], translateY: [40, 0], duration: 1200 }, 500);
    tl.add({ targets: textareaWrapRef.current, opacity: [0, 1], translateY: [30, 0], duration: 1000 }, 800);
    tl.add({ targets: ctaRef.current, opacity: [0, 1], translateY: [20, 0], scale: [0.96, 1], duration: 800 }, 1000);

    return () => {
      anime.remove('.dream-star');
      if (moonRef.current) anime.remove(moonRef.current);
    };
  }, []);

  // Entrance for step transitions
  useEffect(() => {
    if (!ctaRef.current || !portalRef.current) return;
    if (analysisStep === 'input') {
      anime({
        targets: [textareaWrapRef.current, ctaRef.current],
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 700,
        delay: anime.stagger(120),
        easing: 'easeOutCubic',
      });
    }
  }, [analysisStep]);

  const handleProceedToSelection = () => {
      if (!dreamText.trim() && !recordedAudioUrl) {
          toast({ variant: 'destructive', title: 'Sueño Vacío', description: 'Por favor, describe o graba tu sueño antes de continuar.' });
          return;
      }
      if (!profile) {
          toast({ variant: 'destructive', title: 'Perfil no encontrado', description: 'Es necesario un perfil psicológico para elegir un especialista.' });
          return;
      }
      setAnalysisStep('specialist');
  };

  const handleAnalyzeDream = async (specialist: DreamSpecialist) => {
    if (!user || !firestore) return;
    setIsAnalyzing(true);
    try {
        let dreamDescription = dreamText;
        if(recordedAudioUrl && !dreamText){
            const { transcription } = await analyzeDreamVoiceAction({ audioDataUri: recordedAudioUrl });
            dreamDescription = transcription;
        }

        const interpretationResult = await interpretDreamAction({
            dreamDescription: dreamDescription,
            userProfile: profile ? JSON.stringify(profile) : '{}',
            perspective: specialist.perspective,
        });

        let dreamTitle = "Sueño Sin Título";
        try {
            const titleMatch = interpretationResult.interpretationText.match(/^#\s*(.*)/);
            if (titleMatch && titleMatch[1]) dreamTitle = titleMatch[1];
        } catch (e) {}

        const dreamId = uuidv4();
        await setDoc(doc(firestore, `users/${user.uid}/dreams`, dreamId), {
            userId: user.uid,
            dreamDescription: dreamDescription,
            interpretation: { interpretationText: interpretationResult.interpretationText, dreamTitle },
            createdAt: new Date().toISOString(),
        });

        clearRecording();
        router.push(`/dreams/analysis?id=${dreamId}`);

    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error en el análisis', description: error.message || 'No se pudo interpretar el sueño.' });
      setAnalysisStep('input');
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleDeleteDream = async (id: string) => {
    if (!user || !firestore) return;
    try {
        const card = document.querySelector(`[data-dream-id="${id}"]`);
        if (card) {
          await new Promise<void>(resolve => {
            anime({
              targets: card,
              translateX: [0, 80],
              opacity: [1, 0],
              scale: [1, 0.95],
              duration: 350,
              easing: 'easeInCubic',
              complete: () => resolve(),
            });
          });
        }
        await deleteDoc(doc(firestore, `users/${user.uid}/dreams`, id));
        toast({ title: 'Éxito', description: 'El sueño ha sido eliminado de tu diario.' });
    } catch (error) {
        console.error("Error deleting dream:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el sueño.' });
    }
  };

  const handleClearHistory = async () => {
    if (!user || !firestore || !dreamHistory) return;
    try {
        const qs = await getDocs(collection(firestore, `users/${user.uid}/dreams`));
        await Promise.all(qs.docs.map(d => deleteDoc(d.ref)));
        toast({ title: 'Éxito', description: 'Tu diario de sueños ha sido vaciado.' });
    } catch (error) {
        console.error("Error clearing dream history:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo limpiar el historial.' });
    }
  };

  const handleSelectDream = (id: string) => {
    router.push(`/dreams/analysis?id=${id}`);
    setIsHistoryOpen(false);
  };

  const blobToDataUri = (blob: Blob): Promise<string> => new Promise(res => {
    const r = new FileReader();
    r.onloadend = () => res(r.result as string);
    r.readAsDataURL(blob);
  });

  const transcribeAndSetText = async (audioBlob: Blob) => {
    setRecordingStatus('transcribing');
    setAudioStream(null);
    try {
        const audioDataUri = await blobToDataUri(audioBlob);
        // Show audio IMMEDIATELY (don't wait for Whisper response)
        setRecordedAudioUrl(audioDataUri);
        setRecordingStatus('done');

        const { transcription } = await analyzeDreamVoiceAction({ audioDataUri });

        if (!transcription || !transcription.trim()) {
            toast({ variant: "destructive", title: "Audio vacío", description: "No se detectó habla. Intenta de nuevo." });
            return;
        }

        // Type letter-by-letter into textarea
        let i = 0;
        const int = setInterval(() => {
            setDreamText(transcription.substring(0, i+1));
            i++;
            if (i > transcription.length) {
                clearInterval(int);
            }
        }, 18);
    } catch (err: any) {
        toast({ variant: "destructive", title: "Error de transcripción", description: err?.message || "No se pudo transcribir el audio." });
        setRecordingStatus('done');
    }
  };

  const startSilenceDetection = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
        if(mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            toast({ title: "Grabación finalizada", description: "Se detectó un silencio prolongado." });
        }
    }, SILENCE_TIMEOUT);
  }, [toast]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      setRecordedAudioUrl(null);

      mediaRecorderRef.current.addEventListener("dataavailable", e => {
        audioChunksRef.current.push(e.data);
        startSilenceDetection();
      });

      mediaRecorderRef.current.addEventListener("stop", () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if(blob.size > 0) transcribeAndSetText(blob);
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
      });

      mediaRecorderRef.current.start(1000);
      setRecordingStatus('recording');
      startSilenceDetection();
    } catch {
      toast({ variant: "destructive", title: "Error de Micrófono", description: "No se pudo acceder al micrófono." });
    }
  };

  const handlePauseOrResume = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.pause();
        setRecordingStatus('paused');
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    } else if (mediaRecorderRef.current?.state === 'paused') {
        mediaRecorderRef.current.resume();
        setRecordingStatus('recording');
        startSilenceDetection();
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
        mediaRecorderRef.current.stop();
    }
  };

  const clearRecording = () => {
    setRecordedAudioUrl(null);
    setDreamText('');
    setRecordingStatus('idle');
  };

  const sortedDreams = useMemo(() => {
    if (!dreamHistory) return [];
    return [...dreamHistory].sort((a, b) => {
         const tA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
         const tB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
         return tB - tA;
    })
  }, [dreamHistory]);

  const getFormattedDate = (dateString: string | Date | Timestamp) => {
    if (!dateString) return { relative: 'Fecha desconocida', absolute: '' };
    try {
      const date = dateString instanceof Timestamp ? dateString.toDate() : new Date(dateString);
      return {
          relative: formatDistanceToNow(date, { addSuffix: true, locale: es }),
          absolute: format(date, "d MMM, HH:mm", { locale: es })
      };
    } catch {
      return { relative: 'Fecha inválida', absolute: '' };
    }
  };

  // --- Content layout width ---
  const contentMaxW = isHistoryOpen ? (isMobile ? '0%' : 'calc(100% - 360px)') : '100%';

  return (
    <SidebarProvider>
      <div ref={portalRef} className="dream-portal flex h-screen">
        {/* Floating decorative elements — hydrated on client only to avoid SSR mismatch */}
        <div className="dream-stars" suppressHydrationWarning>
          {stars.map(s => (
            <div key={s.id} className={`dream-star ${s.size >= 3 ? 'dream-star--lg' : ''}`}
              style={{ width: `${s.size}px`, height: `${s.size}px`, left: `${s.left}%`, top: `${s.top}%` }} />
          ))}
        </div>
        <div ref={moonRef} className="dream-moon" />

        {/* Main sidebar (nimbus nav) */}
        <Sidebar className="dream-main-sidebar">
          <ChatSidebar chats={chats || []} activeChatId={''} isLoading={chatsLoading} removeChat={() => {}} clearChats={() => {}} startNewChat={() => Promise.resolve()} />
        </Sidebar>
        <SidebarInset className="flex overflow-hidden relative" style={{ zIndex: 1, background: 'transparent' }}>
            {/* Content area */}
            <main className="flex-1 flex flex-col overflow-y-auto relative" style={{ transition: 'margin-right 0.1s ease' }}>
                {/* Header */}
                <div className="dream-header">
                    <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <Button
                                asChild={analysisStep === 'input'}
                                variant="ghost"
                                size="icon"
                                style={{ color: 'hsl(220, 20%, 55%)', background: 'transparent' }}
                                onClick={() => analysisStep === 'specialist' && setAnalysisStep('input')}
                            >
                                {analysisStep === 'input' ? (
                                    <Link href="/"><ChevronLeft className="h-5 w-5" /></Link>
                                ) : (
                                    <ChevronLeft className="h-5 w-5" />
                                )}
                            </Button>
                            <h1 className="dream-header-title">Portal de Sueños</h1>
                        </div>
                         {/* Diary toggle button */}
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                              className="dream-diary-toggle"
                              title={isHistoryOpen ? 'Cerrar diario' : 'Abrir diario'}
                            >
                              {isHistoryOpen ? (
                                <X style={{ width: '20px', height: '20px' }} />
                              ) : (
                                <>
                                  <BookOpen style={{ width: '20px', height: '20px' }} />
                                  {dreamHistory && dreamHistory.length > 0 && (
                                    <span className="dream-diary-badge">{dreamHistory.length}</span>
                                  )}
                                </>
                              )}
                            </button>
                         </div>
                    </div>
                </div>

                {/* Step content */}
                <div className="dream-step-input">
                  {analysisStep === 'input' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%', maxWidth: '640px' }}>
                         <div ref={heroRef} style={{ textAlign: 'center', opacity: 0 }}>
                             <h2 className="dream-hero-title">¿Qué te ha mostrado tu subconsciente?</h2>
                             <p className="dream-hero-subtitle">Describe o relata tu sueño. Luego, elige un especialista para la interpretación.</p>
                         </div>

                         {profileError && (
                            <div className="dream-profile-warn">
                                <div className="dream-profile-warn-icon"><Info style={{ width: '20px', height: '20px' }} /></div>
                                <div>
                                    <div className="dream-profile-warn-title">Contexto Limitado</div>
                                    <div>{profileError}</div>
                                </div>
                            </div>
                         )}

                         <div className="dream-recorder-area">
                            {recordingStatus !== 'idle' && recordingStatus !== 'done' && (
                              <div className="dream-visualizer-frame"><AudioVisualizer stream={audioStream} /></div>
                            )}
                            {recordedAudioUrl && (
                                <div className="dream-audio-playback">
                                  <audio src={recordedAudioUrl} controls />
                                  {recordingStatus === 'transcribing' && (
                                    <div className="dream-audio-transcribing">
                                      <Loader2 style={{ width: '14px', height: '14px', animation: 'dream-spin 1s linear infinite' }} />
                                      Transcribiendo tu sueño...
                                    </div>
                                  )}
                                </div>
                            )}
                            <div ref={textareaWrapRef} className="dream-textarea-wrap" style={{ opacity: 0 }}>
                                <textarea
                                    value={dreamText}
                                    onChange={(e) => setDreamText(e.target.value)}
                                    placeholder="Escribe o graba tu sueño aquí..."
                                    className="dream-textarea"
                                    disabled={recordingStatus === 'transcribing'}
                                />
                                <div style={{ position: 'absolute', right: '12px', top: '12px' }}>
                                  <RecordingControls
                                    status={recordingStatus as any}
                                    onStart={handleStartRecording}
                                    onPause={handlePauseOrResume}
                                    onResume={handlePauseOrResume}
                                    onStop={handleStopRecording}
                                    onClear={clearRecording}
                                  />
                                </div>
                            </div>
                         </div>

                         <button
                            ref={ctaRef}
                            onClick={handleProceedToSelection}
                            disabled={isAnalyzing || (!profile && !authLoading)}
                            className="dream-cta-btn"
                            style={{ opacity: 0 }}
                         >
                            <Wand2 style={{ width: '20px', height: '20px' }} />
                            Elegir Especialista
                         </button>

                         <div className="dream-divider">~</div>

                         <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <AdsterraRectangle />
                         </div>
                    </div>
                  ) : (
                    <DreamSpecialistSelection onSelectSpecialist={handleAnalyzeDream} isLoading={isAnalyzing} />
                  )}
                </div>
            </main>

            {/* --- DREAM DIARY PANEL (slide-over) --- */}
            <div
              ref={panelRef}
              className="dream-diary-panel"
              style={{ opacity: 0, transform: `translateX(${isMobile ? window?.innerWidth || 390 : 360}px)` }}
            >
              <div className="dream-diary-panel-header">
                <h2 className="dream-history-title">
                  <BookOpen style={{ width: '20px', height: '20px', color: 'hsl(217, 72%, 84%)' }} />
                  Diario de Sueños
                  {dreamHistory && dreamHistory.length > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'hsl(220, 20%, 45%)', fontWeight: 400 }}>({dreamHistory.length})</span>
                  )}
                </h2>
                <button onClick={() => setIsHistoryOpen(false)} className="dream-diary-panel-close">
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
              <div className="dream-diary-panel-body">
                {isLoadingHistory ? (
                  <div style={{ padding: '12px' }}>
                    <div className="dream-skeleton" />
                    <div className="dream-skeleton" />
                    <div className="dream-skeleton" />
                  </div>
                ) : sortedDreams.length === 0 ? (
                  <div className="dream-empty-state">
                    <p>Tu diario está vacío. Interpreta tu primer sueño para empezar.</p>
                  </div>
                ) : (
                  sortedDreams.map(dream => {
                    const { relative, absolute } = getFormattedDate(dream.createdAt);
                    return (
                      <div key={dream.id} className="dream-diary-item" data-dream-id={dream.id}>
                        <button onClick={() => handleSelectDream(dream.id)} className="dream-diary-card">
                          <div className="dream-diary-card-title">{dream.interpretation?.dreamTitle || 'Sueño sin título'}</div>
                          <div className="dream-diary-card-meta">
                            <span className="dream-diary-meta-item"><Calendar /> {absolute}</span>
                            <span className="dream-diary-meta-item"><Clock /> {relative}</span>
                          </div>
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="dream-diary-delete"><Trash2 className="w-4 h-4"/></button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar este sueño?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción es permanente y no se puede deshacer.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteDream(dream.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )
                  })
                )}
              </div>
              {dreamHistory && dreamHistory.length > 0 && (
                <div className="dream-diary-panel-footer">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="dream-history-clear-btn">
                        <Trash2 style={{ width: '12px', height: '12px' }} />
                        Limpiar Diario
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>Esto eliminará permanentemente TODOS los sueños de tu diario.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearHistory} className="bg-destructive hover:bg-destructive/90">Sí, limpiar todo</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}