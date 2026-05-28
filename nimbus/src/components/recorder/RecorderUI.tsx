'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Pause, Play, Square, Trash2, Edit, Save, Bot, Loader2, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AudioDraft, DiagnosticReport } from '@/lib/types';
import AudioVisualizer from '@/components/dreams/AudioVisualizer';
import AudioPlayer from '@/components/recorder/AudioPlayer';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { analyzeAudioRecording } from '@/ai/flows/analyze-audio-recording';
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
  const [roles, setRoles] = useState({ speakerOne: 'Hablante 1', speakerTwo: 'Hablante 2' });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [recorderStatus, setRecorderStatus] = useState<RecorderStatus>('idle');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [time, setTime] = useState(0);
  const [isPlaybackVisualizerActive, setIsPlaybackVisualizerActive] = useState(false);


  // --- REFS ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- EFFECT TO SYNC WITH PROPS ---
  useEffect(() => {
    setCurrentDraftId(initialDraft?.id || null);
    setTitle(initialDraft?.title || `Grabación ${new Date().toLocaleDateString()}`);
    setRoles(initialDraft?.roles || { speakerOne: 'Hablante 1', speakerTwo: 'Hablante 2' });
    setReport(initialDraft?.report || null);
    setAudioUrl(initialDraft?.audioUrl || null);
    setAnalysisStatus(initialDraft?.report ? 'done' : 'idle');
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
  
  const handleSaveRoles = async () => {
    if (currentDraftId) {
        await updateDraft(currentDraftId, { roles });
        toast({ title: "Roles guardados" });
    }
  }

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
        const savedDraft = await saveDraft(currentDraftId, finalTitle, audioBlob, roles);
        
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
    setAnalysisStatus('analyzing');
    try {
      await handleSaveRoles(); // Save roles before analyzing
      const result = await analyzeAudioRecording({
        audioDataUri: audioUrl,
        title: title.trim(),
        roles,
      });

      if (!result.report || !result.transcription) throw new Error("El análisis no devolvió un informe completo.");
      
      await updateDraft(currentDraftId, { transcription: result.transcription, report: result.report });

      setReport(result.report);
      setAnalysisStatus('done');
      toast({ title: 'Análisis Completado', description: 'El informe diagnóstico está listo.' });
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setAnalysisStatus('error');
      toast({ variant: 'destructive', title: 'Error de Análisis', description: err.message });
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
        return (
            <div className="mt-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">Transcribiendo y analizando el audio...</p>
            </div>
        )
    }

    if (audioUrl && !report) {
       return (
        <div className="mt-8 w-full max-w-3xl flex flex-col items-center space-y-4">
            <Card className="w-full bg-card/30">
                <CardHeader>
                    <CardTitle className="text-base">Definir Roles (Opcional)</CardTitle>
                    <CardDescription className="text-xs">Contextualiza a la IA para un análisis más preciso.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Input value={roles.speakerOne} onChange={e => setRoles(prev => ({...prev, speakerOne: e.target.value}))} onBlur={handleSaveRoles} placeholder="Rol del Hablante 1"/>
                    <Input value={roles.speakerTwo} onChange={e => setRoles(prev => ({...prev, speakerTwo: e.target.value}))} onBlur={handleSaveRoles} placeholder="Rol del Hablante 2"/>
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