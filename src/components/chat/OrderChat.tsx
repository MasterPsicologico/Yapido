
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
  Maximize2,
  Zap,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { compressImage } from '@/lib/image-compression';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface OrderChatProps {
  orderId: string;
  orderData: any;
  onClose?: () => void;
}

export function OrderChat({ orderId, orderData, onClose }: OrderChatProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isBusinessSide = user?.uid === orderData?.storeOwnerId || user?.uid === orderData?.deliveryDriverId;
  const isWashInquiry = orderData?.status === 'inquiry';

  useEffect(() => {
    if (orderId) {
      window.dispatchEvent(new CustomEvent('chat-opened', { detail: { orderId } }));
    }
  }, [orderId]);

  // VINCULACIÓN DE STREAM A VIDEO REF
  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

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

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(messages?.length ? messages.length < 5 : true), 100);
    return () => clearTimeout(timer);
  }, [messages]);

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
      setText('');
    } catch (e) {
      toast({ title: "Error al enviar", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickRequest = async () => {
    if (!user || !firestore || !orderData) return;
    setIsConverting(true);
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      // Transformamos la consulta en pedido directo
      updateDocumentNonBlocking(orderRef, {
        status: 'pending',
        isLogisticsPublic: false, // Es trato directo con esta tienda
        isDirectRequest: true,
        updatedAt: serverTimestamp(),
        requestHours: 5, // Default
        totalPrice: 15000, // Placeholder
      });

      toast({ title: "¡Solicitud Formalizada!", className: "bg-green-600 text-white" });
      
      // Redirección inmediata al panel de administración temporal
      setTimeout(() => {
        router.push(`/washer/waiting-room/${orderId}`);
        if (onClose) onClose();
      }, 1000);
    } catch (e) {
      toast({ title: "Error al procesar", variant: "destructive" });
    } finally {
      setIsConverting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Calidad aumentada: 1920x1080 con 0.85 de calidad
      const compressed = await compressImage(file, 1920, 1080, 0.85);
      handleSendMessage({ imageUrl: compressed, type: 'image' });
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (error) {
      toast({ title: "Acceso denegado", description: "Habilita la cámara.", variant: "destructive" });
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
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
        // Calidad de captura aumentada a 0.9
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        handleSendMessage({ imageUrl: dataUrl, type: 'image' });
        stopCamera();
      }
    }
  };

  return (
    <div className="grid grid-rows-[64px_1fr_auto] h-full w-full bg-white rounded-none sm:rounded-[40px] shadow-2xl overflow-hidden border animate-in zoom-in duration-300 relative">
      
      {fullScreenImage && (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center animate-in fade-in duration-200" onClick={() => setFullScreenImage(null)}>
          <Button variant="ghost" size="icon" className="absolute top-6 right-6 text-white bg-white/10 rounded-full z-[310] h-12 w-12" onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}><X className="w-8 h-8" /></Button>
          <div className="relative w-full h-full p-4"><Image src={fullScreenImage} alt="Fullscreen" fill className="object-contain" priority /></div>
        </div>
      )}

      <div className="h-16 bg-slate-900 px-5 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center"><MessageCircle className="w-5 h-5 text-primary" /></div>
          <div><h4 className="font-black text-sm uppercase tracking-tighter italic leading-none">Chat Interno</h4><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">#{orderId.slice(-6)}</p></div>
        </div>
        {onClose && <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full h-9 w-9"><X className="w-5 h-5" /></Button>}
      </div>

      <div className="relative overflow-hidden bg-slate-50 min-h-0 flex-1">
        <ScrollArea className="h-full w-full">
          <div className="p-6 space-y-6 min-h-full flex flex-col">
            
            {/* SOLICITUD RÁPIDA (SOLO PARA CLIENTES EN INQUIRY) */}
            {isWashInquiry && !isBusinessSide && (
              <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl mb-8 animate-in slide-in-from-top-4 duration-700 relative overflow-hidden border-b-4 border-primary/40">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                    <Zap className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none">¿Quieres la lavadora ahora?</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Confirma el servicio y despacharemos de inmediato.</p>
                  </div>
                  <Button 
                    onClick={handleQuickRequest}
                    disabled={isConverting}
                    className="w-full h-12 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    {isConverting ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4" /> SÍ, SOLICITAR SERVICIO</>}
                  </Button>
                </div>
              </div>
            )}

            {(!loadingMessages && (!messages || messages.length === 0)) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-20">
                <div className="w-20 h-20 bg-white rounded-[32px] shadow-lg flex items-center justify-center border border-slate-100">
                  <MessageCircle className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Inicia el trato</h3>
                  <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em]">Habla directamente con el responsable.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 w-full">
                {messages?.map((msg) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={cn("flex flex-col animate-in fade-in slide-in-from-bottom-2", isMe ? "items-end" : "items-start")}>
                      <div className={cn("max-w-[85%] p-4 rounded-[24px] shadow-sm", isMe ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100")}>
                        {!isMe && <p className="text-[10px] font-black uppercase opacity-50 mb-1.5">{msg.senderName}</p>}
                        {msg.type === 'text' ? (
                          <p className="text-sm font-semibold leading-relaxed">{msg.text}</p>
                        ) : (
                          <div className="relative aspect-square w-32 rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform" onClick={() => setFullScreenImage(msg.imageUrl)}>
                            <Image src={msg.imageUrl} alt="Evidencia" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"><Maximize2 className="w-5 h-5 text-white" /></div>
                          </div>
                        )}
                        <p className={cn("text-[9px] mt-2 font-bold uppercase opacity-40", isMe ? "text-right" : "text-left")}>
                          {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), "HH:mm") : '...'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} className="h-4 w-full mt-auto" />
          </div>
        </ScrollArea>
      </div>

      <div className="shrink-0 bg-white border-t p-4 pb-safe space-y-3">
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className="rounded-full h-10 w-10 border-slate-200 shrink-0"><ImageIcon className="w-5 h-5 text-slate-400" /></Button>
          <Button variant="outline" size="icon" onClick={startCamera} className="rounded-full h-10 w-10 border-slate-200 shrink-0"><Camera className="w-5 h-5 text-slate-400" /></Button>
          <div className="flex-1 relative">
            <Input 
              placeholder="Escribe aquí..." 
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage({ text, type: 'text' })}
              className="rounded-full h-10 bg-slate-100 border-none pl-5 pr-10 text-sm font-bold"
            />
            <Button onClick={() => handleSendMessage({ text, type: 'text' })} disabled={isSending || !text.trim()} variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 text-primary">
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <p className="text-[8px] text-center text-slate-300 font-black uppercase tracking-[0.3em]">Canal Protegido • Vitriniando Seguro</p>
      </div>

      {isCameraOpen && (
        <div className="absolute inset-0 z-[250] bg-black flex flex-col animate-in fade-in">
          <div className="absolute top-6 left-6 right-6 z-[260] flex justify-between items-center">
            <h4 className="text-white font-black uppercase text-xs tracking-widest italic drop-shadow-lg">Captura Directa</h4>
            <Button variant="ghost" size="icon" onClick={stopCamera} className="text-white bg-black/20 rounded-full h-12 w-12 hover:bg-black/40">
              <X className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="flex-1 w-full bg-slate-900">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover" 
            />
          </div>
          
          <div className="absolute bottom-10 left-0 right-0 flex justify-center z-[260]">
            <Button 
              onClick={capturePhoto} 
              className="w-24 h-24 rounded-full bg-white/20 text-white border-4 border-white backdrop-blur-md active:scale-90 transition-all p-0 flex items-center justify-center group"
            >
              <div className="w-16 h-16 rounded-full bg-white group-hover:scale-110 transition-transform flex items-center justify-center">
                <Camera className="w-8 h-8 text-black" />
              </div>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
