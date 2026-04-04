
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, Radar, Store as StoreIcon, MessageCircle, Phone, 
  CheckCircle2, XCircle, Clock, Wallet, ShieldCheck, Sparkles,
  Package, Truck, ArrowRight, Settings
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, useUser } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function WasherWaitingRoom() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Listener de la Orden
  const orderRef = useMemoFirebase(() => (!firestore || !id || !user) ? null : doc(firestore, 'orders', id), [firestore, id, user]);
  const { data: order, isLoading: loadingOrder } = useDoc(orderRef);

  // Listener de Ofertas
  const offersQuery = useMemoFirebase(() => {
    if (!firestore || !id || !user) return null;
    return query(collection(firestore, 'orders', id, 'offers'), orderBy('createdAt', 'desc'));
  }, [firestore, id, user]);
  const { data: offers } = useCollection(offersQuery);

  // LÓGICA DE TIEMPO PERSISTENTE EN LA NUBE
  useEffect(() => {
    if (!order?.createdAt) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const created = order.createdAt.toMillis();
      const diffInSeconds = Math.floor((now - created) / 1000);
      const remaining = Math.max(0, 300 - diffInSeconds); // 5 minutos (300s)
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order?.createdAt]);

  const handleAcceptOffer = (offer: any) => {
    if (!firestore || !orderRef) return;
    
    // ASIGNACIÓN MAESTRA Y ACUERDO CERRADO
    updateDocumentNonBlocking(orderRef, {
      status: 'shipped',
      deliveryDriverId: offer.driverId,
      deliveryDriverName: offer.driverName,
      storeId: offer.storeId,
      storeName: offer.storeName,
      totalPrice: offer.price,
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      participants: arrayUnion(offer.driverId, offer.storeOwnerId || 'SYSTEM'),
      isLogisticsPublic: false
    });

    // Guardar en historial de proveedores del usuario
    if (user?.uid) {
      const userRef = doc(firestore, 'users', user.uid);
      updateDocumentNonBlocking(userRef, {
        contractedStores: arrayUnion(offer.storeId),
        lastContractedStore: offer.storeId
      });
    }

    toast({ title: "¡Trato Cerrado!", className: "bg-green-600 text-white" });
  };

  if (loadingOrder) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Sincronizando Radar...</p>
      </div>
    </div>
  );

  const isAssigned = order?.status === 'shipped' || order?.status === 'delivered';
  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 5;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl space-y-10">
        {/* CRONÓMETRO MAESTRO VISIBLE */}
        <header className="text-center space-y-6">
          <div className="flex justify-center">
            <div className={cn(
              "relative p-8 rounded-[48px] bg-slate-900 text-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-b-8 border-slate-950 transition-all duration-500",
              isAssigned ? "bg-green-600 border-green-800" : (timeLeft && timeLeft < 60) ? "bg-red-600 border-red-800" : ""
            )}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full font-black text-[8px] uppercase tracking-[0.3em]">
                {isAssigned ? "SISTEMA VINCULADO" : "TIEMPO DE RESPUESTA"}
              </div>
              <div className="flex items-center gap-6">
                <Clock className={cn("w-10 h-10", isAssigned ? "text-white" : "text-primary animate-pulse")} />
                <span className="text-6xl font-black italic tracking-tighter tabular-nums">
                  {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                </span>
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-4">
                {isAssigned ? "REPARTIDOR EN CAMINO" : "RECIBIRÁS UNA CONFIRMACIÓN AL FINALIZAR"}
              </p>
            </div>
          </div>
        </header>

        {/* TARJETA DE ESTADO DINÁMICA (ALISTAMIENTO -> EN RUTA) */}
        <section className="animate-in slide-in-from-bottom-4 duration-700">
          <Card className={cn(
            "border-none rounded-[48px] shadow-2xl overflow-hidden ring-1",
            isAssigned ? "bg-slate-900 text-white ring-green-500/20" : "bg-white ring-black/[0.03]"
          )}>
            <CardContent className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors",
                    isAssigned ? "bg-green-500 text-white" : "bg-primary/10 text-primary"
                  )}>
                    {isAssigned ? <Truck className="w-8 h-8" /> : <Package className="w-8 h-8 animate-bounce" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                      {isAssigned ? "¡PEDIDO EN RUTA!" : "PROCESO DE ALISTAMIENTO"}
                    </h3>
                    <p className={cn("text-[10px] font-bold uppercase tracking-widest", isAssigned ? "text-green-400" : "text-slate-400")}>
                      {isAssigned ? "TU CONTRATO HA SIDO FORMALIZADO" : "DESPACHANDO TU LAVADORA ÉLITE"}
                    </p>
                  </div>
                </div>
                {isAssigned && <Badge className="bg-green-500 text-white animate-pulse">ACTIVO</Badge>}
              </div>

              <div className={cn("p-6 rounded-[32px] border-2 border-dashed space-y-4", isAssigned ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100")}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-400">Equipo</span>
                  <span className="font-bold uppercase italic text-sm">{order?.washerType || 'Lavadora'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-400">Destino</span>
                  <span className="font-bold text-sm truncate max-w-[180px]">{order?.customerAddress}</span>
                </div>
                {isAssigned && (
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><StoreIcon className="w-4 h-4 text-primary" /></div>
                      <span className="font-black text-sm uppercase italic">{order?.storeName}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="text-primary"><MessageCircle className="w-5 h-5" /></Button>
                  </div>
                )}
              </div>

              {isAssigned && (
                <Button onClick={() => router.push('/admin/orders')} className="w-full h-16 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest gap-3 shadow-xl active:scale-95 transition-all">
                  IR AL PANEL DE SEGUIMIENTO <ArrowRight className="w-5 h-5" />
                </Button>
              )}
            </CardContent>
          </Card>
        </section>

        {/* SECCIÓN DE CONTRAOFERTAS (SOLO SI NO ESTÁ ASIGNADO) */}
        {!isAssigned && (
          <section className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 italic">Radar de Ofertas ({offers?.length || 0})</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">VIVO</span>
              </div>
            </div>

            {offers && offers.length > 0 ? (
              <div className="grid gap-6">
                {offers.map((offer) => (
                  <Card key={offer.id} className="border-none rounded-[40px] bg-white shadow-xl overflow-hidden ring-1 ring-black/[0.03] animate-in slide-in-from-right-4">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><StoreIcon className="w-6 h-6" /></div>
                          <div>
                            <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{offer.storeName}</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Propuesta recibida</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-primary italic">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.price)}
                          </span>
                        </div>
                      </div>
                      <Button onClick={() => handleAcceptOffer(offer)} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest">ACEPTAR ESTE TRATO</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
                <Loader2 className="w-10 h-10 animate-spin text-slate-200 mx-auto mb-4" />
                <p className="text-slate-300 font-black uppercase tracking-widest italic text-xs">Sincronizando con alquileres cercanos...</p>
              </div>
            )}
          </section>
        )}

        {timeLeft === 0 && !isAssigned && (
          <div className="text-center space-y-4 animate-in fade-in">
            <div className="p-6 rounded-[32px] bg-amber-50 border border-amber-100 flex items-center gap-4 text-left">
              <ShieldCheck className="w-8 h-8 text-amber-500 shrink-0" />
              <p className="text-xs font-bold text-amber-700 uppercase leading-relaxed">
                Aún nos encontramos en el proceso para asignarle una lavadora. El radar sigue activo buscando la mejor opción.
              </p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full h-12 px-8 font-black uppercase text-[10px] tracking-widest border-slate-200">REINTENTAR BÚSQUEDA</Button>
          </div>
        )}
      </main>
    </div>
  );
}
