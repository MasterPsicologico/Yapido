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
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

interface WasherRouteCardProps {
  order: any;
  onAccept: () => void;
}

export function WasherRouteCard({ order, onAccept }: WasherRouteCardProps) {
  const firestore = useFirestore();
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
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
        driverId: order.deliveryDriverId || 'SYSTEM_DRIVER',
        driverName: order.deliveryDriverName || 'Repartidor',
        driverPhone: '3000000000', // En producción sería el real
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

  const formattedPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(order.totalPrice || 0);

  return (
    <Card className="border-none rounded-[48px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] bg-white overflow-hidden ring-1 ring-black/[0.03] group hover:shadow-2xl transition-all duration-500">
      <CardContent className="p-0">
        <div className="h-10 px-8 flex items-center justify-between gap-2 text-white bg-green-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">DISPONIBLE</span>
          </div>
          <span className="text-[8px] font-bold text-white/60">ID: {order.id.slice(-6).toUpperCase()}</span>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <Wallet className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">VALOR ESTIMADO</span>
              </div>
              <h2 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">{formattedPrice}</h2>
            </div>
            <div className="text-right">
              <Badge className="bg-slate-900 text-white border-none font-black text-sm italic uppercase px-4 h-10 rounded-2xl shadow-xl">
                {order.productName || 'Lavadora'}
              </Badge>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col gap-6">
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0 border border-slate-50">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Punto de Entrega</p>
                <p className="text-sm font-bold text-slate-700 leading-snug">{order.customerAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-200/50 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm"><ArrowUpCircle className="w-4 h-4" /></div>
                <div><p className="text-[8px] font-black text-slate-400 uppercase">Piso</p><p className="text-sm font-black text-slate-700 leading-none">{order.floor || '1'}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm"><Clock className="w-4 h-4" /></div>
                <div><p className="text-[8px] font-black text-slate-400 uppercase">Tiempo Est.</p><p className="text-sm font-black text-slate-700 leading-none">35 min</p></div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <a href={`tel:${order.customerPhone}`} className="flex-1"><Button variant="outline" className="w-full h-12 rounded-2xl border-slate-100 text-slate-400 hover:bg-slate-50"><Phone className="w-4 h-4" /></Button></a>
            <Button variant="outline" className="flex-1 h-12 rounded-2xl border-slate-100 text-slate-400 hover:bg-slate-50"><MessageCircle className="w-4 h-4" /></Button>
            <Button onClick={() => setIsOfferDialogOpen(true)} variant="outline" className="flex-1 h-12 rounded-2xl border-primary/20 text-primary hover:bg-primary/5 font-black text-[9px] uppercase tracking-widest">CONTRAOFERTA</Button>
          </div>

          <Button onClick={onAccept} className="w-full h-20 rounded-[32px] bg-primary text-white font-black text-xl uppercase italic tracking-widest gap-4 shadow-[0_20px_50px_rgba(59,130,246,0.3)] border-b-[8px] border-blue-800 active:border-b-0 active:translate-y-2 transition-all">
            ACEPTAR RUTA <ArrowRight className="w-6 h-6" />
          </Button>
        </div>
      </CardContent>

      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px]">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"><DollarSign className="w-8 h-8 text-primary" /></div>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Enviar Contraoferta</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">Propón un nuevo precio para este servicio.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Precio Propuesto (COP)</Label>
              <Input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-black text-2xl px-6 text-center" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Comentario para el cliente</Label>
              <Textarea value={offerComment} onChange={(e) => setOfferComment(e.target.value)} placeholder="Ej: Llego en 10 min, te la dejo hasta mañana..." className="rounded-2xl bg-slate-50 border-none min-h-[100px]" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSendOffer} disabled={isSendingOffer || !offerPrice} className="w-full h-16 rounded-[24px] bg-slate-900 text-white font-black uppercase tracking-widest gap-3 shadow-xl">
              {isSendingOffer ? <Loader2 className="animate-spin" /> : "ENVIAR PROPUESTA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}