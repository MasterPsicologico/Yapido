
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
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
  AlertCircle
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
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !orderId) return null;
    return query(collection(firestore, 'orders', orderId, 'messages'), orderBy('createdAt', 'asc'));
  }, [firestore, orderId]);

  const { data: messages, isLoading: loadingMessages } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 800, 800, 0.7);
      handleSendMessage({ imageUrl: compressed, type: 'image' });
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setHasCameraPermission(false);
      toast({ title: "Acceso a cámara denegado", variant: "destructive" });
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      handleSendMessage({ imageUrl: dataUrl, type: 'image' });
      stopCamera();
    }
  };

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
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-slate-50" ref={scrollRef}>
        <div className="space-y-4">
          {loadingMessages ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : messages?.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                <div className={cn(
                  "max-w-[80%] p-3 rounded-2xl shadow-sm",
                  isMe ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none"
                )}>
                  {!isMe && <p className="text-[9px] font-black uppercase opacity-50 mb-1">{msg.senderName}</p>}
                  {msg.type === 'text' ? (
                    <p className="text-sm font-medium">{msg.text}</p>
                  ) : (
                    <div className="relative aspect-square w-48 rounded-lg overflow-hidden border border-black/5">
                      <Image src={msg.imageUrl} alt="Evidencia" fill className="object-cover" />
                    </div>
                  )}
                  <p className={cn("text-[8px] mt-1 font-bold uppercase opacity-40", isMe ? "text-right" : "text-left")}>
                    {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), "HH:mm") : '...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Camera Preview Overlay */}
      {isCameraOpen && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col p-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-white font-black uppercase text-xs italic">Cámara de Evidencia</h4>
            <Button variant="ghost" size="icon" onClick={stopCamera} className="text-white"><X /></Button>
          </div>
          <video ref={videoRef} autoPlay playsInline className="flex-1 rounded-2xl bg-slate-900 object-cover" />
          <div className="py-6 flex justify-center">
            <Button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white text-black hover:bg-slate-200 shadow-2xl border-4 border-slate-300">
              <Camera className="w-8 h-8" />
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
            className="rounded-full h-10 w-10 border-slate-200"
            title="Subir de Galería"
          >
            <ImageIcon className="w-5 h-5 text-slate-400" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={startCamera} 
            className="rounded-full h-10 w-10 border-slate-200"
            title="Tomar Foto Evidencia"
          >
            <Camera className="w-5 h-5 text-slate-400" />
          </Button>
          <div className="flex-1 relative">
            <Input 
              placeholder="Escribe un mensaje..." 
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage({ text, type: 'text' })}
              className="rounded-full h-10 bg-slate-100 border-none pl-4 pr-10"
            />
            <Button 
              onClick={() => handleSendMessage({ text, type: 'text' })} 
              disabled={isSending || !text.trim()}
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 text-primary hover:bg-transparent"
            >
              <Send className="w-4 h-4" />
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
