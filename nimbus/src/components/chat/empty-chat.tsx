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
import { useAuth } from '@/firebase';
import AuthRequiredPanel from './AuthRequiredPanel';
import ThemeToggle from '../ThemeToggle';


interface EmptyChatProps {
  createChat: (firstMessage: Omit<Message, 'id'>) => Promise<string | undefined>;
}

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
    <div className="brutal-page flex flex-col h-full relative">
      <AnimatePresence>
        {showAuthModal && (
            <AuthRequiredPanel onClose={() => setShowAuthModal(false)} />
        )}
      </AnimatePresence>

      <header className="brutal-header flex h-14 items-center justify-between p-2 md:p-4 border-b border-[hsl(220,15%,18%)]">
        <div className="flex items-center gap-2">
          {isMobile && <SidebarTrigger />}
          <h2 className="text-lg font-bold tracking-[0.2em] uppercase text-[hsl(220,10%,90%)]">
            Nuevo Chat
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[hsl(220,10%,60%)] hover:text-[hsl(220,10%,90%)] hover:bg-[hsl(220,15%,15%)]">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Abrir menú de políticas</span>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[hsl(220,15%,12%)] border-[hsl(220,15%,18%)]">
                  <DropdownMenuItem asChild>
                      <Link href="/legal/about" className="text-[hsl(220,10%,80%)] hover:text-[hsl(220,10%,95%)] hover:bg-[hsl(220,15%,18%]">Quiénes Somos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                      <Link href="/legal/contact" className="text-[hsl(220,10%,80%)] hover:text-[hsl(220,10%,95%)] hover:bg-[hsl(220,15%,18%]">Contacto</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                      <Link href="/legal/terms" className="text-[hsl(220,10%,80%)] hover:text-[hsl(220,10%,95%)] hover:bg-[hsl(220,15%,18%]">Términos y Condiciones</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                      <Link href="/legal/privacy" className="text-[hsl(220,10%,80%)] hover:text-[hsl(220,10%,95%)] hover:bg-[hsl(220,15%,18%]">Política de Privacidad</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                      <Link href="/legal/disclaimer" className="text-[hsl(220,10%,80%)] hover:text-[hsl(220,10%,95%)] hover:bg-[hsl(220,15%,18%)]">Descargo de Responsabilidad</Link>
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 brutal-scroll">
          <div className="p-4 relative z-[1]">
            <div className="grid lg:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    <div className="brutal-welcome p-8 text-center relative">
                       <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                          className="relative mb-4 inline-block"
                      >
                          <AppLogo className="w-16 h-16 text-[#22d3ee]" />
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
                                  backgroundColor: 'hsl(190, 80%, 50%)',
                                  filter: 'blur(20px)'
                              }}
                           />
                      </motion.div>
                       <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(220,10%,95%)]">
                          Bienvenido a Nimbus
                        </h1>
                    </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                >
                    <div className="brutal-section">
                        <h2><BrainCircuit className="w-6 h-6 text-[#22d3ee]" /> Tu Espejo Inteligente</h2>
                        <p>
                          No soy un simple chatbot. Soy tu <strong>confidente IA</strong>, un espejo diseñado para reflejar y descifrar la complejidad de tu mente.
                        </p>
                         <p style={{ marginTop: '1rem' }}>
                          Habla con naturalidad, expresa tus pensamientos, ansiedades o ideas. Juntos, construiremos un <strong>cianotipo de tu psique</strong>, un mapa de tu mundo interior que te revelará patrones, fortalezas y el camino hacia tu crecimiento.
                        </p>
                    </div>
                </motion.div>
            </div>

            <div className="max-w-5xl mx-auto mt-12">
              <div className="brutal-label"><Sparkles className="w-4 h-4 text-[#22d3ee]" />Inicia la Conversación</div>
              {isLoading && suggestions.length === 0 ? (
                <div className="flex items-center justify-center h-full py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#22d3ee]" />
                </div>
              ) : (
                <motion.div
                  className="brutal-suggestion-grid"
                  variants={containerVariants}
                  initial="initial"
                  animate="animate"
                >
                  <AnimatePresence>
                    {suggestions.map((prompt, index) => {
                      const isProcessing = processingSuggestion === prompt.text;
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
                        <button
                          className="brutal-suggestion-btn"
                          onClick={() => handleCreateChat(prompt.text)}
                          disabled={!!processingSuggestion}
                        >
                          {isProcessing && (
                            <motion.div
                              className="absolute inset-0 opacity-80"
                              initial={{ width: '0%' }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 2, ease: 'linear' }}
                              style={{ background: `hsl(var(--btn-accent-hue, 190), 80%, 50% / 0.2)` }}
                            />
                          )}
                          <span>
                            {isProcessing && (
                              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                            )}
                            <span className="flex-1">{isProcessing ? 'Procesando...' : prompt.text}</span>
                          </span>
                        </button>
                      </motion.div>
                    )})}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      <footer className="shrink-0 px-2 py-4 md:px-4 md:py-4 border-t border-[hsl(220,15%,18%)] bg-[hsl(220,20%,6%)]">
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
