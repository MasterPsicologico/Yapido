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
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
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

  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "end" });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(messages?.length ? messages.length < 5 : true), 100);
    return () => clearTimeout(timer);
  }, [messages]);

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
      const orderRef = doc(firestore, 'orders', orderId);
      updateDocumentNonBlocking(orderRef, { customerAddress: messageText.trim(), updatedAt: serverTimestamp() });
      if (orderData.customerId && user?.uid === orderData.customerId) {
        const userRef = doc(firestore, 'users', orderData.customerId);
        updateDocumentNonBlocking(userRef, { address: messageText.trim(), updatedAt: serverTimestamp() });
      }
      toast({ title: "¡Logística Activa!", description: "Dirección sincronizada.", className: "bg-green-600 text-white border-none" });
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
      if (payload.type === 'text' && payload.text) handleSmartAddressSync(payload.text);
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
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setHasCameraPermission(true);
      setIsCameraOpen(true);
    } catch (error) {
      setHasCameraPermission(false);
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        handleSendMessage({ imageUrl: dataUrl, type: 'image' });
        stopCamera();
      }
    }
  };

  return (
    <div className="grid grid-rows-[64px_1fr_auto] h-full w-full bg-white rounded-none sm:rounded-[40px] shadow-2xl overflow-hidden border animate-in zoom-in duration-300 relative">
      
      {/* VISOR DE IMAGEN PANTALLA COMPLETA */}
      {fullScreenImage && (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center animate-in fade-in duration-200" onClick={() => setFullScreenImage(null)}>
          <Button variant="ghost" size="icon" className="absolute top-6 right-6 text-white bg-white/10 rounded-full z-[310] h-12 w-12" onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}><X className="w-8 h-8" /></Button>
          <div className="relative w-full h-full p-4"><Image src={fullScreenImage} alt="Fullscreen" fill className="object-contain" priority /></div>
        </div>
      )}

      {/* Header (Altura Fija Bloqueada) */}
      <div className="h-16 bg-slate-900 px-5 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center"><MessageCircle className="w-5 h-5 text-primary" /></div>
          <div><h4 className="font-black text-sm uppercase tracking-tighter italic leading-none">Chat Interno</h4><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">#{orderId.slice(-6)}</p></div>
        </div>
        {onClose && <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full h-9 w-9"><X className="w-5 h-5" /></Button>}
      </div>

      {/* Area de Mensajes (Flexible pero Restringida) */}
      <div className="relative overflow-hidden bg-slate-50 min-h-0 flex-1">
        <ScrollArea className="h-full w-full">
          <div className="p-6 space-y-6">
            {messages?.map((msg) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div key={msg.id} className={cn("flex flex-col animate-in fade-in slide-in-from-bottom-2", isMe ? "items-end" : "items-start")}>
                  <div className={cn("max-w-[85%] p-4 rounded-[24px] shadow-sm", isMe ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100")}>
                    {!isMe && <p className="text-[10px] font-black uppercase opacity-50 mb-1.5">{msg.senderName}</p>}
                    {msg.type === 'text' ? (
                      <p className="text-sm font-semibold leading-relaxed">{msg.text}</p>
                    ) : (
                      <div 
                        className="relative aspect-square w-32 rounded-xl overflow-hidden border border-black/5 bg-slate-100 cursor-pointer group/img active:scale-95 transition-transform"
                        onClick={() => setFullScreenImage(msg.imageUrl)}
                      >
                        <Image src={msg.imageUrl} alt="Evidencia" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                    <p className={cn("text-[9px] mt-2 font-bold uppercase opacity-40", isMe ? "text-right" : "text-left")}>
                      {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), "HH:mm") : '...'}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} className="h-4 w-full" />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area (Anclaje Mecánico Inferior) */}
      <div className="shrink-0 bg-white border-t p-4 pb-safe space-y-3">
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className="rounded-full h-10 w-10 border-slate-200 shrink-0"><ImageIcon className="w-5 h-5 text-slate-400" /></Button>
          <Button variant="outline" size="icon" onClick={startCamera} className="rounded-full h-10 w-10 border-slate-200 shrink-0"><Camera className="w-5 h-5 text-slate-400" /></Button>
          <div className="flex-1 relative">
            <Input 
              placeholder="Mensaje..." 
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage({ text, type: 'text' })}
              className="rounded-full h-10 bg-slate-100 border-none pl-5 pr-10 text-sm font-bold"
            />
            <Button 
              onClick={() => handleSendMessage({ text, type: 'text' })} 
              disabled={isSending || !text.trim()}
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 text-primary"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <p className="text-[8px] text-center text-slate-300 font-black uppercase tracking-[0.3em]">Vitriniando Seguro • Canal Protegido</p>
      </div>

      {/* Camera Overlay */}
      {isCameraOpen && (
        <div className="absolute inset-0 z-[250] bg-black flex flex-col p-6 animate-in fade-in">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-white font-black uppercase text-xs tracking-widest italic">Capturar Evidencia</h4>
            <Button variant="ghost" size="icon" onClick={stopCamera} className="text-white"><X className="w-6 h-6" /></Button>
          </div>
          <div className="flex-1 relative rounded-[32px] overflow-hidden bg-slate-900 border-2 border-white/10">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>
          <div className="py-8 flex justify-center">
            <Button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white text-black border-8 border-slate-300 active:scale-90"><Camera className="w-8 h-8" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
