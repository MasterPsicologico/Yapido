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
  RefreshCw,
  Maximize2
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
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "end" });
    }
  };

  // Scroll automático al cargar y al recibir mensajes
  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(messages?.length ? messages.length < 5 : true), 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Scroll al enviar (cuando isSending cambia a true o false)
  useEffect(() => {
    if (isSending) scrollToBottom();
  }, [isSending]);

  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const handleSmartAddressSync = (messageText: string) => {
    if (!firestore || !orderId) return;

    const keywords = ['calle', 'carrera', 'diagonal', 'transversal', 'avenida', 'cll', 'cra', 'dg', 'tr', 'av', 'barrio', 'manzana', 'casa', 'apto', '#'];
    const lowerText = messageText.toLowerCase();
    
    const isLikelyAddress = keywords.some(k => lowerText.includes(k)) && /\d/.test(messageText);

    if (isLikelyAddress) {
      setIsAutoSyncing(true);
      const orderRef = doc(firestore, 'orders', orderId);
      
      updateDocumentNonBlocking(orderRef, { 
        customerAddress: messageText.trim(),
        updatedAt: serverTimestamp() 
      });

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

      if (payload.type === 'text' && payload.text) {
        handleSmartAddressSync(payload.text);
      }

      setText('');
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
    <div className="grid grid-rows-[auto_1fr_auto] h-full w-full bg-white rounded-none sm:rounded-[40px] shadow-2xl overflow-hidden border animate-in zoom-in duration-300 relative">
      
      {/* FULL SCREEN IMAGE OVERLAY */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center animate-in fade-in duration-300"
          onClick={() => setFullScreenImage(null)}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-full z-[210] h-12 w-12"
            onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}
          >
            <X className="w-8 h-8" />
          </Button>
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Image 
              src={fullScreenImage} 
              alt="Evidencia Full Screen" 
              fill 
              className="object-contain" 
              priority 
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 p-5 flex items-center justify-between text-white shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-black text-base uppercase tracking-tighter italic">Chat del Pedido</h4>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Orden: #{orderId.slice(-6)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAutoSyncing && (
            <div className="flex items-center gap-1.5 bg-green-500/20 px-3 py-1 rounded-full animate-pulse">
              <RefreshCw className="w-3 h-3 text-green-400 animate-spin" />
              <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Logística</span>
            </div>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full h-10 w-10">
              <X className="w-6 h-6" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative flex-1 min-h-0 bg-slate-50">
        <ScrollArea className="h-full w-full">
          <div className="p-6 space-y-6">
            {loadingMessages ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
            ) : messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                 <MessageCircle className="w-16 h-16 mb-4" />
                 <p className="text-sm font-black uppercase tracking-[0.2em]">Inicia la conversación</p>
              </div>
            ) : messages?.map((msg) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div key={msg.id} className={cn("flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300", isMe ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-[24px] shadow-sm",
                    isMe ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                  )}>
                    {!isMe && <p className="text-[10px] font-black uppercase opacity-50 mb-1.5">{msg.senderName}</p>}
                    {msg.type === 'text' ? (
                      <p className="text-sm font-semibold leading-relaxed">{msg.text}</p>
                    ) : (
                      <div 
                        className="relative aspect-square w-64 max-w-full rounded-2xl overflow-hidden border border-black/5 bg-slate-100 cursor-pointer group/img transition-transform active:scale-95"
                        onClick={() => setFullScreenImage(msg.imageUrl)}
                      >
                        <Image src={msg.imageUrl} alt="Evidencia" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-md rounded-full p-2">
                            <Maximize2 className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                    <p className={cn("text-[9px] mt-2 font-bold uppercase opacity-40", isMe ? "text-right" : "text-left")}>
                      {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), "HH:mm") : 'Enviando...'}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} className="h-4 w-full" />
          </div>
        </ScrollArea>
      </div>

      {/* Camera Preview Overlay */}
      {isCameraOpen && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col p-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <h4 className="text-white font-black uppercase text-xs tracking-widest italic">Evidencia Real</h4>
            </div>
            <Button variant="ghost" size="icon" onClick={stopCamera} className="text-white hover:bg-white/10 rounded-full h-12 w-12">
              <X className="w-8 h-8" />
            </Button>
          </div>
          
          <div className="flex-1 relative rounded-[40px] overflow-hidden bg-slate-900 shadow-inner flex items-center justify-center border-4 border-white/5">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover" 
            />
            {(!hasCameraPermission && hasCameraPermission !== null) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center text-white bg-slate-900/95">
                <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
                <p className="font-black text-lg uppercase tracking-tighter italic">Acceso Denegado</p>
                <p className="text-xs text-slate-400 mt-3 max-w-xs leading-relaxed uppercase tracking-widest">Habilita los permisos de cámara en tu navegador para enviar evidencias.</p>
              </div>
            )}
          </div>

          <div className="py-10 flex justify-center">
            <Button 
              onClick={capturePhoto} 
              disabled={!stream}
              className="w-24 h-24 rounded-full bg-white text-black hover:bg-slate-200 shadow-[0_0_50px_rgba(255,255,255,0.2)] border-8 border-slate-300 transition-all active:scale-90"
            >
              <div className="w-16 h-16 rounded-full border-4 border-slate-900 flex items-center justify-center">
                <Camera className="w-10 h-10" />
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-6 bg-white border-t space-y-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => fileInputRef.current?.click()} 
            className="rounded-full h-12 w-12 border-slate-200 shrink-0 hover:bg-slate-50 transition-colors"
            title="Subir de Galería"
          >
            <ImageIcon className="w-6 h-6 text-slate-400" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={startCamera} 
            className="rounded-full h-12 w-12 border-slate-200 shrink-0 hover:bg-slate-50 transition-colors"
            title="Tomar Foto Evidencia"
          >
            <Camera className="w-6 h-6 text-slate-400" />
          </Button>
          <div className="flex-1 relative">
            <Input 
              placeholder="Escribe un mensaje..." 
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage({ text, type: 'text' })}
              className="rounded-full h-12 bg-slate-100 border-none pl-6 pr-12 text-sm font-bold shadow-inner"
            />
            <Button 
              onClick={() => handleSendMessage({ text, type: 'text' })} 
              disabled={isSending || !text.trim()}
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 text-primary hover:bg-transparent transition-transform active:scale-90"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-center text-slate-300 font-black uppercase tracking-[0.3em]">
          Vitriniando Seguro • Canal Monitoreado
        </p>
      </div>
    </div>
  );
}
