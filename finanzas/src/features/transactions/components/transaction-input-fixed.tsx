"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Loader2, Sparkles, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { chatRegistroFinanciero } from '@/ai/flows/chat-registro-financiero';
import { crearEventoCalendario } from '@/ai/flows/chat-creacion-evento-calendario';
import { scanReceipt } from '@/ai/flows/scan-receipt-flow';
import { Transaction } from '@/hooks/use-finance-store';

interface TransactionInputFixedProps {
  onAdd: (data: any) => void;
  onEventAdd: (data: any) => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  transactions: Transaction[];
}

export function TransactionInputFixed({ onAdd, onEventAdd, onUpdate, onDelete, transactions }: TransactionInputFixedProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        processAICommand(transcript);
        setIsRecording(false);
      };
      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  const showFeedback = (message: string) => {
    setFeedback({ message, visible: true });
    setTimeout(() => setFeedback(prev => ({ ...prev, visible: false })), 3500);
  };

  const processAICommand = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);
    setInput('');
    try {
      const textLower = text.toLowerCase();
      const localDate = new Date().toLocaleDateString('sv'); // YYYY-MM-DD local
      
      const hasMoneyMarker = /\$|\d+(k|mil)?/i.test(textLower);
      const isFinancialAction = /eché|pagué|compré|comprar|pagar|gasto|ingreso|gané|recibí|costó|vale|invertí|ahorré/i.test(textLower);
      const isExplicitCalendar = /agendar|programar|recordatorio|recuérdame|recordarme|ponme un recordatorio|tengo que/i.test(textLower);
      
      // Lógica de despacho expandida para detectar compromisos como "trabajar", "empezar", "clase", etc.
      const isCalendarIntent = isExplicitCalendar || (!hasMoneyMarker && !isFinancialAction && /reunión|cita|clase|médico|dentista|turno|entrevista|trabajar|empezar|entrar|salir|vuelo|viaje|consulta|mañana/i.test(textLower));
      
      if (isCalendarIntent) {
        const result = await crearEventoCalendario({ text });
        onEventAdd(result);
        showFeedback(`Agenda: ${result.title}`);
      } else {
        const categories = Array.from(new Set(transactions.map(t => t.category))).join(', ');
        const recentHistory = transactions.slice(0, 5).map(t => `${t.description} ($${t.amount})`).join('; ');
        const context = `Categorías existentes: ${categories}. Últimas transacciones: ${recentHistory}.`;

        const result = await chatRegistroFinanciero({ text, context, currentDate: localDate });
        
        if (result.items && result.items.length > 0) {
          let count = 0;
          for (const item of result.items) {
            if (item.intent === 'crear') {
              onAdd(item);
              count++;
            } else {
              const ref = (item.targetReference || "").toLowerCase().trim();
              const target = transactions.find(t => {
                if (!ref) return false;
                const desc = t.description.toLowerCase();
                const amount = t.amount.toString();
                return desc.includes(ref) || amount === ref || ref.includes(desc);
              });
              
              if (item.intent === 'modificar' && target) {
                onUpdate(target.id, item);
                count++;
              } else if (item.intent === 'eliminar' && target) {
                onDelete(target.id);
                count++;
              }
            }
          }
          showFeedback(`Procesado: ${count} movimientos registrados`);
        } else {
          showFeedback('No detecté movimientos financieros');
        }
      }
    } catch (e) {
      showFeedback('Error en procesamiento inteligente');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isProcessing) return;

    setIsProcessing(true);
    showFeedback('Analizando Recibo...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const result = await scanReceipt({ photoDataUri: base64 });
        
        result.items.forEach(item => {
          onAdd({
            description: item.description,
            amount: item.amount,
            category: item.category,
            type: 'gasto'
          });
        });
        
        showFeedback(`Escaneo Listo: ${result.items.length} productos registrados`);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      showFeedback('Error al escanear recibo');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) recognitionRef.current?.stop();
    else { setIsRecording(true); recognitionRef.current?.start(); }
  };

  return (
    <>
      <div className={cn("fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[150] transition-all duration-500 pointer-events-none", feedback.visible ? "opacity-100 scale-100" : "opacity-0 scale-90")}>
        <div className="bg-primary/90 backdrop-blur-md text-white px-6 py-4 rounded-none shadow-2xl flex items-center gap-3 border border-white/20">
          <Sparkles className="w-5 h-5 text-accent animate-pulse" />
          <p className="text-sm font-bold uppercase tracking-widest">{feedback.message}</p>
        </div>
      </div>

      <div className="shrink-0 p-4 border-t bg-white absolute bottom-0 left-0 right-0 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3 items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
          />
          
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="h-14 w-14 rounded-none shrink-0 bg-accent shadow-lg active:scale-95 transition-all"
            disabled={isProcessing}
          >
            <Camera className="w-6 h-6 text-white" />
          </Button>

          <Button 
            onClick={toggleRecording} 
            className={cn("h-14 w-14 rounded-none shrink-0", isRecording ? "bg-destructive animate-pulse" : "bg-primary shadow-lg active:scale-95 transition-all")} 
            disabled={isProcessing}
          >
            {isRecording ? <div className="w-4 h-4 bg-white rounded-none" /> : <Mic className="w-6 h-6 text-white" />}
          </Button>

          <div className="flex-1 relative">
            <Input 
              placeholder={isRecording ? "Escuchando..." : "Ej: Compré pan 2k y gané 50k..."} 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && processAICommand(input)} 
              disabled={isProcessing} 
              className="rounded-none h-14 pr-14 bg-muted/10 border-none font-bold text-xs" 
            />
            <Button onClick={() => processAICommand(input)} disabled={isProcessing || !input.trim()} variant="ghost" size="icon" className="absolute right-1 top-1 h-12 w-12 text-accent">
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
