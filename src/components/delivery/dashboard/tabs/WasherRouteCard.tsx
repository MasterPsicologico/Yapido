
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, DollarSign, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from '@/firebase';
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

interface WasherRouteCardProps {
  order: any;
  onAccept: () => void;
}

export function WasherRouteCard({ order, onAccept }: WasherRouteCardProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState(order.totalPrice?.toString() || "");
  const [offerComment, setOfferComment] = useState("");
  const [isSendingOffer, setIsSendingOffer] = useState(false);

  const formattedPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(order.totalPrice || 0);

  const handleSendOffer = async () => {
    if (!firestore || !offerPrice) return;
    setIsSendingOffer(true);
    try {
      const offersCol = collection(firestore, 'orders', order.id, 'offers');
      await addDocumentNonBlocking(offersCol, {
        storeId: order.storeId,
        storeName: order.storeName,
        driverId: user?.uid || 'SYSTEM_DRIVER',
        driverName: user?.displayName || 'Repartidor',
        driverPhone: user?.phoneNumber || '3000000000',
        price: Number(offerPrice),
        comment: offerComment,
        createdAt: serverTimestamp()
      });
      toast({ title: "¡Contraoferta Enviada!", className: "bg-primary text-white" });
      setIsOfferDialogOpen(false);
    } catch (e) {
      toast({ title: "Error al enviar", variant: "destructive" });
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
          />

          <div className="bg-slate-50 p-7 rounded-[40px] border border-slate-100 flex flex-col gap-6 shadow-inner">
            <RouteIdentity 
              customerName={order.customerName} 
              customerAddress={order.customerAddress} 
            />
            <RouteStats floor={order.floor} />
          </div>

          <RouteActions 
            customerPhone={order.customerPhone} 
            customerAddress={order.customerAddress} 
            onOpenChat={handleOpenChat} 
            onOpenOffer={() => setIsOfferDialogOpen(true)} 
          />

          <RouteAcceptButton onAccept={onAccept} />
          
          <div className="flex items-center justify-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em]">Protocolo de Seguridad Aguachica Digital</span>
          </div>
        </div>
      </CardContent>

      {/* DIÁLOGO DE CONTRAOFERTA */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px]">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Enviar Contraoferta</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-xs">Propón un nuevo precio para este servicio de {order.requestHours} horas.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Precio Propuesto (COP)</Label>
              <Input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className="h-16 rounded-2xl bg-slate-50 border-none font-black text-3xl px-6 text-center text-primary" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Comentario de Servicio</Label>
              <Textarea value={offerComment} onChange={(e) => setOfferComment(e.target.value)} placeholder="Ej: Llego en 10 min, instalación incluida..." className="rounded-2xl bg-slate-50 border-none min-h-[100px] font-bold" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSendOffer} disabled={isSendingOffer || !offerPrice} className="w-full h-16 rounded-[24px] bg-slate-900 text-white font-black uppercase tracking-widest gap-3 shadow-xl active:scale-95 transition-all">
              {isSendingOffer ? <Loader2 className="animate-spin" /> : "DESPACHAR PROPUESTA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CHAT ANTICIPADO */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="p-0 border-none bg-white max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 flex flex-col z-[500] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat Anticipado</DialogTitle>
            <DialogDescription>Habla con el cliente antes de aceptar la ruta.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 w-full animate-in zoom-in duration-300">
            <OrderChat orderId={order.id} orderData={order} onClose={() => setIsChatOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
