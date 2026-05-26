"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { chatRegistroFinanciero } from '@/ai/flows/chat-registro-financiero';
import { crearEventoCalendario } from '@/ai/flows/chat-creacion-evento-calendario';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const textLower = input.toLowerCase();
      const localDate = new Date().toLocaleDateString('sv'); // YYYY-MM-DD local
      
      const hasMoneyMarker = /\$|\d+(k|mil)?/i.test(textLower);
      const isFinancialAction = /eché|pagué|compré|comprar|pagar|gasto|ingreso|gané|recibí|costó|vale|invertí|ahorré/i.test(textLower);
      const isExplicitCalendar = /agendar|programar|recordatorio|recuérdame|recordarme|ponme un recordatorio|tengo que/i.test(textLower);
      
      const isCalendarIntent = isExplicitCalendar || (!hasMoneyMarker && !isFinancialAction && /reunión|cita|clase|médico|dentista|turno|entrevista|trabajar|empezar|entrar|salir|vuelo|viaje|consulta|mañana/i.test(textLower));
      
      let response = '';
      let specialist = 'Finanzas';

      if (isCalendarIntent) {
        specialist = 'Agenda';
        const result = await crearEventoCalendario({ text: input });
        onEventAdded(result);
        response = `He agendado "${result.title}" para el ${result.date}.`;
      } else {
        const categories = Array.from(new Set(transactions.map(t => t.category))).join(', ');
        const recentHistory = transactions.slice(0, 5).map(t => `${t.description} ($${t.amount})`).join('; ');
        const context = `Categorías existentes: ${categories}. Últimas transacciones: ${recentHistory}.`;
        
        const result = await chatRegistroFinanciero({ text: input, context, currentDate: localDate });
        
        if (result.items && result.items.length > 0) {
          let processedCount = 0;
          for (const item of result.items) {
            if (item.intent === 'crear') {
              onTransactionAdded(item);
              processedCount++;
            } else {
              const ref = (item.targetReference || "").toLowerCase().trim();
              const target = transactions.find(t => {
                if (!ref) return false;
                const desc = t.description.toLowerCase();
                const amount = t.amount.toString();
                return desc.includes(ref) || amount === ref || ref.includes(desc);
              });
              
              if (item.intent === 'modificar' && target) {
                onTransactionUpdated(target.id, item);
                processedCount++;
              } else if (item.intent === 'eliminar' && target) {
                onTransactionDeleted(target.id);
                processedCount++;
              }
            }
          }
          response = processedCount > 1 ? `He procesado ${processedCount} movimientos correctamente.` : `Operación realizada con éxito.`;
        } else {
          response = `No pude detectar una instrucción clara de registro financiero.`;
        }
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'Entendido, procesado correctamente.',
        specialist
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Hubo un inconveniente al procesar tu solicitud. Prueba siendo más específico.',
        specialist: 'Sistema'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[450px] sm:h-[500px] border-none shadow-xl bg-white overflow-hidden rounded-2xl w-full">
      <div className="p-3 border-b bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary rounded-full">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-primary">IA Multiespecialista</h3>
            <p className="text-[9px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-2 h-2 text-accent" /> Sistema Cognitivo Activo
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
              <div className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-xs shadow-sm",
                m.role === 'user' 
                  ? "bg-primary text-white rounded-tr-none" 
                  : "bg-muted/30 border rounded-tl-none"
              )}>
                {m.role === 'assistant' && (
                  <span className="text-[8px] font-bold uppercase tracking-wider text-accent block mb-0.5">
                    {m.specialist}
                  </span>
                )}
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-muted/30 border rounded-xl rounded-tl-none px-3 py-1.5 shadow-sm">
                <Loader2 className="w-3 h-3 animate-spin text-accent" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-2 border-t bg-white">
        <div className="flex gap-2">
          <Input 
            placeholder="Ej: Eché 10k de gasolina..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="rounded-lg border-primary/10 text-xs h-9"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="h-9 w-9 rounded-lg bg-accent">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
