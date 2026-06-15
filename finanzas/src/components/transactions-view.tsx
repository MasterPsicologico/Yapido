"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CardTitle } from '@/components/ui/card';
import { Transaction, Currency } from '@/hooks/use-finance-store';
import { 
  Trash2, 
  Edit3, 
  ShoppingCart, 
  Coffee, 
  Bus, 
  Home, 
  Activity, 
  Package, 
  Landmark, 
  Clock, 
  Calendar, 
  Mic, 
  Send, 
  Loader2,
  Sparkles,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  Fingerprint
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { chatRegistroFinanciero } from '@/ai/flows/chat-registro-financiero';
import { crearEventoCalendario } from '@/ai/flows/chat-creacion-evento-calendario';

const categoryIcons: Record<string, React.ReactNode> = {
  supermercado: <ShoppingCart className="w-4 h-4" />,
  comida: <Coffee className="w-4 h-4" />,
  transporte: <Bus className="w-4 h-4" />,
  vivienda: <Home className="w-4 h-4" />,
  salud: <Activity className="w-4 h-4" />,
  salario: <Landmark className="w-4 h-4" />,
  otros: <Package className="w-4 h-4" />,
};

interface TransactionsViewProps {
  transactions: Transaction[];
  currency: Currency;
  onDelete: (id: string) => void;
  onEdit: (id: string, data: Partial<Transaction>) => void;
  onAdd: (data: any) => void;
  onEventAdd: (data: any) => void;
}

export function TransactionsView({ transactions, currency, onDelete, onEdit, onAdd, onEventAdd }: TransactionsViewProps) {
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [viewingTransactionId, setViewingTransactionId] = useState<string | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  
  const recognitionRef = useRef<any>(null);

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
    setTimeout(() => setFeedback(prev => ({ ...prev, visible: false })), 2500);
  };

  const processAICommand = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);
    setInput('');
    try {
      const textLower = text.toLowerCase();
      
      // Lógica de despacho inteligente refinada para evitar confusiones con indicadores temporales
      const hasMoneyMarker = /\$|\d+(k|mil)?/i.test(textLower);
      const isFinancialAction = /eché|pagué|compré|comprar|pagar|gasto|ingreso|gané|recibí|costó|vale|invertí|ahorré/i.test(textLower);
      const isExplicitCalendar = /agendar|programar|recordatorio|recuérdame|recordarme|ponme un recordatorio/i.test(textLower);
      
      const isCalendarIntent = isExplicitCalendar || (!hasMoneyMarker && !isFinancialAction && /reunión|cita|clase|médico|dentista|turno|entrevista/i.test(textLower));

      if (isCalendarIntent) {
        const result = await crearEventoCalendario({ text });
        onEventAdd(result);
        showFeedback(`Agenda: ${result.title}`);
      } else {
        const categories = Array.from(new Set(transactions.map(t => t.category))).join(', ');
        const recentHistory = transactions.slice(0, 5).map(t => `${t.description} ($${t.amount})`).join('; ');
        const context = `Categorías existentes: ${categories}. Últimas transacciones: ${recentHistory}.`;
        
        const result = await chatRegistroFinanciero({ text, context });
        
        if (result.items && result.items.length > 0) {
          let count = 0;
          for (const item of result.items) {
            if (item.intent === 'crear') {
              onAdd(item);
              count++;
            } else {
              const ref = (item.targetReference || "").toLowerCase().trim();
              const target = transactions.find(t => t.description.toLowerCase().includes(ref) || t.amount.toString() === ref);
              if (item.intent === 'modificar' && target) {
                onEdit(target.id, item);
                count++;
              } else if (item.intent === 'eliminar' && target) {
                onDelete(target.id);
                count++;
              }
            }
          }
          showFeedback(`Procesado: ${count} movimientos`);
        } else {
          showFeedback('No detecté transacciones');
        }
      }
    } catch (e) { showFeedback('No entendí la instrucción'); }
    finally { setIsProcessing(false); }
  };

  const toggleRecording = () => {
    if (isRecording) recognitionRef.current?.stop();
    else { setIsRecording(true); recognitionRef.current?.start(); }
  };

  const viewingTransaction = transactions.find(t => t.id === viewingTransactionId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <div className={cn("fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[150] transition-all duration-500 pointer-events-none", feedback.visible ? "opacity-100 scale-100" : "opacity-0 scale-90")}>
        <div className="bg-primary/90 backdrop-blur-md text-white px-6 py-4 rounded-none shadow-2xl flex items-center gap-3 border border-white/20">
          <Sparkles className="w-5 h-5 text-accent animate-pulse" />
          <p className="text-sm font-bold uppercase tracking-widest">{feedback.message}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full overflow-hidden bg-white">
        <div className="shrink-0 bg-primary text-white p-4 flex items-center justify-between">
          <CardTitle className="text-base font-black uppercase tracking-widest">Historial Financiero</CardTitle>
          <Badge variant="outline" className="border-accent/30 text-accent text-[9px] font-black">{transactions.length} MOVIMIENTOS</Badge>
        </div>
        
        <div className="flex-1 overflow-y-auto pb-24">
          <Table className="w-full table-fixed">
            <TableHeader className="bg-muted/50 sticky top-0 z-20">
              <TableRow className="border-none">
                <TableHead className="w-[80px] text-[9px] font-black uppercase text-primary">Fecha</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-primary">Concepto</TableHead>
                <TableHead className="w-[100px] text-right text-[9px] font-black uppercase text-primary">Monto</TableHead>
                <TableHead className="w-[80px] text-center text-[9px] font-black uppercase text-primary">⚙️</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow className="border-none">
                  <TableCell colSpan={4} className="h-64 text-center text-muted-foreground text-[10px] font-bold uppercase italic opacity-40">Usa el micrófono para registrar tu primer gasto.</TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow 
                    key={t.id} 
                    className="hover:bg-primary/5 group border-b border-muted/20 cursor-pointer"
                    onClick={() => setViewingTransactionId(t.id)}
                  >
                    <TableCell className="px-4">
                      <div className="flex flex-col text-[9px] font-black text-primary">
                        {new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                        <span className="text-[8px] opacity-40 uppercase">{new Date(t.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 truncate">
                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-[11px] text-primary truncate uppercase">{t.description}</span>
                        <span className="text-[8px] text-accent font-black uppercase">{t.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-4">
                      <div className={cn("font-black text-[11px]", t.type === 'ingreso' ? "text-green-600" : "text-destructive")}>
                        {t.type === 'ingreso' ? '+' : '-'}{currency.symbol}{t.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-primary hover:bg-primary/10" 
                          onClick={(e) => { e.stopPropagation(); setEditingTransactionId(t.id); setEditForm({...t}); }}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:bg-destructive/10" 
                          onClick={(e) => { e.stopPropagation(); setDeletingTransactionId(t.id); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="shrink-0 p-4 border-t bg-white absolute bottom-0 left-0 right-0 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3 items-center">
            <Button onClick={toggleRecording} className={cn("h-14 w-14 rounded-none shrink-0", isRecording ? "bg-destructive animate-pulse" : "bg-primary shadow-lg active:scale-95 transition-all")} disabled={isProcessing}>
              {isRecording ? <div className="w-4 h-4 bg-white rounded-none" /> : <Mic className="w-6 h-6 text-white" />}
            </Button>
            <div className="flex-1 relative">
              <Input 
                placeholder={isRecording ? "Escuchando voz..." : "Ej: Eché 10k de gasolina ayer..."} 
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
      </div>

      {viewingTransaction && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300 rounded-none overflow-hidden">
          <div className="bg-[#293462] text-white p-6 pt-10 shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-md">
                  <Fingerprint className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50">Análisis Maestro</h2>
                  <p className="text-[9px] font-bold text-accent tracking-wider">REF: {viewingTransaction.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingTransactionId(null)}
                className="p-2 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            
            <div className="mt-4">
              <p className="text-[9px] font-black uppercase text-white/40 mb-1">Monto de Operación</p>
              <div className="flex items-baseline gap-2 overflow-hidden">
                <span className={cn(
                  "text-5xl font-black tracking-tighter leading-none truncate",
                  viewingTransaction.type === 'ingreso' ? "text-green-400" : "text-red-400"
                )}>
                  {viewingTransaction.type === 'ingreso' ? '+' : '-'}{currency.symbol}{viewingTransaction.amount.toLocaleString()}
                </span>
                <span className="text-white/20 font-black text-sm uppercase tracking-widest flex-shrink-0">{currency.code}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-white pb-24">
            <div className="bg-primary/5 p-6 border-l-[4px] border-[#293462] rounded-none">
              <p className="text-[9px] font-black text-primary/40 uppercase mb-1">Concepto Registrado</p>
              <h3 className="text-xl font-black text-[#293462] uppercase leading-snug break-words">
                {viewingTransaction.description}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/10 p-4 border border-muted/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="text-primary">{categoryIcons[viewingTransaction.category] || <Package className="w-3.5 h-3.5" />}</div>
                  <span className="text-[8px] font-black text-muted-foreground uppercase">Categoría</span>
                </div>
                <p className="text-[11px] font-black text-primary uppercase truncate">{viewingTransaction.category}</p>
              </div>

              <div className="bg-muted/10 p-4 border border-muted/20">
                <div className="flex items-center gap-2 mb-1.5">
                  {viewingTransaction.type === 'ingreso' ? <ArrowUpRight className="w-3.5 h-3.5 text-green-500" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-red-500" />}
                  <span className="text-[8px] font-black text-muted-foreground uppercase">Naturaleza</span>
                </div>
                <p className="text-[11px] font-black text-primary uppercase">{viewingTransaction.type}</p>
              </div>

              <div className="bg-muted/10 p-4 border border-muted/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[8px] font-black text-muted-foreground uppercase">Fecha</span>
                </div>
                <p className="text-[10px] font-black text-primary leading-tight uppercase">
                  {new Date(viewingTransaction.date).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="bg-muted/10 p-4 border border-muted/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[8px] font-black text-muted-foreground uppercase">Tiempo</span>
                </div>
                <p className="text-[10px] font-black text-primary">
                  {new Date(viewingTransaction.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="bg-accent/5 p-5 border border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-accent" />
                <span className="text-[9px] font-black text-accent uppercase">Análisis de Volumen</span>
              </div>
              <p className="text-[10px] text-primary/80 font-semibold leading-relaxed">
                Este movimiento representó un impacto del <span className="text-primary font-black">{((viewingTransaction.amount / 1000000) * 100).toFixed(2)}%</span> sobre el flujo mensual proyectado.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/5 border border-muted/20">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Canal de Auditoría</span>
                <span className="text-[10px] font-black text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-accent" /> IA Cognitiva Activa
                </span>
              </div>
              <Badge variant="outline" className="rounded-none border-primary/20 text-primary font-black uppercase text-[8px] py-0.5 h-5">Verificado</Badge>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <Button 
                className="w-full h-14 rounded-none bg-primary text-white font-black uppercase text-[10px] tracking-[0.1em] shadow-lg active:scale-95 transition-all"
                onClick={() => {
                  setEditingTransactionId(viewingTransaction.id);
                  setEditForm({...viewingTransaction});
                  setViewingTransactionId(null);
                }}
              >
                <Edit3 className="w-4 h-4 mr-2" /> Editar Registro Maestro
              </Button>
              <Button 
                variant="destructive"
                className="w-full h-14 rounded-none font-black uppercase text-[10px] tracking-[0.1em] active:scale-95 transition-all"
                onClick={() => {
                  setDeletingTransactionId(viewingTransaction.id);
                  setViewingTransactionId(null);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar Permanentemente
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!editingTransactionId} onOpenChange={(open) => !open && setEditingTransactionId(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-none p-8 bg-white border-none shadow-2xl">
          <DialogHeader><DialogTitle className="font-black text-primary uppercase tracking-widest border-b pb-4">Edición de Registro</DialogTitle></DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary/60">Descripción de Operación</Label>
              <Input 
                value={editForm.description || ''} 
                onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                className="rounded-none h-14 bg-muted/5 border-muted font-bold" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary/60">Monto Directo</Label>
                <Input 
                  type="number" 
                  onFocus={(e) => e.target.select()}
                  value={editForm.amount || 0} 
                  onChange={(e) => setEditForm({...editForm, amount: parseFloat(e.target.value)})} 
                  className="rounded-none h-14 bg-muted/5 border-muted font-black" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary/60">Tipo Flujo</Label>
                <Select value={editForm.type} onValueChange={(val: any) => setEditForm({...editForm, type: val})}>
                  <SelectTrigger className="rounded-none h-14 bg-muted/5 border-muted font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-none border-none shadow-2xl"><SelectItem value="gasto">Gasto</SelectItem><SelectItem value="ingreso">Ingreso</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-4 pt-6">
              <Button variant="ghost" className="flex-1 font-bold rounded-none uppercase text-xs" onClick={() => setEditingTransactionId(null)}>Descartar</Button>
              <Button className="flex-1 bg-accent font-black text-white rounded-none uppercase text-xs" onClick={() => { if(editingTransactionId) onEdit(editingTransactionId, editForm); setEditingTransactionId(null); }}>Actualizar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingTransactionId} onOpenChange={(open) => !open && setDeletingTransactionId(null)}>
        <AlertDialogContent className="rounded-none border-none shadow-2xl p-10 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase text-primary tracking-widest text-xl">¿Confirmar Eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium mt-4 leading-relaxed">
              Esta acción eliminará permanentemente la transacción de su historial y recalculará el Disponible Real.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-4 mt-10">
            <AlertDialogAction 
              className="w-full h-16 rounded-none bg-destructive text-white font-black uppercase text-xs shadow-xl active:scale-95" 
              onClick={() => { if(deletingTransactionId) onDelete(deletingTransactionId); setDeletingTransactionId(null); }}
            >
              Sí, Borrar Definitivamente
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-16 rounded-none font-black bg-muted/50 border-none uppercase text-xs">
              Mantener Registro
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
