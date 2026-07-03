'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Pause, Play, Square, Trash2, Edit, Save, Bot, Loader2, ArrowDown, Users, Sparkles, Check, AudioLines, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AudioDraft, DiagnosticReport, DetectedParticipant } from '@/lib/types';
import AudioVisualizer from '@/components/dreams/AudioVisualizer';
import AudioPlayer from '@/components/recorder/AudioPlayer';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAudioDrafts } from './useAudioDrafts';
import TreatmentDialog from '@/components/shared/TreatmentTimeline';

interface RecorderUIProps {
  initialDraft: AudioDraft | null;
  onNewRecording: () => void;
  onDraftCreated: (draft: AudioDraft) => void;
}

type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped';
type AnalysisStatus = 'idle' | 'analyzing' | 'done' | 'error';
type AnalysisStep = 'idle' | 'transcribing' | 'analyzing' | 'finalizing';

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};


export default function RecorderUI({ initialDraft, onNewRecording, onDraftCreated }: RecorderUIProps) {
  const { toast } = useToast();
  const { saveDraft, deleteDraft, updateDraft } = useAudioDrafts();

  // --- LOCAL STATE ---
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [recorderStatus, setRecorderStatus] = useState<RecorderStatus>('idle');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('idle');
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [time, setTime] = useState(0);
  const [isPlaybackVisualizerActive, setIsPlaybackVisualizerActive] = useState(false);
  const [transcription, setTranscription] = useState<string | undefined>(undefined);
  const [detectedParticipants, setDetectedParticipants] = useState<DetectedParticipant[]>([]);
  const [detectedParticipantsSummary, setDetectedParticipantsSummary] = useState<string>('');


  // --- REFS ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- EFFECT TO SYNC WITH PROPS ---
  useEffect(() => {
    setCurrentDraftId(initialDraft?.id || null);
    setTitle(initialDraft?.title || `Grabación ${new Date().toLocaleDateString()}`);
    setReport(initialDraft?.report || null);
    setTranscription(initialDraft?.transcription);
    setDetectedParticipants(initialDraft?.detectedParticipants || []);
    setDetectedParticipantsSummary(initialDraft?.detectedParticipantsSummary || '');
    setAudioUrl(initialDraft?.audioUrl || null);
    setAnalysisStatus(initialDraft?.report ? 'done' : 'idle');
    setAnalysisStep(initialDraft?.report ? 'finalizing' : 'idle');
    setRecorderStatus(initialDraft?.audioUrl ? 'stopped' : 'idle');
    setIsEditingTitle(!initialDraft);
    setTime(0);
    setIsPlaybackVisualizerActive(false);
    setStream(null);
  }, [initialDraft]);

  // --- ACTIONS ---
  const handleSaveTitle = async () => {
    if (currentDraftId && title.trim()) {
      await updateDraft(currentDraftId, { title: title.trim() });
      setIsEditingTitle(false);
      toast({ title: "Título guardado" });
    } else {
      setIsEditingTitle(false);
    }
  };
  
  // Roles ya no se ingresan manualmente. La IA los detecta.
  // (handleSaveRoles eliminado)

  const handleDelete = async () => {
    if (currentDraftId) {
      await deleteDraft(currentDraftId);
    }
    onNewRecording();
    toast({ title: "Borrador eliminado" });
  };
  
  const startTimer = () => {
    stopTimer();
    timerIntervalRef.current = setInterval(() => setTime(prev => prev + 1), 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const startRecording = async () => {
    setRecorderStatus('recording');
    setAudioUrl(null);
    setReport(null);
    setAnalysisStatus('idle');
    setTime(0);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      const recorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      
      recorder.onstart = startTimer;
      
      recorder.onstop = async () => {
        stopTimer();
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const finalTitle = title.trim() || `Grabación ${new Date().toLocaleDateString()}`;
        const savedDraft = await saveDraft(currentDraftId, finalTitle, audioBlob);
        
        setAudioUrl(savedDraft.audioUrl);
        setCurrentDraftId(savedDraft.id);
        
        onDraftCreated(savedDraft);
        toast({ title: "Borrador guardado automáticamente" });
        
        mediaStream.getTracks().forEach(track => track.stop());
        setStream(null);
      };

      recorder.start();
    } catch (err) {
      console.error("Mic error:", err);
      toast({ variant: 'destructive', title: "Error de Micrófono" });
      setRecorderStatus('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recorderStatus === 'recording' || recorderStatus === 'paused')) {
      mediaRecorderRef.current.stop();
      setRecorderStatus('stopped');
    }
  };

  const pauseRecording = () => {
      if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.pause();
          setRecorderStatus('paused');
          stopTimer();
      }
  };
  
  const resumeRecording = () => {
      if (mediaRecorderRef.current?.state === 'paused') {
          mediaRecorderRef.current.resume();
          setRecorderStatus('recording');
          startTimer();
      }
  };

  const handleAnalyze = async () => {
    if (!audioUrl || !currentDraftId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No hay un borrador de audio para analizar.' });
      return;
    }

    if (audioUrl.length < 1500) {
      toast({
        variant: 'destructive',
        title: 'Audio demasiado corto',
        description: 'La grabación parece vacía. Graba al menos unos segundos con voz audible.',
      });
      return;
    }

    setAnalysisStatus('analyzing');
    setAnalysisStep('transcribing');

    // Avance cosmético de UI: avanza entre pasos mientras la IA trabaja;
    // el estado final se confirma al recibir la respuesta del servidor.
    const stepTimer1 = setTimeout(() => setAnalysisStep('analyzing'), 8000);
    const stepTimer2 = setTimeout(() => setAnalysisStep('finalizing'), 15000);

    try {
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(new Error('Timeout aguardando respuesta del servidor (90s). Intenta de nuevo o reduce la duración del audio.')), 90_000);

      let res: Response;
      try {
        res = await fetch('/api/analyze-recording', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioDataUri: audioUrl,
            title: title.trim() || 'Grabación sin título',
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(fetchTimeout);
      }

      if (!res.ok) {
        let errPayload: any = null;
        try {
          errPayload = await res.json();
        } catch { /* no JSON body */ }

        const message =
          errPayload?.error ||
          `Error HTTP ${res.status} en el análisis. Verifica tu audio.`;
        const hint = errPayload?.hint;
        const composed = hint ? `${message} — ${hint}` : message;
        throw new Error(composed);
      }

      const result = await res.json();

      if (!result.report || !result.transcription) {
        throw new Error("El análisis no devolvió un informe completo.");
      }

      await updateDraft(currentDraftId, {
        transcription: result.transcription,
        report: result.report,
        detectedParticipants: result.detectedParticipants,
        detectedParticipantsSummary: result.detectedParticipantsSummary,
      });

      setTranscription(result.transcription);
      setReport(result.report);
      setDetectedParticipants(result.detectedParticipants || []);
      setDetectedParticipantsSummary(result.detectedParticipantsSummary || '');
      setAnalysisStatus('done');
      setAnalysisStep('finalizing');
      const participantsCount = result.detectedParticipants?.length ?? 0;
      toast({
        title: 'Análisis Completado',
        description: `Informe listo. Se detectaron ${participantsCount} hablante(s).`,
      });
    } catch (err: any) {
      // Si el cliente abortó (timeout), capturamos el mensaje desde el AbortController
      const isAbort = err?.name === 'AbortError' || /abort/i.test(err?.message || '');
      if (isAbort) console.warn('[Nimbus Recorder UI] La petición fue abortada por timeout');
      console.error("Analysis failed:", err);
      setAnalysisStatus('error');
      toast({
        variant: 'destructive',
        title: 'Error de Análisis',
        description: err?.message || 'Verifica que tu audio sea válido y que tengas conexión.',
      });
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
    }
  };
  
  const handlePlaybackStateChange = useCallback((isPlaying: boolean) => {
    setIsPlaybackVisualizerActive(isPlaying);
  }, []);

  // --- RENDER LOGIC ---

  const renderMainCircle = () => {
    const showRecordingVisualizer = recorderStatus === 'recording' && stream;
    const showPlaybackVisualizer = recorderStatus === 'stopped' && isPlaybackVisualizerActive && stream;
    const showVisualizer = showRecordingVisualizer || showPlaybackVisualizer;
      
    return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="relative w-64 h-64 rounded-full flex items-center justify-center border-8 border-card-foreground/10"
    >
      <div className="absolute inset-0 rounded-full bg-card/50 overflow-hidden">
        {showVisualizer && (
             <div className="absolute inset-0 z-0">
                <div className="animated-border" style={{ animationDuration: '8s' }}></div>
                <div className="absolute inset-0 bg-background opacity-20 animate-pulse" style={{animationDuration: '3s'}}></div>
             </div>
        )}
      </div>
      
      <AnimatePresence mode="wait">
        {(recorderStatus === 'recording' || recorderStatus === 'paused') ? (
          <motion.div key="timer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute z-10 text-6xl font-mono tabular-nums text-foreground">
            {formatTime(time)}
          </motion.div>
        ) : (
          <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <Mic className="h-24 w-24 text-foreground/80" />
          </motion.div>
        )}
      </AnimatePresence>
      {showVisualizer && stream && (
         <div className="absolute inset-0 rounded-full overflow-hidden">
             <AudioVisualizer stream={stream} />
         </div>
      )}
    </motion.div>
    );
  };

  const renderActionButtons = () => (
    <div className="mt-8 w-full max-w-xl flex flex-col items-center gap-4">
      <AnimatePresence mode="wait">
        {recorderStatus === 'idle' && !audioUrl && (
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button onClick={startRecording} size="lg" className="w-64 h-16 text-lg rounded-full">Iniciar Grabación</Button>
          </motion.div>
        )}
        {recorderStatus === 'recording' && (
          <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center items-center gap-4">
            <Button onClick={stopRecording} size="lg" className="w-40 h-16 text-lg rounded-full bg-red-600 hover:bg-red-700"><Square className="mr-2" /> Detener</Button>
            <Button onClick={pauseRecording} size="lg" variant="outline" className="w-40 h-16 text-lg rounded-full"><Pause className="mr-2" /> Pausar</Button>
          </motion.div>
        )}
        {recorderStatus === 'paused' && (
          <motion.div key="paused" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center items-center">
              <Button onClick={resumeRecording} size="lg" className="h-16 text-lg rounded-full px-10"><Play className="mr-2" /> Reanudar</Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {audioUrl && recorderStatus === 'stopped' && (
        <AudioPlayer 
            audioUrl={audioUrl}
            setAudioStream={setStream} 
            onPlaybackStateChange={handlePlaybackStateChange}
        />
      )}
    </div>
  );
  
  const reportSections = [
    { key: 'reasonForConsultation', title: 'Motivo de Consulta' },
    { key: 'mainSymptoms', title: 'Síntomas Principales' },
    { key: 'courseAndEvolution', title: 'Curso y Evolución' },
    { key: 'riskAndProtectiveFactors', title: 'Factores de Riesgo y Protectores' },
    { key: 'riskAssessment', title: 'Evaluación de Riesgo' },
    { key: 'clinicalHypothesis', title: 'Hipótesis Clínica' },
    { key: 'differentialDiagnosis', title: 'Diagnóstico Diferencial' },
    { key: 'diagnosticSynthesis', title: 'Síntesis Diagnóstica' },
  ];

  const renderAnalysisSection = () => {
    if (analysisStatus === 'analyzing') {
        const steps = [
          { id: 'transcribing' as const, label: 'Transcribiendo audio con Whisper', icon: AudioLines },
          { id: 'analyzing' as const, label: 'Detectando hablantes y roles', icon: Users },
          { id: 'finalizing' as const, label: 'Generando informe clínico', icon: Brain },
        ];
        const currentStepIndex = steps.findIndex(s => s.id === analysisStep);

        return (
            <div className="mt-8 w-full max-w-2xl space-y-6">
              <div className="text-center">
                <Brain className="h-12 w-12 mx-auto text-primary animate-pulse" />
                <h3 className="mt-3 text-lg font-semibold">Analizando tu grabación</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Este proceso puede tardar entre 30s y 2 minutos mientras la IA procesa el audio profundo. Por favor, no cierres esta ventana.
                </p>
              </div>

              <Card className="bg-card/40">
                <CardContent className="pt-6 space-y-3">
                  {steps.map((step, idx) => {
                    const isDone = idx < currentStepIndex || (currentStepIndex === -1);
                    const isCurrent = idx === currentStepIndex;
                    const isPending = idx > currentStepIndex;

                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          isCurrent ? 'bg-primary/10 border border-primary/20' : ''
                        }`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isDone ? 'bg-emerald-500/20 text-emerald-400'
                            : isCurrent ? 'bg-primary/30 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {isDone ? <Check className="h-4 w-4" /> :
                           isCurrent ? <Loader2 className="h-4 w-4 animate-spin" /> :
                           <Icon className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            isDone ? 'text-emerald-300 line-through opacity-60'
                              : isCurrent ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}>
                            {step.label}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>

              <p className="text-xs text-center text-muted-foreground/70 italic">
                La IA analiza el discurso clínico con rotación automática entre múltiples modelos (NVIDIA → Gemini → Groq) para garantizar precisión.
              </p>
            </div>
        )
    }

    if (audioUrl && !report) {
       return (
        <div className="mt-8 w-full max-w-3xl flex flex-col items-center space-y-4">
            <Card className="w-full bg-card/30">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      Detección automática
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Los hablantes y roles se identifican automáticamente al analizar el audio. No necesitas ingresar nada manualmente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Al pulsar <span className="font-semibold">"Analizar Grabación con IA"</span>, Nimbus transcribirá el audio y detectará cuántos participantes hay y qué rol tiene cada uno (psicólogo, paciente, familiar, etc.).
                    </p>
                </CardContent>
            </Card>
          <div className="flex items-center gap-2 p-4 border-t border-dashed w-full justify-center">
            <Button onClick={handleAnalyze} className="h-12 text-base flex-grow">
              <Bot className="mr-2 h-4 w-4" />
              Analizar Grabación con IA
            </Button>
             {initialDraft && (
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-12 w-12 flex-shrink-0">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                      <AlertDialogDescription>Esta acción es permanente.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
             )}
          </div>
        </div>
      );
    }
    
    if (report) {
      return (
        <div className="w-full text-left mt-8 max-w-3xl">
          <div className="w-full text-left">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Análisis Clínico Estructural</h2>
                <Button variant="outline" onClick={handleAnalyze} disabled={analysisStatus === 'analyzing'}>
                    {analysisStatus === 'analyzing' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Re-analizar
                </Button>
            </div>

            {detectedParticipants && detectedParticipants.length > 0 && (
              <Card className="bg-card/40 mb-6 border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-400" />
                    Participantes Detectados por IA ({detectedParticipants.length})
                  </CardTitle>
                  {detectedParticipantsSummary && (
                    <CardDescription className="text-xs">{detectedParticipantsSummary}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {detectedParticipants.map((p, idx) => (
                      <li key={idx} className="flex flex-col sm:flex-row sm:items-start sm:gap-3 border-b border-border/40 pb-2 last:border-b-0">
                        <div className="font-mono text-xs bg-muted/60 px-2 py-0.5 rounded w-fit">{p.rawLabel}</div>
                        <div className="flex-1 mt-1 sm:mt-0">
                          <div className="font-semibold">{p.inferredRole}</div>
                          {p.rationale && (
                            <div className="text-xs text-muted-foreground mt-1">{p.rationale}</div>
                          )}
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded w-fit ${
                          p.confidence === 'alta' ? 'bg-emerald-500/20 text-emerald-300'
                          : p.confidence === 'media' ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {p.confidence}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            <Accordion type="multiple" defaultValue={['diagnosticSynthesis']} className="w-full space-y-4">
                {reportSections.map(section => (
                    report[section.key as keyof DiagnosticReport] && (
                        <AccordionItem value={section.key} key={section.key}>
                          <Card className="bg-card/50">
                            <AccordionTrigger className="p-6 text-left">
                              <CardTitle className="text-base">{section.title}</CardTitle>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground break-words">
                                <ReactMarkdown>{String(report[section.key as keyof DiagnosticReport])}</ReactMarkdown>
                              </div>
                            </AccordionContent>
                          </Card>
                        </AccordionItem>
                    )
                ))}
            
                <AccordionItem value="dsm5trTable">
                <Card className="bg-card/50">
                    <AccordionTrigger className="p-6 text-left"><CardTitle className="text-base">Tabla Diagnóstica (DSM-5-TR)</CardTitle></AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead><tr className="border-b"><th className="p-2 text-left font-semibold">Criterio</th><th className="p-2 text-left font-semibold">Evidencia</th><th className="p-2 text-left font-semibold">Conclusión</th></tr></thead>
                                <tbody>
                                    {report.dsm5trTable.map((item, index) => (
                                        <tr key={index} className="border-b"><td className="p-2 align-top font-medium break-words">{item.criteria}</td><td className="p-2 align-top text-muted-foreground break-words">{item.evidence}</td><td className="p-2 align-top font-semibold break-words">{item.conclusion}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </AccordionContent>
                </Card>
                </AccordionItem>

                 <AccordionItem value="recommendedTreatments">
                    <Card className="bg-card/50"><AccordionTrigger className="p-6 text-left"><CardTitle className="text-base">Tratamientos Recomendados</CardTitle></AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <div className="space-y-4">
                        {report.recommendedTreatments.map((treatment, index) => (
                           <TreatmentDialog key={index} treatment={treatment} />
                        ))}
                        </div>
                    </AccordionContent>
                    </Card>
                </AccordionItem>
            </Accordion>
          </div>
        </div>
      );
    }
    
    return (
        <div className="text-center mt-12 text-muted-foreground animate-pulse">
            <ArrowDown className="mx-auto h-8 w-8" />
            <p>Inicia una grabación para comenzar</p>
        </div>
    );
  };

  return (
      <div className="flex-1 flex flex-col items-center justify-start p-4 pb-8">
         <div className="w-full max-w-xl text-center mb-8 mt-4">
            {isEditingTitle ? (
              <div className="flex items-center justify-center gap-2">
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-bold text-center bg-transparent border-0 border-b-2 rounded-none focus:ring-0"
                  autoFocus
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                />
                <Button variant="ghost" size="icon" onClick={handleSaveTitle}><Save className="h-5 w-5" /></Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 group h-12">
                <h1 className="text-2xl font-bold">{title}</h1>
                {initialDraft && <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditingTitle(true)}><Edit className="h-5 w-5" /></Button>}
              </div>
            )}
        </div>
        
        {renderMainCircle()}
        {renderActionButtons()}
        {renderAnalysisSection()}
      </div>
  );
}