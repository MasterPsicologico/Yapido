
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, arrayUnion } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { OrderChat } from '@/components/chat/OrderChat';

// IMPORTACIÓN DE COMPONENTES ATÓMICOS
import { RouteHeader } from './route-card/components/RouteHeader';
import { RoutePrice } from './route-card/components/RoutePrice';
import { RouteIdentity } from './route-card/components/RouteIdentity';
import { RouteStats } from './route-card/components/RouteStats';
import { RouteActions } from './route-card/components/RouteActions';
import { RouteAcceptButton } from './route-card/components/RouteAcceptButton';
import { WasherOfferDialog } from './route-card/components/WasherOfferDialog';

interface WasherRouteCardProps {
  order: any;
  onAccept: () => void;
}

export function WasherRouteCard({ order, onAccept }: WasherRouteCardProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSendingOffer, setIsSendingOffer] = useState(false);

  const formattedPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(order.totalPrice || 0);

  const handleSendOffer = async (price: number, comment: string) => {
    if (!firestore || !user || !price) return;
    setIsSendingOffer(true);
    
    try {
      const offersCol = collection(firestore, 'orders', order.id, 'offers');
      
      // EL TRATO SE LANZA A LA NUBE (NON-BLOCKING)
      addDocumentNonBlocking(offersCol, {
        storeId: order.storeId,
        storeName: order.storeName || 'Lava Express',
        storeOwnerId: order.storeOwnerId,
        driverId: user.uid,
        driverName: user.displayName || 'Repartidor',
        driverPhone: user.phoneNumber || '',
        price: price,
        comment: comment,
        createdAt: serverTimestamp()
      });

      // NO CERRAMOS EL DIÁLOGO AQUÍ para permitir múltiples incrementos rápidos
      // El usuario cierra cuando esté satisfecho con su contraoferta final
    } catch (e) {
      toast({ title: "Error al enviar trato", variant: "destructive" });
    } finally {
      setIsSendingOffer(false);
    }
  };

  const handleOpenChat = () => {
    if (!user || !firestore) return;
    const orderRef = doc(firestore, 'orders', order.id);
    updateDocumentNonBlocking(orderRef, {
      participants: arrayUnion(user.uid),
      updatedAt: serverTimestamp()
    });
    setIsChatOpen(true);
  };

  return (
    <Card className="border-none rounded-[48px] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] bg-white overflow-hidden ring-1 ring-black/[0.03] group hover:shadow-2xl transition-all duration-700">
      <CardContent className="p-0">
        <RouteHeader protocolId={order.id} />

        <div className="p-8 space-y-8">
          <RoutePrice 
            formattedPrice={formattedPrice} 
            requestHours={order.requestHours} 
            washerType={order.washerType} 
            createdAt={order.createdAt}
          />

          <div className="bg-slate-50 p-7 rounded-[40px] border border-slate-100 flex flex-col gap-6 shadow-inner">
            <RouteIdentity 
              customerName={order.customerName} 
              customerAddress={order.customerAddress}
              customerSector={order.customerSector} 
            />
            <RouteStats floor={order.floor} />
          </div>

          <RouteActions 
            orderId={order.id}
            storeName={order.storeName || 'Lava Express'}
            requestHours={order.requestHours}
            customerPhone={order.customerPhone} 
            customerAddress={order.customerAddress} 
            onOpenChat={handleOpenChat} 
            onOpenOffer={() => setIsOfferDialogOpen(true)}
            isUnlocked={false}
          />

          <RouteAcceptButton onAccept={onAccept} />
          
          <div className="flex items-center justify-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em]">Protocolo de Seguridad Aguachica Digital</span>
          </div>
        </div>
      </CardContent>

      {/* NUEVO DIÁLOGO DE TRATO FULL-SCREEN PREMIUM */}
      <WasherOfferDialog 
        isOpen={isOfferDialogOpen}
        onOpenChange={setIsOfferDialogOpen}
        order={order}
        onSendOffer={handleSendOffer}
        isSending={isSendingOffer}
      />

      {/* DIÁLOGO DE CHAT DE NEGOCIACIÓN */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="p-0 border-none bg-white max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 flex flex-col z-[500] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat de Negociación</DialogTitle>
            <DialogDescription>Habla con el cliente sobre esta ruta.</DialogDescription>
          </DialogHeader>
          <OrderChat orderId={order.id} orderData={order} onClose={() => setIsChatOpen(false)} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
