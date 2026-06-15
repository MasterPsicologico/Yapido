"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, Loader2, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatRegistroFinanciero } from '@/ai/flows/chat-registro-financiero';
import { crearEventoCalendario } from '@/ai/flows/chat-creacion-evento-calendario';
import { cn } from '@/lib/utils';
import { Transaction } from '@/hooks/use-finance-store';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  specialist?: string;
};

interface ChatInterfaceProps {
  onTransactionAdded: (data: any) => void;
  onTransactionUpdated: (id: string, data: any) => void;
  onTransactionDeleted: (id: string) => void;
  onEventAdded: (data: any) => void;
  transactions: Transaction[];
}

const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: (isUser: boolean) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

export function ChatInterface({
  onTransactionAdded,
  onTransactionUpdated,
  onTransactionDeleted,
  onEventAdded,
  transactions
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente inteligente. Puedo registrar gastos, corregir valores o agendar eventos. ¿En qué te ayudo?',
      specialist: 'Coordinador'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        (scrollContainer as HTMLElement).scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const text = input;
    setInput('');
    setIsLoading(true);

    try {
      const lowerText = text.toLowerCase();
      const isCalendar = /(agendar|recordar|recordatorio|reunión|cita|cumple)/.test(lowerText);

      if (isCalendar) {
        const result = await crearEventoCalendario({ text, CURRENT_DATE: new Date().toISOString().split('T')[0] });
        onEventAdded(result);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Agendado: ${result.title}`,
          specialist: 'Calendario'
        }]);
      } else {
        const categories = Array.from(new Set(transactions.map(t => t.category))).join(', ');
        const recentHistory = transactions.slice(0, 5).map(t => `${t.description} ($${t.amount})`).join('; ');
        const context = `Categorías existentes: ${categories}. Últimas transacciones: ${recentHistory}.`;

        const result = await chatRegistroFinanciero({ text, context, currentDate: new Date().toISOString().split('T')[0] });

        if (result.items && result.items.length > 0) {
          let count = 0;
          for (const item of result.items) {
            if (item.intent === 'crear') {
              onTransactionAdded(item);
              count++;
            } else {
              const ref = (item.targetReference || "").toLowerCase().trim();
              const target = transactions.find(t =>
                t.description.toLowerCase().includes(ref) ||
                t.amount.toString() === ref
              );
              if (item.intent === 'modificar' && target) {
                onTransactionUpdated(target.id, item);
                count++;
              } else if (item.intent === 'eliminar' && target) {
                onTransactionDeleted(target.id);
                count++;
              }
            }
          }
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Procesado: ${count} movimientos`,
            specialist: 'Finanzas'
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'No detecté transacciones',
            specialist: 'Finanzas'
          }]);
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'No pude procesar la instrucción',
        specialist: 'Error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div
                key={msg.id}
                custom={isUser}
                variants={messageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                layout
                className={cn(
                  "flex gap-3 items-start",
                  isUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: isUser ? -5 : 5 }}
                  className={cn(
                    "shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-glow",
                    isUser
                      ? "bg-gradient-to-br from-accent to-primary"
                      : "bg-gradient-to-br from-primary to-accent"
                  )}
                >
                  {isUser ? (
                    <UserIcon className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </motion.div>
                <motion.div
                  layout
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                    isUser
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "glass rounded-tl-sm"
                  )}
                >
                  {msg.specialist && !isUser && (
                    <p className="text-[9px] font-mono uppercase tracking-widest text-accent mb-1">
                      {msg.specialist}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </motion.div>
              </motion.div>
            );
          })}
          {isLoading && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 items-start"
            >
              <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-accent"
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 p-4 border-t border-border/40 glass-strong"
      >
        <div className="flex gap-2 items-end">
          <Input
            placeholder="Ej: Compré pan 2k y gané 50k..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl bg-background/50 border-border/40 font-medium text-sm focus-visible:ring-2 focus-visible:ring-accent/50"
          />
          <motion.button
            type="submit"
            disabled={isLoading || !input.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !isLoading
                ? "bg-gradient-to-br from-primary to-accent text-white shadow-glow"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
