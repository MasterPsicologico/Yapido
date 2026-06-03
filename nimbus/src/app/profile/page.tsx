


'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, useCollection, useFirestore } from '@/firebase';
import type { Chat, ProfileData, CachedProfile, Message, ProfileVersion } from '@/lib/types';
import { loadProfile as loadProfileFromFirestore, saveProfileVersion, loadProfileVersions } from '@/lib/profile-service';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit, UserCheck, ShieldCheck, ListChecks, ChevronLeft, Sparkles, Filter, ShieldQuestion, Info, RefreshCcw, LineChart, Target, Repeat, Star, Shield, AlertTriangle, GitCommit, LayoutDashboard, BarChart3, Search, Cog, BookOpen, History, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import ReactMarkdown from 'react-markdown';
import EmotionalChart from '@/components/profile/EmotionalChart';
import BreakdownExerciseGenerator from '@/components/profile/BreakdownExerciseGenerator';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import TextSizeControl from '@/components/profile/TextSizeControl';
import { cn } from '@/lib/utils';
import ProfileCryptoAnalysis from '@/components/profile/ProfileCryptoAnalysis';
import { updatePsychologicalBlueprint } from './actions';
import { Timestamp, collection, query, orderBy, getDocs, limit } from 'firebase/firestore';

const EmotionalConstellation = dynamic(() => import('@/components/profile/EmotionalConstellation'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />,
});

type TextSize = 'sm' | 'base' | 'lg';

export default function PsychologicalProfile() {
  const { user, loading: authLoadingFromHook } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('Iniciando...');
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [versions, setVersions] = useState<ProfileVersion[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const [diagnosisTextSize, setDiagnosisTextSize] = useState<TextSize>('base');
  const [personalityTextSize, setPersonalityTextSize] = useState<TextSize>('base');
  const [strengthsTextSize, setStrengthsTextSize] = useState<TextSize>('base');

  const storageKey = useMemo(() => user ? `psych-profile-${user.uid}` : null, [user]);

  const chatsQuery = useMemo(() => 
    user ? query(collection(firestore, `users/${user.uid}/chats`), orderBy('latestMessageAt', 'desc')) : undefined
  , [user, firestore]);

  const { data: chats, loading: chatsLoading } = useCollection<Chat>(chatsQuery);

  // -------------------------------------------------------------------
  // Load profile from Firestore (primary) → localStorage (fallback cache)
  // -------------------------------------------------------------------
  const loadInitialProfile = useCallback(async () => {
    if (!user || !firestore) return;

    try {
      // 1. Try Firestore first (source of truth)
      const profileMain = await loadProfileFromFirestore(firestore, user.uid);
      if (profileMain) {
        setProfile(profileMain.latestProfile);
        setCurrentVersion(profileMain.currentVersion);
        // Sync to localStorage as a fast cache
        const cacheData: CachedProfile = {
          profile: profileMain.latestProfile,
          lastMessageTimestamp: profileMain.lastMessageTimestamp,
          currentVersion: profileMain.currentVersion,
        };
        localStorage.setItem(storageKey!, JSON.stringify(cacheData));
        return;
      }

      // 2. Fallback to localStorage (migration path for old data)
      const cachedItem = localStorage.getItem(storageKey!);
      if (cachedItem) {
        try {
          const data: CachedProfile = JSON.parse(cachedItem);
          setProfile(data.profile);
          setCurrentVersion(data.currentVersion || null);
        } catch (e) {
          console.error("Failed to parse cached profile", e);
          localStorage.removeItem(storageKey!);
        }
      }
    } catch (e) {
      console.error("Error loading profile from Firestore", e);
      // Fallback to localStorage if Firestore fails
      const cachedItem = localStorage.getItem(storageKey!);
      if (cachedItem) {
        try {
          const data: CachedProfile = JSON.parse(cachedItem);
          setProfile(data.profile);
          setCurrentVersion(data.currentVersion || null);
        } catch (parseErr) {
          console.error("Failed to parse cached profile", parseErr);
        }
      }
    }
  }, [user, firestore, storageKey]);

  // -------------------------------------------------------------------
  // Load version history
  // -------------------------------------------------------------------
  const loadVersionHistory = useCallback(async () => {
    if (!user || !firestore) return;
    try {
      const allVersions = await loadProfileVersions(firestore, user.uid);
      setVersions(allVersions);
    } catch (e) {
      console.error("Error loading profile versions", e);
    }
  }, [user, firestore]);

  // -------------------------------------------------------------------
  // Generate / regenerate the profile
  // -------------------------------------------------------------------
  const fetchAndGenerateProfile = useCallback(async () => {
    if (!user || !storageKey || !firestore) {
      setError('Datos insuficientes o no has iniciado sesión.');
      return;
    }

    setGenerating(true);
    setLoading(false);
    setError(null);
    setProgress(10);
    setGenerationStatus('Recolectando historial de chats...');

    try {
      let fullChatHistory = '';
      let totalMessagesAnalyzed = 0;
      const chatsRef = collection(firestore, `users/${user.uid}/chats`);
      const q = query(chatsRef, orderBy('createdAt', 'desc'), limit(30));
      const chatsSnapshot = await getDocs(q);

      if (chatsSnapshot.empty) {
        throw new Error('Tus conversaciones están vacías. No se puede generar un perfil.');
      }
      
      setProgress(30);
      setGenerationStatus('Procesando mensajes...');

      // Build context from previous profile (full JSON for evolutionary comparison)
      let previousProfilesContext = '';
      let previousFullProfile = '';

      // Load from Firestore (primary)
      const existingMain = await loadProfileFromFirestore(firestore, user.uid);
      if (existingMain?.latestProfile) {
        previousFullProfile = JSON.stringify(existingMain.latestProfile);
        const keyTopics = [
          ...(existingMain.latestProfile.emotionalConstellation?.nodes?.map(n => n.id) || []),
          ...(existingMain.latestProfile.cognitiveBiases || [])
        ];
        if (keyTopics.length > 0) {
          previousProfilesContext = `Temas clave del último análisis (v${existingMain.currentVersion}): ${keyTopics.join(', ')}.`;
        }
      } else {
        // Fallback to localStorage for migration
        const cachedItem = localStorage.getItem(storageKey);
        if (cachedItem) {
          try {
            const data: CachedProfile = JSON.parse(cachedItem);
            previousFullProfile = JSON.stringify(data.profile);
            const keyTopics = [
              ...(data.profile.emotionalConstellation?.nodes?.map(n => n.id) || []),
              ...(data.profile.cognitiveBiases || [])
            ];
            if (keyTopics.length > 0) {
              previousProfilesContext = `Temas clave del último análisis: ${keyTopics.join(', ')}.`;
            }
          } catch (e) {
            console.warn("Could not parse cached profile for context, generating from scratch.", e);
          }
        }
      }

      for (const chatDoc of chatsSnapshot.docs) {
        const chat = chatDoc.data() as Chat;
        fullChatHistory += `--- INICIO DEL CHAT: ${chat.title} ---\n`;
        
        const messagesRef = collection(chatDoc.ref, 'messages');
        const messagesSnapshot = await getDocs(query(messagesRef, orderBy('timestamp', 'asc')));
        
        messagesSnapshot.forEach(doc => {
          const msg = doc.data() as Message;
          const ts = msg.timestamp;
          totalMessagesAnalyzed++;
          
          // Robust timestamp handling
          let date: Date | null = null;
          if (ts && typeof ts.toDate === 'function') {
            date = ts.toDate();
          }
          
          if (date) {
            fullChatHistory += `[${date.toISOString()}] ${msg.role}: ${msg.content}\n`;
          }
        });
        fullChatHistory += `--- FIN DEL CHAT ---\n\n`;
      }

      if (!fullChatHistory.trim()) {
        throw new Error('El historial de chat recuperado está vacío.');
      }

      setProgress(50);
      setGenerationStatus('Enviando al servidor de IA...');
      
      const payload: any = { fullChatHistory };
      if (previousProfilesContext) payload.previousProfilesContext = previousProfilesContext;
      if (previousFullProfile) payload.previousFullProfile = previousFullProfile;

      const result = await updatePsychologicalBlueprint(payload);
      
      setProgress(80);
      setGenerationStatus('Guardando en la nube...');

      if (!result) {
        throw new Error('La generación del perfil falló en el servidor.');
      }
      
      // Save to Firestore with versioning
      const newVersion = await saveProfileVersion(
        firestore,
        user.uid,
        result,
        totalMessagesAnalyzed,
      );

      // Sync to localStorage as cache
      const newCachedData: CachedProfile = {
        profile: result,
        lastMessageTimestamp: Date.now(),
        currentVersion: newVersion,
      };
      localStorage.setItem(storageKey, JSON.stringify(newCachedData));
      
      setProfile(result);
      setCurrentVersion(newVersion);
      setNeedsUpdate(false);
      setProgress(100);
      setGenerationStatus('¡Completado!');

      toast({
        title: `Perfil v${newVersion} generado`,
        description: newVersion === '1.0'
          ? 'Tu primer Cianotipo Psicológico ha sido creado y guardado.'
          : 'Tu perfil ha sido actualizado con un informe evolutivo comparativo.',
      });

      // Refresh version history
      loadVersionHistory();

    } catch (e: any) {
      console.error('Error in fetchAndGenerateProfile:', e);
      setError(e.message || 'Ocurrió un error al generar tu perfil. Por favor, inténtalo de nuevo más tarde.');
      toast({
        variant: "destructive",
        title: "Error de Generación",
        description: e.message || 'No se pudo generar el perfil.',
      });
    } finally {
      setTimeout(() => setGenerating(false), 500);
    }
  }, [user, storageKey, firestore, toast, loadVersionHistory]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const authLoading = authLoadingFromHook || !isClient;

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setError('Debes iniciar sesión para ver tu perfil.');
      setLoading(false);
      return;
    }

    const init = async () => {
      await loadInitialProfile();
      setLoading(false);
    };
    init();
    
  }, [user, isClient, authLoading, loadInitialProfile]);
  
  useEffect(() => {
    if (chatsLoading || !isClient || !chats) return;

    const checkNeedsUpdate = async () => {
      if (!user || !firestore) return;

      // Check if there's a profile at all
      const profileMain = await loadProfileFromFirestore(firestore, user.uid);
      if (!profileMain) {
        if (chats.length > 0) setNeedsUpdate(true);
        return;
      }

      const lastProfileUpdate = profileMain.lastMessageTimestamp || 0;
      const lastMessageTimestamp = chats.reduce((latest, chat) => {
        const time = chat.latestMessageAt?.toMillis() || chat.createdAt?.toMillis() || 0;
        return time > latest ? time : latest;
      }, 0);
      
      if (lastMessageTimestamp > lastProfileUpdate) {
        setNeedsUpdate(true);
      } else {
        setNeedsUpdate(false);
      }
    };

    checkNeedsUpdate();
  }, [chats, chatsLoading, isClient, user, firestore]);


  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="mb-6">
           <Button asChild variant="ghost" className='-ml-4 text-muted-foreground hover:bg-accent/10 hover:text-foreground'>
                <Link href="/">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Volver al Chat
                </Link>
            </Button>
        </div>
        <Skeleton className="h-10 w-1/3 bg-muted" />
        <Skeleton className="h-8 w-1/2 bg-muted" />
        <div className="space-y-4">
            <Skeleton className="h-32 w-full bg-muted" />
            <Skeleton className="h-32 w-full bg-muted" />
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-10">
              <motion.div
                  className="absolute"
                  style={{ top: '10%', left: '15%', width: '20vw', height: '20vw' }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              >
                  <Cog className="w-full h-full text-foreground" />
              </motion.div>
              <motion.div
                  className="absolute"
                  style={{ bottom: '5%', right: '10%', width: '30vw', height: '30vw' }}
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
              >
                  <Cog className="w-full h-full text-foreground" />
              </motion.div>
          </div>
          
          <div className="relative z-10 p-4">
              <motion.div
                  className="relative w-48 h-48 md:w-64 md:h-64 mx-auto mb-8"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
              >
                  <Cog className="w-full h-full text-primary/50" />
              </motion.div>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-full max-w-md bg-background/50 backdrop-blur-sm p-6 rounded-xl">
                      <h2 className="text-2xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-br from-chart-5 via-chart-1 to-chart-2">Generando tu Cianotipo Psicológico...</h2>
                      <p className="text-muted-foreground mb-4">La IA está analizando tu historial para crear un informe evolutivo.</p>
                      <div className='w-full max-w-sm mx-auto space-y-2'>
                          <Progress value={progress} className="w-full h-2" />
                          <p className='text-center text-xs font-medium text-primary'>{generationStatus} ({Math.round(progress)}%)</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        <Button asChild variant="ghost" className="-ml-4 mb-4 text-muted-foreground hover:bg-accent/10 hover:text-foreground">
          <Link href="/">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver al Chat
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => fetchAndGenerateProfile()} className="mt-4">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  if (!profile) {
     return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
            <Button asChild variant="ghost" className="-ml-4 mb-4 text-muted-foreground hover:bg-accent/10 hover:text-foreground">
              <Link href="/">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver al Chat
              </Link>
            </Button>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No hay perfil para mostrar</AlertTitle>
              <AlertDescription>
                Aún no has generado tu perfil psicológico. Haz clic abajo para empezar el análisis.
              </AlertDescription>
            </Alert>
            <Button onClick={() => fetchAndGenerateProfile()} className="mt-4">
              <Sparkles className="mr-2 h-4 w-4" />
              Generar mi perfil ahora
            </Button>
        </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
           <Button asChild variant="ghost" className='-ml-4 text-muted-foreground hover:bg-accent/10 hover:text-foreground'>
                <Link href="/">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Volver al Chat
                </Link>
            </Button>
            <div className="flex items-center gap-2">
              {currentVersion && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => {
                    setShowVersionHistory(!showVersionHistory);
                    if (!showVersionHistory && versions.length === 0) {
                      loadVersionHistory();
                    }
                  }}
                >
                  <History className="h-3.5 w-3.5" />
                  v{currentVersion}
                </Button>
              )}
              {needsUpdate && (
                <Button onClick={() => fetchAndGenerateProfile()} size="sm">
                   <RefreshCcw className='mr-2 h-4 w-4'/>
                   Actualizar ahora
                </Button>
              )}
            </div>
        </div>
        
        <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-chart-5 via-chart-1 to-chart-2">Dashboard de Autoconocimiento</h1>
            <p className="text-muted-foreground mt-2">
                Un análisis integral generado por IA basado en tu historial. Esto no reemplaza un diagnóstico profesional.
            </p>
        </header>

        {/* Version History Panel */}
        {showVersionHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <History className="w-5 h-5 text-accent" />
                  Historial de Versiones
                </CardTitle>
                <CardDescription>
                  Cada generación de perfil se guarda como una versión.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Cargando historial...</p>
                ) : (
                  <div className="space-y-3">
                    {versions.map((v) => (
                      <div
                        key={v.version}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-colors",
                          v.version === currentVersion
                            ? "bg-primary/5 border-primary/20"
                            : "bg-background/50 border-border/30 hover:bg-accent/5"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={cn(
                            "font-mono text-sm font-semibold px-2 py-0.5 rounded",
                            v.version === currentVersion ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            v{v.version}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm truncate">
                              {v.chatMessagesAnalyzed} mensajes analizados
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {v.createdAt?.toDate ? v.createdAt.toDate().toLocaleDateString('es-ES', {
                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              }) : 'Fecha no disponible'}
                            </p>
                          </div>
                        </div>
                        {v.version === currentVersion && (
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">
                            Actual
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 md:inline-flex md:w-auto mb-6 bg-card/50">
            <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden md:inline">Resumen</span>
                <span className="md:hidden text-[10px]">Resumen</span>
            </TabsTrigger>
            {profile.evolutionSummary && (
              <TabsTrigger value="evolution" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden md:inline">Evolución</span>
                  <span className="md:hidden text-[10px]">Evolución</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="metrics" className="gap-2" data-tour-id="profile-metrics">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden md:inline">Métricas</span>
                <span className="md:hidden text-[10px]">Métricas</span>
            </TabsTrigger>
            <TabsTrigger value="deep-dive" className="gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden md:inline">Análisis Profundo</span>
                <span className="md:hidden text-[10px]">Análisis</span>
            </TabsTrigger>
             <TabsTrigger value="oracle" className="gap-2" data-tour-id="profile-oracle">
                <BookOpen className="h-4 w-4" />
                <span className="hidden md:inline">Oráculo</span>
                <span className="md:hidden text-[10px]">Oráculo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
              <Card className="bg-card/50 border-border/50" data-tour-id="profile-diagnosis">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="flex items-center gap-3 text-xl">
                        <BrainCircuit className="w-6 h-6 text-accent"/>
                        Diagnóstico Descriptivo
                    </CardTitle>
                    <TextSizeControl size={diagnosisTextSize} onSizeChange={setDiagnosisTextSize} />
                </CardHeader>
                <CardContent>
                    <ReactMarkdown className={cn(
                        "prose dark:prose-invert max-w-none text-foreground/80 leading-relaxed",
                        {
                            'text-sm': diagnosisTextSize === 'sm',
                            'text-base': diagnosisTextSize === 'base',
                            'text-lg': diagnosisTextSize === 'lg',
                        }
                    )}>{profile.diagnosis}</ReactMarkdown>
                </CardContent>
              </Card>

              { (profile.coreArchetype || profile.coreConflict) && (
                <div className="grid md:grid-cols-2 gap-6">
                    {profile.coreArchetype && (
                    <Card className="bg-card/50 border-border/50" data-tour-id="profile-archetype">
                      <CardHeader>
                        <CardTitle className='flex items-center gap-3'><UserCheck className="w-6 h-6 text-accent"/> Arquetipo: {profile.coreArchetype.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className='prose prose-sm dark:prose-invert max-w-none text-muted-foreground'>{profile.coreArchetype.description}</p>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-xs uppercase tracking-wider flex items-center gap-2"><Star className="w-4 h-4 text-green-400"/> Fortalezas</h4>
                            <p className="text-sm text-muted-foreground mt-1">{profile.coreArchetype.strengths}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs uppercase tracking-wider flex items-center gap-2"><Shield className="w-4 h-4 text-amber-400"/> Desafíos</h4>
                            <p className="text-sm text-muted-foreground mt-1">{profile.coreArchetype.challenges}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    )}
                    {profile.coreConflict && (
                     <Card className="bg-card/50 border-border/50">
                      <CardHeader>
                        <CardTitle className='flex items-center gap-3'><Target className="w-6 h-6 text-accent"/> Conflicto Nuclear</CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-center justify-center h-full">
                        <p className='text-lg font-medium text-center italic p-4 bg-background/50 rounded-lg'>"{profile.coreConflict}"</p>
                      </CardContent>
                    </Card>
                    )}
                </div>
              )}

              {profile.habitLoop && (
                 <Card className="bg-card/50 border-border/50" data-tour-id="profile-habit-loop">
                  <CardHeader>
                    <CardTitle className='flex items-center gap-3'><Repeat className="w-6 h-6 text-accent"/> El Bucle del Hábito</CardTitle>
                    <CardDescription>Un patrón recurrente en tu comportamiento. Identificarlo es el primer paso para poder cambiarlo.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="flex flex-col items-center overflow-hidden">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 mb-2">
                                <GitCommit className="w-6 h-6 -rotate-90" />
                            </div>
                            <h4 className="font-semibold">Disparador</h4>
                            <p className="text-sm text-muted-foreground px-2 break-words">{profile.habitLoop.trigger}</p>
                        </div>
                        <div className="flex flex-col items-center overflow-hidden">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
                                <BrainCircuit className="w-6 h-6" />
                            </div>
                            <h4 className="font-semibold">Pensamiento</h4>
                            <p className="text-sm text-muted-foreground px-2 break-words">{profile.habitLoop.thought}</p>
                        </div>
                        <div className="flex flex-col items-center overflow-hidden">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
                                <ShieldQuestion className="w-6 h-6" />
                            </div>
                            <h4 className="font-semibold">Acción</h4>
                            <p className="text-sm text-muted-foreground px-2 break-words">{profile.habitLoop.action}</p>
                        </div>
                        <div className="flex flex-col items-center overflow-hidden">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-2">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h4 className="font-semibold">Resultado</h4>
                            <p className="text-sm text-muted-foreground px-2 break-words">{profile.habitLoop.result}</p>
                        </div>
                    </div>
                    {profile.habitLoop.trigger && <BreakdownExerciseGenerator habitLoop={profile.habitLoop} />}
                  </CardContent>
                </Card>
              )}
          </TabsContent>

          {/* Evolution Tab */}
          {profile.evolutionSummary && (
            <TabsContent value="evolution" className="mt-6 space-y-6">
              <Card className="bg-gradient-to-br from-card/80 to-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <TrendingUp className="w-6 h-6 text-accent" />
                    Informe Evolutivo
                    {currentVersion && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">v{currentVersion}</span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Análisis comparativo con versiones anteriores — progreso, retroceso y cambios en cada dimensión de tu perfil.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReactMarkdown className="prose dark:prose-invert max-w-none text-foreground/80 leading-relaxed">
                    {profile.evolutionSummary}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="metrics" className="mt-6 space-y-6">
              {profile.emotionalJourney?.length > 0 && (
                  <Card className="bg-card/50 border-border/50">
                      <CardHeader>
                          <CardTitle className="flex items-center gap-3 text-xl">
                              <LineChart className="w-6 h-6 text-accent"/>
                              Evolución Emocional
                          </CardTitle>
                          <CardDescription>Tu línea de tiempo de sentimientos basada en las conversaciones.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          {isClient && <EmotionalChart data={profile.emotionalJourney} />}
                      </CardContent>
                  </Card>
              )}
              {profile.emotionalConstellation?.nodes?.length > 0 && isClient && (
                <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <BrainCircuit className="w-6 h-6 text-accent" />
                            Constelador Emocional
                        </CardTitle>
                        <CardDescription>
                            Una red de tus temas y emociones más recurrentes. El tamaño del círculo representa la importancia del tema. El color del enlace muestra el sentimiento de la conexión (verde para positivo, rojo para negativo).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 h-[400px]">
                        <EmotionalConstellation data={profile.emotionalConstellation} />
                    </CardContent>
                </Card>
              )}
          </TabsContent>
          
          <TabsContent value="deep-dive" className="mt-6">
             <Accordion type="multiple" className="w-full space-y-4">
                <AccordionItem value="item-1">
                    <Card className="bg-card/50 border-border/50">
                        <CardHeader className="flex flex-row justify-between items-center pr-6">
                             <CardTitle className="flex items-center gap-3 text-xl">
                                <UserCheck className="w-6 h-6 text-accent"/>
                                Caracterización de la Personalidad
                            </CardTitle>
                            <TextSizeControl size={personalityTextSize} onSizeChange={setPersonalityTextSize} />
                        </CardHeader>
                        <AccordionTrigger className="w-full text-left p-6 pt-0 text-sm text-primary hover:no-underline [&>svg]:ml-auto">
                           <span>Mostrar/Ocultar Análisis</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent className="pt-0">
                                <ReactMarkdown className={cn(
                                    "prose dark:prose-invert max-w-none text-foreground/80 leading-relaxed",
                                    {
                                        'text-sm': personalityTextSize === 'sm',
                                        'text-base': personalityTextSize === 'base',
                                        'text-lg': personalityTextSize === 'lg',
                                    }
                                )}>{profile.personality}</ReactMarkdown>
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                     <Card className="bg-card/50 border-border/50">
                        <CardHeader className="flex flex-row justify-between items-center pr-6">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <Sparkles className="w-6 h-6 text-accent"/>
                                Fortalezas Psicológicas
                            </CardTitle>
                            <TextSizeControl size={strengthsTextSize} onSizeChange={setStrengthsTextSize} />
                        </CardHeader>
                        <AccordionTrigger className="w-full text-left p-6 pt-0 text-sm text-primary hover:no-underline [&>svg]:ml-auto">
                           <span>Mostrar/Ocultar Análisis</span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent className="pt-0">
                                <ReactMarkdown className={cn(
                                     "prose dark:prose-invert max-w-none text-foreground/80 leading-relaxed",
                                    {
                                        'text-sm': strengthsTextSize === 'sm',
                                        'text-base': strengthsTextSize === 'base',
                                        'text-lg': strengthsTextSize === 'lg',
                                    }
                                )}>{profile.strengths}</ReactMarkdown>
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>

                <AccordionItem value="item-3">
                    <Card className="bg-card/50 border-border/50">
                        <AccordionTrigger className="w-full text-left p-6 hover:no-underline [&>svg]:ml-auto">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <Filter className="w-6 h-6 text-accent"/>
                                Sesgos Cognitivos Potenciales
                            </CardTitle>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent>
                            {profile.cognitiveBiases?.length > 0 ? (
                               <ul className="space-y-3">
                                {profile.cognitiveBiases.map((rec, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <ShieldCheck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1"/>
                                        <ReactMarkdown className="text-foreground/80 prose prose-sm dark:prose-invert max-w-none prose-p:m-0">{rec}</ReactMarkdown>
                                    </li>
                                ))}
                               </ul>
                               ) : (
                                <p className="text-muted-foreground text-sm">No se identificaron sesgos cognitivos significativos.</p>
                               )}
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                    <Card className="bg-card/50 border-border/50">
                        <AccordionTrigger className="w-full text-left p-6 hover:no-underline [&>svg]:ml-auto">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <ShieldQuestion className="w-6 h-6 text-accent"/>
                                Mecanismos de Defensa
                            </CardTitle>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent>
                              {profile.defenseMechanisms?.length > 0 ? (
                               <ul className="space-y-3">
                                {profile.defenseMechanisms.map((rec, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1"/>
                                        <ReactMarkdown className="text-foreground/80 prose prose-sm dark:prose-invert max-w-none prose-p:m-0">{rec}</ReactMarkdown>
                                    </li>
                                ))}
                               </ul>
                               ) : (
                                <p className="text-muted-foreground text-sm">No se identificaron mecanismos de defensa significativos.</p>
                               )}
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>

                <AccordionItem value="item-5">
                    <Card className="bg-card/50 border-border/50">
                        <AccordionTrigger className="w-full text-left p-6 hover:no-underline [&>svg]:ml-auto">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <ListChecks className="w-6 h-6 text-accent"/>
                                Recomendaciones
                            </CardTitle>
                        </AccordionTrigger>
                        <AccordionContent>
                            <CardContent>
                              {profile.recommendations?.length > 0 ? (
                               <ul className="space-y-3">
                                {profile.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-1"/>
                                        <ReactMarkdown className="text-foreground/80 prose prose-sm dark:prose-invert max-w-none prose-p:m-0">{rec}</ReactMarkdown>
                                    </li>
                                ))}
                               </ul>
                               ) : (
                                <p className="text-muted-foreground text-sm">No hay recomendaciones específicas en este momento.</p>
                               )}
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
            </Accordion>
          </TabsContent>
           <TabsContent value="oracle" className="mt-6">
                <ProfileCryptoAnalysis profile={profile} />
           </TabsContent>
        </Tabs>
    </div>
  );
}
    