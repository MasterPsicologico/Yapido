
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  Camera, 
  ImageIcon, 
  X, 
  Loader2, 
  MessageCircle, 
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { compressImage } from '@/lib/image-compression';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OrderChatProps {
  orderId: string;
  orderData: any;
  onClose?: () => void;
}

export function OrderChat({ orderId, orderData, onClose }: OrderChatProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orderId) {
      window.dispatchEvent(new CustomEvent('chat-opened', { detail: { orderId } }));
    }
  }, [orderId]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !orderId) return null;
    return query(collection(firestore, 'orders', orderId, 'messages'), orderBy('createdAt', 'asc'));
  }, [firestore, orderId]);

  const { data: messages, isLoading: loadingMessages } = useCollection(messagesQuery);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  // LÓGICA ESPECIALISTA: Detección inteligente de direcciones en el chat con PROPAGACIÓN SELECTIVA
  const handleSmartAddressSync = (messageText: string) => {
    if (!firestore || !orderId) return;

    const keywords = ['calle', 'carrera', 'diagonal', 'transversal', 'avenida', 'cll', 'cra', 'dg', 'tr', 'av', 'barrio', 'manzana', 'casa', 'apto', '#'];
    const lowerText = messageText.toLowerCase();
    
    // Si el mensaje tiene palabras clave de dirección y al menos un número, es una dirección probable
    const isLikelyAddress = keywords.some(k => lowerText.includes(k)) && /\d/.test(messageText);

    if (isLikelyAddress) {
      setIsAutoSyncing(true);
      const orderRef = doc(firestore, 'orders', orderId);
      
      // 1. Actualización de Pedido: Siempre permitida para participantes
      updateDocumentNonBlocking(orderRef, { 
        customerAddress: messageText.trim(),
        updatedAt: serverTimestamp() 
      });

      // 2. SINCRONIZACIÓN SELECTIVA: Solo actualizar el perfil si el usuario que escribe ES el cliente
      // Esto previene el error 403 (Permission Denied) cuando el vendedor escribe la dirección
      if (orderData.customerId && user?.uid === orderData.customerId) {
        const userRef = doc(firestore, 'users', orderData.customerId);
        updateDocumentNonBlocking(userRef, { 
          address: messageText.trim(),
          updatedAt: serverTimestamp() 
        });
      }

      toast({ 
        title: "¡Inteligencia Logística Activa!", 
        description: "He detectado una dirección y la he guardado en el pedido.",
        className: "bg-green-600 text-white border-none"
      });

      setTimeout(() => setIsAutoSyncing(false), 2000);
    }
  };

  const handleSendMessage = async (payload: { text?: string; imageUrl?: string; type: 'text' | 'image' }) => {
    if (!user || !firestore || (!payload.text && !payload.imageUrl)) return;

    setIsSending(true);
    try {
      const messagesRef = collection(firestore, 'orders', orderId, 'messages');
      await addDocumentNonBlocking(messagesRef, {
        senderId: user.uid,
        senderName: user.displayName || 'Usuario',
        text: payload.text || '',
        imageUrl: payload.imageUrl || '',
        type: payload.type,
        createdAt: serverTimestamp(),
      });

      // Si es un mensaje de texto, intentar sincronizar dirección automáticamente
      if (payload.type === 'text' && payload.text) {
        handleSmartAddressSync(payload.text);
      }

      setText('');
      setTimeout(scrollToBottom, 100);
    } catch (e) {
      toast({ title: "Error al enviar", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 800, 800, 0.7);
      handleSendMessage({ imageUrl: compressed, type: 'image' });
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      setHasCameraPermission(true);
      setIsCameraOpen(true);
    } catch (error) {
      setHasCameraPermission(false);
      toast({ 
        title: "Acceso a cámara denegado", 
        description: "Asegúrate de permitir el acceso en tu navegador.", 
        variant: "destructive" 
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && stream) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        handleSendMessage({ imageUrl: dataUrl, type: 'image' });
        stopCamera();
        toast({ title: "Evidencia enviada" });
      }
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col h-[600px] max-h-[80vh] bg-white rounded-[32px] shadow-2xl overflow-hidden border">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-tighter italic">Chat del Pedido</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Orden: #{orderId.slice(-6)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAutoSyncing && (
            <div className="flex items-center gap-1.5 bg-green-500/20 px-3 py-1 rounded-full animate-pulse">
              <RefreshCw className="w-3 h-3 text-green-400 animate-spin" />
              <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Sincronizando</span>
            </div>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-slate-50">
        <div className="space-y-4">
          {loadingMessages ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-30">
               <MessageCircle className="w-10 h-10 mb-2" />
               <p className="text-xs font-black uppercase tracking-widest">Inicia la conversación</p>
            </div>
          ) : messages?.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={cn("flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300", isMe ? "items-end" : "items-start")}>
                <div className={cn(
                  "max-w-[80%] p-3 rounded-2xl shadow-sm",
                  isMe ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none"
                )}>
                  {!isMe && <p className="text-[9px] font-black uppercase opacity-50 mb-1">{msg.senderName}</p>}
                  {msg.type === 'text' ? (
                    <p className="text-sm font-medium">{msg.text}</p>
                  ) : (
                    <div className="relative aspect-square w-48 rounded-lg overflow-hidden border border-black/5 bg-slate-100">
                      <Image src={msg.imageUrl} alt="Evidencia" fill className="object-cover" />
                    </div>
                  )}
                  <p className={cn("text-[8px] mt-1 font-bold uppercase opacity-40", isMe ? "text-right" : "text-left")}>
                    {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), "HH:mm") : 'Enviando...'}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} className="h-2 w-full" />
        </div>
      </ScrollArea>

      {/* Camera Preview Overlay */}
      {isCameraOpen && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col p-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              <h4 className="text-white font-black uppercase text-[10px] tracking-widest italic">Cámara de Evidencia</h4>
            </div>
            <Button variant="ghost" size="icon" onClick={stopCamera} className="text-white hover:bg-white/10 rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-900 shadow-inner flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover" 
            />
            {(!hasCameraPermission && hasCameraPermission !== null) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900/90">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="font-bold text-sm uppercase tracking-tighter">Acceso Denegado</p>
                <p className="text-[10px] text-slate-400 mt-2">Habilita los permisos de cámara en tu navegador.</p>
              </div>
            )}
          </div>

          <div className="py-8 flex justify-center">
            <Button 
              onClick={capturePhoto} 
              disabled={!stream}
              className="w-20 h-20 rounded-full bg-white text-black hover:bg-slate-200 shadow-[0_0_30px_rgba(255,255,255,0.3)] border-4 border-slate-300 transition-transform active:scale-90"
            >
              <div className="w-14 h-14 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t space-y-3">
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => fileInputRef.current?.click()} 
            className="rounded-full h-10 w-10 border-slate-200 shrink-0"
            title="Subir de Galería"
          >
            <ImageIcon className="w-5 h-5 text-slate-400" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={startCamera} 
            className="rounded-full h-10 w-10 border-slate-200 shrink-0"
            title="Tomar Foto Evidencia"
          >
            <Camera className="w-5 h-5 text-slate-400" />
          </Button>
          <div className="flex-1 relative">
            <Input 
              placeholder="Escribe un mensaje..." 
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage({ text, type: 'text' })}
              className="rounded-full h-10 bg-slate-100 border-none pl-4 pr-10 text-sm font-medium"
            />
            <Button 
              onClick={() => handleSendMessage({ text, type: 'text' })} 
              disabled={isSending || !text.trim()}
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 text-primary hover:bg-transparent"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <p className="text-[9px] text-center text-slate-300 font-black uppercase tracking-widest">
          Soporte Vitriniando: Este chat es monitoreado por moderadores.
        </p>
      </div>
    </div>
  );
}
