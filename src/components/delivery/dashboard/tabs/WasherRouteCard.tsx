
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  ArrowRight, 
  Zap, 
  Wallet, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  Star,
  Info,
  CheckCircle2,
  ArrowUpCircle,
  MessageCircle,
  Phone,
  DollarSign,
  Loader2,
  User,
  Navigation,
  Activity,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collection, serverTimestamp, doc, arrayUnion } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { OrderChat } from '@/components/chat/OrderChat';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.131.57-.074 1.758-.706 2.006-1.388.248-.683.248-1.265.173-1.388-.075-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .01 5.393 0 12.03c0 2.123.54 4.197 1.57 6.05L0 24l6.15-1.612a11.81 11.81 0 005.89 1.568h.005c6.634 0 12.04-5.39 12.043-12.03a11.82 11.82 0 00-3.48-8.513z"/>
  </svg>
);

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
    // Añadir al repartidor a los participantes para permitir chat anticipado
    const orderRef = doc(firestore, 'orders', order.id);
    updateDocumentNonBlocking(orderRef, {
      participants: arrayUnion(user.uid),
      updatedAt: serverTimestamp()
    });
    setIsChatOpen(true);
  };

  const formattedPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(order.totalPrice || 0);

  return (
    <Card className="border-none rounded-[48px] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] bg-white overflow-hidden ring-1 ring-black/[0.03] group hover:shadow-2xl transition-all duration-700">
      <CardContent className="p-0">
        {/* BANNER DE ESTADO */}
        <div className="h-12 px-8 flex items-center justify-between gap-2 text-white bg-gradient-to-r from-green-500 to-emerald-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">RADAR ACTIVO</span>
          </div>
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest italic">Protocolo #{order.id.slice(-6).toUpperCase()}</span>
        </div>

        <div className="p-8 space-y-8">
          {/* ENCABEZADO DE VALOR Y TIEMPO - VALOR ROJO GIGANTE */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-600">
                <Wallet className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">GANANCIA BRUTA</span>
              </div>
              <h2 className="text-6xl sm:text-7xl font-black italic tracking-tighter text-red-600 leading-none drop-shadow-sm">
                {formattedPrice}
              </h2>
            </div>
            
            {/* BADGE DE TIEMPO COMPACTADO */}
            <div className="text-right flex flex-col items-end gap-2">
              <div className="bg-slate-900 text-white p-3 rounded-[20px] shadow-2xl flex flex-col items-center justify-center min-w-[80px] border-b-4 border-slate-950 group-hover:scale-105 transition-transform duration-500">
                <span className="text-xl font-black italic tracking-tighter leading-none text-primary">{order.requestHours}H</span>
                <span className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-60">MISIÓN</span>
              </div>
              <Badge className="bg-primary/10 text-primary border-none text-[7px] font-black uppercase px-2 italic">
                {order.washerType === 'automatica' ? 'Auto' : 'Semi'}
              </Badge>
            </div>
          </div>

          {/* TARJETA DE IDENTIDAD Y LOGÍSTICA */}
          <div className="bg-slate-50 p-7 rounded-[40px] border border-slate-100 flex flex-col gap-6 shadow-inner">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0 border border-slate-50 relative">
                <MapPin className="w-6 h-6 text-primary" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle2 className="w-2 h-2 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.customerName || 'Cliente de Aguachica'}</span>
                </div>
                <p className="text-lg font-black text-slate-800 leading-tight uppercase italic tracking-tighter line-clamp-2">
                  {order.customerAddress}
                </p>
              </div>
            </div>

            {/* GRID TÉCNICO */}
            <div className="grid grid-cols-3 gap-4 border-t border-slate-200/50 pt-5">
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/50 border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><ArrowUpCircle className="w-4 h-4" /></div>
                <div className="text-center">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Piso</p>
                  <p className="text-xs font-black text-slate-700 leading-none">{order.floor || '1'}</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/50 border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"><Activity className="w-4 h-4" /></div>
                <div className="text-center">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Distancia</p>
                  <p className="text-xs font-black text-slate-700 leading-none">2.4 KM</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/50 border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><Clock className="w-4 h-4" /></div>
                <div className="text-center">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Tiempo</p>
                  <p className="text-xs font-black text-slate-700 leading-none">~15 min</p>
                </div>
              </div>
            </div>
          </div>

          {/* BOTONERA DE ACCIONES - AGREGADOS WHATSAPP Y CHAT */}
          <div className="grid grid-cols-5 gap-2">
            <a href={`tel:${order.customerPhone}`} className="w-full">
              <Button variant="outline" className="w-full h-12 rounded-xl border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-primary transition-all active:scale-95 shadow-sm">
                <Phone className="w-4 h-4" />
              </Button>
            </a>
            <Button 
              onClick={() => window.open(`https://wa.me/57${order.customerPhone?.replace(/\D/g, '')}`, '_blank')}
              variant="outline" 
              className="w-full h-12 rounded-xl border-slate-100 text-[#25d366] hover:bg-[#25d366]/5 transition-all active:scale-95 shadow-sm"
            >
              <WhatsAppIcon className="w-5 h-5" />
            </Button>
            <Button 
              onClick={handleOpenChat}
              variant="outline" 
              className="w-full h-12 rounded-xl border-slate-100 text-primary hover:bg-primary/5 transition-all active:scale-95 shadow-sm"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.customerAddress)}`, '_blank')}
              className="w-full h-12 rounded-xl border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-primary transition-all active:scale-95 shadow-sm"
            >
              <Navigation className="w-4 h-4" />
            </Button>
            <Button onClick={() => setIsOfferDialogOpen(true)} variant="outline" className="w-full h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-black text-[8px] uppercase tracking-widest shadow-sm transition-all active:scale-95 leading-none px-1">
              TRATO
            </Button>
          </div>

          <Button onClick={onAccept} className="w-full h-20 rounded-[32px] bg-primary text-white font-black text-base sm:text-lg uppercase italic tracking-[0.15em] gap-4 shadow-[0_20px_60px_rgba(59,130,246,0.4)] border-b-[8px] border-blue-800 active:border-b-0 active:translate-y-2 transition-all group">
            ACEPTAR ESTA RUTA <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </Button>
          
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
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"><DollarSign className="w-8 h-8 text-primary" /></div>
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
