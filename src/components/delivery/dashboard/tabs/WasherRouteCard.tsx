
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, DollarSign, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
            createdAt={order.createdAt}
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
        <DialogContent className="rounded-[48px] border-none shadow-2xl p-10 sm:max-w-[480px] w-[92vw] max-h-[92dvh] overflow-y-auto no-scrollbar outline-none z-[600] [&>button:last-child]:hidden">
          <button 
            onClick={() => setIsOfferDialogOpen(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all active:scale-90 z-50 shadow-sm"
          >
            <X className="w-6 h-6" />
          </button>

          <DialogHeader className="items-center text-center space-y-4 pt-4">
            <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center shadow-inner animate-in zoom-in duration-500">
              <DollarSign className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                Enviar Contraoferta
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
                Propón un nuevo precio para este servicio de {order.requestHours}h
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="py-10 space-y-10">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.3em]">Precio Sugerido (COP)</Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Input 
                  type="number" 
                  value={offerPrice} 
                  onChange={(e) => setOfferPrice(e.target.value)} 
                  className="relative z-10 h-20 rounded-[24px] bg-slate-50 border-none font-black text-4xl px-8 text-center text-primary shadow-inner focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.3em]">Nota de Compromiso</Label>
              <Textarea 
                value={offerComment} 
                onChange={(e) => setOfferComment(e.target.value)} 
                placeholder="Ej: Llego en 10 min, instalación incluida..." 
                className="rounded-[32px] bg-slate-50 border-none min-h-[120px] p-6 font-bold text-slate-700 shadow-inner focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all resize-none" 
              />
            </div>
          </div>

          <DialogFooter className="pb-4">
            <Button 
              onClick={handleSendOffer} 
              disabled={isSendingOffer || !offerPrice} 
              className="w-full h-20 rounded-[32px] bg-slate-900 text-white font-black uppercase tracking-[0.15em] text-sm gap-4 shadow-2xl active:scale-95 transition-all border-b-[8px] border-slate-950"
            >
              {isSendingOffer ? <Loader2 className="w-6 h-6 animate-spin" /> : "DESPACHAR PROPUESTA"}
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
