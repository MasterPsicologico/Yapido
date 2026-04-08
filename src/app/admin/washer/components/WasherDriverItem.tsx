
"use client";

import { useState } from 'react';
import { useDoc, useMemoFirebase, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, MessageCircle, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OrderChat } from '@/components/chat/OrderChat';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WasherDriverItemProps {
  driverId: string;
  storeId: string;
  storeName: string;
  ownerId: string;
  onUnlink: (id: string) => void;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.131.57-.074 1.758-.706 2.006-1.388.248-.683.248-1.265.173-1.388-.075-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .01 5.393 0 12.03c0 2.123.54 4.197 1.57 6.05L0 24l6.15-1.612a11.81 11.81 0 005.89 1.568h.005c6.634 0 12.04-5.39 12.043-12.03a11.82 11.82 0 00-3.48-8.513z"/>
  </svg>
);

export function WasherDriverItem({ driverId, storeId, storeName, ownerId, onUnlink }: WasherDriverItemProps) {
  const firestore = useFirestore();
  const [internalChatOrder, setInternalChatOrder] = useState<any | null>(null);
  const [isConnectingChat, setIsConnectingChat] = useState(false);

  // FETCH: Perfil real del repartidor
  const driverRef = useMemoFirebase(() => !firestore || !driverId ? null : doc(firestore, 'users', driverId), [firestore, driverId]);
  const { data: driverProfile, isLoading } = useDoc(driverRef);

  const handleOpenInternalChat = async () => {
    if (!firestore || !driverProfile) return;
    setIsConnectingChat(true);
    try {
      const q = query(
        collection(firestore, 'orders'),
        where('participants', 'array-contains', driverId),
        where('storeId', '==', storeId),
        where('status', '==', 'inquiry')
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setInternalChatOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        const inquiryData = {
          customerId: driverId,
          customerName: driverProfile.realFullName || driverProfile.displayName || 'Repartidor',
          customerPhone: driverProfile.phoneNumber || '',
          storeId: storeId,
          storeName: storeName,
          storeOwnerId: ownerId,
          participants: [ownerId, driverId],
          status: 'inquiry',
          productName: 'Chat de Flota Personal',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isLogisticsPublic: false
        };
        const docRef = await addDocumentNonBlocking(collection(firestore, 'orders'), inquiryData);
        setInternalChatOrder({ id: docRef.id, ...inquiryData });
      }
    } catch (e) {
      toast({ title: "Error al conectar chat", variant: "destructive" });
    } finally {
      setIsConnectingChat(false);
    }
  };

  const handleWhatsAppOpen = () => {
    if (!driverProfile?.phoneNumber) {
      toast({ title: "Número no disponible", variant: "destructive" });
      return;
    }
    const cleanPhone = driverProfile.phoneNumber.replace(/\D/g, '');
    const message = `¡Hola! 👋 Te contacto desde la vitrina *${storeName}*.`;
    const url = `https://wa.me/${cleanPhone.startsWith('57') ? cleanPhone : '57' + cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return <div className="h-20 bg-slate-50 rounded-3xl animate-pulse" />;
  }

  return (
    <Card className="border-none rounded-[32px] p-3 sm:p-4 bg-white shadow-sm hover:shadow-md transition-all ring-1 ring-black/[0.02] group overflow-hidden">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* LADO IZQUIERDO: AVATAR Y INFO (ESTILO WHATSAPP) */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <Avatar className="w-11 h-11 sm:w-14 sm:h-14 border-2 border-slate-50 shadow-sm shrink-0">
            <AvatarImage src={driverProfile?.photoURL} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-black uppercase">
              {driverProfile?.displayName?.charAt(0) || 'R'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-0.5">
              <h4 className="text-xs sm:text-sm font-black uppercase italic text-slate-900 truncate">
                {driverProfile?.realFullName || driverProfile?.displayName || 'Cargando...'}
              </h4>
              <Badge className="w-fit bg-green-50 text-green-600 border-none text-[6px] sm:text-[7px] font-black uppercase px-1.5 sm:px-2 py-0.5">VINCULADO</Badge>
            </div>
            <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
              {driverProfile?.phoneNumber || 'Sin teléfono'}
            </p>
          </div>
        </div>

        {/* ACCIONES DE CONTACTO RÁPIDO - REDIMENSIONADAS PARA EVITAR DESBORDAMIENTO */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button 
            onClick={handleOpenInternalChat} 
            disabled={isConnectingChat}
            size="icon" 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900 text-white hover:bg-primary transition-all shadow-lg active:scale-95"
          >
            {isConnectingChat ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />}
          </Button>
          
          <Button 
            onClick={handleWhatsAppOpen}
            size="icon" 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#25d366] text-white hover:bg-[#128c7e] transition-all shadow-lg active:scale-95"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>

          <a href={`tel:${driverProfile?.phoneNumber}`} className={!driverProfile?.phoneNumber ? "pointer-events-none" : ""}>
            <Button 
              size="icon" 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all shadow-sm active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </a>

          <Button 
            onClick={() => onUnlink(driverId)}
            variant="ghost" 
            size="icon"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      {/* DIÁLOGO DE CHAT INTERNO (MODULAR) */}
      <Dialog open={!!internalChatOrder} onOpenChange={v => !v && setInternalChatOrder(null)}>
        <DialogContent className="p-0 border-none bg-white shadow-none max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 sm:p-4 md:p-8 flex flex-col z-[500] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat Interno</DialogTitle>
            <DialogDescription>Comunicación directa con tu flota.</DialogDescription>
          </DialogHeader>
          {internalChatOrder && (
            <div className="flex-1 min-h-0 w-full animate-in zoom-in duration-300">
              <OrderChat orderId={internalChatOrder.id} orderData={internalChatOrder} onClose={() => setInternalChatOrder(null)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
