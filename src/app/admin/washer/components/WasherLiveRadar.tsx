
"use client";

import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, where, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Radar, 
  Clock, 
  MapPin, 
  ArrowUpCircle, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  MessageCircle,
  Phone,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface WasherLiveRadarProps {
  storeId: string;
  storeName: string;
  ownerId: string;
}

export function WasherLiveRadar({ storeId, storeName, ownerId }: WasherLiveRadarProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  // Radar: Busca pedidos pendientes que sean públicos o específicos de esta tienda
  const radarQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'orders'),
      where('status', '==', 'pending'),
      where('isLogisticsPublic', '==', true)
    );
  }, [firestore]);

  const { data: requests, isLoading } = useCollection(radarQuery);

  const handleAcceptOrder = (order: any) => {
    if (!firestore || !user) return;
    
    const orderRef = doc(firestore, 'orders', order.id);
    
    // ACEPTACIÓN MAESTRA: Se vincula la tienda y se asigna el precio solicitado
    updateDocumentNonBlocking(orderRef, {
      status: 'shipped',
      storeId: storeId,
      storeName: storeName,
      storeOwnerId: ownerId,
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      participants: arrayUnion(ownerId),
      isLogisticsPublic: false // Sacar del radar público
    });

    toast({ 
      title: "¡Misión Aceptada!", 
      description: "El pedido se ha movido a tu log de operaciones.",
      className: "bg-green-600 text-white border-none"
    });
  };

  if (isLoading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radar className="w-5 h-5 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Radar de Solicitudes ({requests?.length || 0})</h3>
        </div>
        <Badge className="bg-green-50 text-green-600 border-none font-black text-[8px] px-3 animate-pulse">VIVO</Badge>
      </div>

      <div className="grid gap-6">
        {requests && requests.length > 0 ? requests.map((req) => (
          <Card key={req.id} className="border-none rounded-[40px] bg-white shadow-xl overflow-hidden ring-1 ring-black/[0.03] animate-in slide-in-from-right-4 duration-500 group">
            <div className="bg-slate-900 px-8 py-2 flex items-center justify-between">
              <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">NUEVA SOLICITUD EN AGUACHICA</span>
              <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">#{req.id.slice(-6).toUpperCase()}</span>
            </div>
            
            <CardContent className="p-8 space-y-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                    {req.customerName}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-primary" /> {req.customerAddress}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Oferta Base</p>
                  <span className="text-2xl font-black text-primary italic">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(req.totalPrice)}
                  </span>
                </div>
              </div>

              {/* DETALLES LOGÍSTICOS CRÍTICOS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-[28px] border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Tiempo</p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-black italic">{req.requestHours}h</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Equipo</p>
                  <span className="text-xs font-black italic uppercase text-slate-700">{req.washerType || 'Auto'}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Piso</p>
                  <div className="flex items-center gap-1.5">
                    <ArrowUpCircle className="w-3 h-3 text-primary" />
                    <span className="text-xs font-black italic">{req.floor || '1'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Escalas</p>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className={cn("w-3 h-3", req.hasStairs ? "text-amber-500" : "text-slate-300")} />
                    <span className="text-xs font-black italic">{req.hasStairs ? req.stairCount : '0'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => window.open(`tel:${req.customerPhone}`)} variant="outline" className="flex-1 h-12 rounded-2xl border-slate-100 text-slate-400 hover:bg-slate-50"><Phone className="w-4 h-4" /></Button>
                <Button onClick={() => window.open(`https://wa.me/57${req.customerPhone?.replace(/\D/g, '')}`)} variant="outline" className="flex-1 h-12 rounded-2xl border-slate-100 text-slate-400 hover:bg-slate-50"><Zap className="w-4 h-4 fill-green-500 text-green-500" /></Button>
                <Button onClick={() => handleAcceptOrder(req)} className="flex-[3] h-12 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-xl hover:bg-primary transition-all">
                  <CheckCircle2 className="w-4 h-4" /> ACEPTAR ESTE TRATO
                </Button>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
            <Radar className="w-12 h-12 mx-auto text-slate-100 mb-4 animate-spin-slow" />
            <p className="text-slate-300 font-black uppercase tracking-widest italic text-xs">Radar en silencio... Esperando pedidos</p>
          </div>
        )}
      </div>
    </div>
  );
}
