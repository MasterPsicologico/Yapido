
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, DollarSign, Loader2, X, MessageCircle } from 'lucide-react';
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
    if (!firestore || !offerPrice || !user) return;
    setIsSendingOffer(true);
    
    try {
      const offersCol = collection(firestore, 'orders', order.id, 'offers');
      
      // El trato se envía a la nube sin bloquear la interfaz
      addDocumentNonBlocking(offersCol, {
        storeId: order.storeId,
        storeName: order.storeName || 'Tienda',
        storeOwnerId: order.storeOwnerId,
        driverId: user.uid,
        driverName: user.displayName || 'Repartidor',
        driverPhone: user.phoneNumber || '',
        price: Number(offerPrice),
        comment: offerComment,
        createdAt: serverTimestamp()
      });

      toast({ 
        title: "¡Trato Enviado!", 
        description: "El cliente ha sido notificado de tu oferta.",
        className: "bg-primary text-white border-none"
      });
      
      setIsOfferDialogOpen(false);
    } catch (e) {
      toast({ title: "Error al enviar trato", variant: "destructive" });
    } finally {
      setIsSendingOffer(false);
    }
  };

  const handleOpenChat = () => {
    if (!user || !firestore) return;
    const orderRef = doc(firestore, 'orders', order.id);
    
    // Al abrir chat, nos añadimos como participantes para tener permiso de lectura
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

      {/* DIÁLOGO DE CONTRAOFERTA (RESTAURADO) */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="z-[700] rounded-[40px] border-none shadow-2xl p-0 bg-white overflow-hidden max-w-[400px]">
          <DialogHeader className="p-8 bg-slate-900 text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-white/10">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter leading-none">Enviar Trato</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">Propón un nuevo precio de servicio</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">¿Cuál es tu propuesta?</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg">$</span>
                <Input 
                  type="number" 
                  value={offerPrice} 
                  onChange={(e) => setOfferPrice(e.target.value)} 
                  className="h-16 rounded-2xl bg-slate-50 border-none font-black text-2xl pl-10" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Mensaje para el cliente</Label>
              <Textarea 
                value={offerComment} 
                onChange={(e) => setOfferComment(e.target.value)} 
                placeholder="Ej: Llego en 10 min, tengo equipo nuevo..." 
                className="rounded-2xl bg-slate-50 border-none min-h-[100px] font-medium" 
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-0">
            <Button 
              onClick={handleSendOffer} 
              disabled={isSendingOffer || !offerPrice} 
              className="w-full h-16 rounded-[24px] bg-slate-900 text-white font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all"
            >
              {isSendingOffer ? <Loader2 className="animate-spin" /> : "ENVIAR MI TRATO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CHAT DE NEGOCIACIÓN (RESTAURADO) */}
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
