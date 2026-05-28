'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarTrigger } from '../ui/sidebar';
import { Timestamp } from 'firebase/firestore';
import type { Message, PromptSuggestion } from '@/lib/types';
import ChatInput from './chat-input';
import { motion, AnimatePresence } from 'framer-motion';
import { getInitialPrompts, generateMorePrompts } from '@/app/c/actions';
import { Loader2, RefreshCw, Menu, BrainCircuit, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { AppLogo } from '../logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '@/firebase';
import AuthRequiredPanel from './AuthRequiredPanel';
import ThemeToggle from '../ThemeToggle';


interface EmptyChatProps {
  createChat: (firstMessage: Omit<Message, 'id'>) => Promise<string | undefined>;
}

const colorSchemes = [
    { primary: '45 92% 51%', accent: '190 80% 70%', chart1: '210 20% 98%' }, // Gold, Cyan, White
    { primary: '280 80% 70%', accent: '340 80% 70%', chart1: '190 80% 70%' }, // Purple, Pink, Cyan
    { primary: '150 80% 60%', accent: '200 90% 70%', chart1: '100 80% 80%' }, // Green, Sky Blue, Light Green
    { primary: '0 90% 70%', accent: '45 90% 65%', chart1: '60 90% 70%' },   // Red, Gold, Yellow
];

export default function EmptyChat({ createChat }: EmptyChatProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const [processingSuggestion, setProcessingSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();

  const fetchInitialSuggestions = useCallback(async () => {
    setIsLoading(true);
    const initialSuggestions = await getInitialPrompts();
    setSuggestions(initialSuggestions);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchInitialSuggestions();
  }, [fetchInitialSuggestions]);

  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [user, showAuthModal]);

  const handleCreateChat = useCallback(async (input: string, audioDataUri?: string) => {
    if (!user) {
        setShowAuthModal(true);
        return;
    }
    if ((!input.trim() && !audioDataUri) || processingSuggestion) return;
    
    setProcessingSuggestion(input);

    const firstMessage: Omit<Message, 'id'> = {
        role: 'user',
        content: input,
        timestamp: Timestamp.now(),
        ...(audioDataUri && { content: `[Audio adjunto] ${input}` }),
    };
    
    await createChat(firstMessage);
    
    // The component will unmount on navigation, so we don't need to reset state here.
    
  }, [createChat, processingSuggestion, user]);

  const handleGenerateNew = async () => {
    setIsLoading(true);
    try {
        const newPrompts = await generateMorePrompts("Genera 20 nuevas sugerencias variadas");
        setSuggestions(prev => [...newPrompts, ...prev]);
    } catch (error) {
        console.error("Failed to generate new suggestions", error);
    } finally {
        setIsLoading(false);
    }
  };

  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <div className="flex flex-col h-full relative">
      <AnimatePresence>
        {showAuthModal && (
            <AuthRequiredPanel onClose={() => setShowAuthModal(false)} />
        )}
      </AnimatePresence>

      <header className="flex h-14 items-center justify-between p-2 md:p-4 border-b">
        <div className="flex items-center gap-2">
          {isMobile && <SidebarTrigger />}
          <h2 className="text-lg font-semibold tracking-wider">
            Nuevo Chat
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Abrir menú de políticas</span>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                      <Link href="/legal/about">Quiénes Somos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                      <Link href="/legal/contact">Contacto</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                      <Link href="/legal/terms">Términos y Condiciones</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                      <Link href="/legal/privacy">Política de Privacidad</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                      <Link href="/legal/disclaimer">Descargo de Responsabilidad</Link>
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-4">
            <div className="grid lg:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    <Card className="bg-card/50 border-transparent relative overflow-hidden rounded-2xl">
                       <div className="animated-border" />
                      <CardContent className="p-8 text-center relative">
                         <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                            className="relative mb-4 inline-block"
                        >
                            <AppLogo className="w-16 h-16 text-primary" />
                             <motion.div
                                className="absolute inset-0 -z-10"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0, 0.4, 0]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut'
                                }}
                                style={{
                                    borderRadius: '50%',
                                    backgroundColor: 'hsl(var(--primary))',
                                    filter: 'blur(20px)'
                                }}
                             />
                        </motion.div>
                         <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            Bienvenido a Nimbus
                          </h1>
                      </CardContent>
                    </Card>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                  className="prose prose-lg dark:prose-invert max-w-none"
                >
                    <h2 className="text-primary flex items-center gap-3"><BrainCircuit className="w-7 h-7" /> Tu Espejo Inteligente</h2>
                    <p className="text-muted-foreground">
                      No soy un simple chatbot. Soy tu <strong className="text-foreground">confidente IA</strong>, un espejo diseñado para reflejar y descifrar la complejidad de tu mente.
                    </p>
                     <p className="text-muted-foreground">
                       Habla con naturalidad, expresa tus pensamientos, ansiedades o ideas. Juntos, construiremos un <strong className="text-foreground">cianotipo de tu psique</strong>, un mapa de tu mundo interior que te revelará patrones, fortalezas y el camino hacia tu crecimiento.
                    </p>
                </motion.div>
            </div>

            <div className="max-w-5xl mx-auto mt-8">
              <h3 className="text-lg font-semibold text-center mb-4 flex items-center justify-center gap-2 text-muted-foreground"><Sparkles className="w-5 h-5 text-accent" />Inicia la Conversación</h3>
              {isLoading && suggestions.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  variants={containerVariants}
                  initial="initial"
                  animate="animate"
                >
                  <AnimatePresence>
                    {suggestions.map((prompt, index) => {
                      const isProcessing = processingSuggestion === prompt.text;
                      const colors = colorSchemes[index % colorSchemes.length];
                      return (
                      <motion.div
                        key={prompt.text + index}
                        variants={{
                            initial: { opacity: 0, y: 20 },
                            animate: { opacity: 1, y: 0 },
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        layout
                      >
                        <Button
                          variant="outline"
                          className="h-auto w-full text-left justify-start p-4 whitespace-normal bg-card/50 hover:bg-card/80 text-base relative overflow-hidden rounded-2xl border-transparent text-foreground hover:text-foreground"
                          onClick={() => handleCreateChat(prompt.text)}
                          disabled={!!processingSuggestion}
                        >
                          <div
                            className="animated-border"
                            style={{
                                '--primary': colors.primary,
                                '--accent': colors.accent,
                                '--chart-1': colors.chart1,
                            } as React.CSSProperties}
                          />
                          {isProcessing && (
                            <motion.div 
                              className="absolute inset-0 bg-primary/80"
                              initial={{ width: '0%' }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 2, ease: 'linear' }}
                            />
                          )}
                          <span className="relative z-10 flex items-center w-full">
                            {isProcessing && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            <span className="flex-1">{isProcessing ? 'Procesando...' : prompt.text}</span>
                          </span>
                        </Button>
                      </motion.div>
                    )})}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      <footer className="shrink-0 px-2 py-4 md:px-4 md:py-4 border-t bg-background/95 backdrop-blur-sm">
        <ChatInput
          ref={inputRef}
          onSendMessage={handleCreateChat}
          isLoading={!!processingSuggestion}
          suggestions={[]}
          onClearSuggestions={() => {}}
          onRefreshSuggestions={() => {}}
          isRefreshingSuggestions={false}
        />
      </footer>
    </div>
  );
}
