"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, Radar, Store as StoreIcon, MessageCircle, Phone, 
  CheckCircle2, XCircle, Clock, Wallet, ShieldCheck, Sparkles
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
  
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutos

  // Listeners de la Orden y Ofertas (BLINDADOS CON EL USUARIO PARA EVITAR ERROR DE PERMISOS)
  const orderRef = useMemoFirebase(() => (!firestore || !id || !user) ? null : doc(firestore, 'orders', id), [firestore, id, user]);
  const { data: order, isLoading: loadingOrder } = useDoc(orderRef);

  const offersQuery = useMemoFirebase(() => {
    if (!firestore || !id || !user) return null;
    return query(collection(firestore, 'orders', id, 'offers'), orderBy('createdAt', 'desc'));
  }, [firestore, id, user]);
  const { data: offers } = useCollection(offersQuery);

  // Redirección si la orden ya fue asignada
  useEffect(() => {
    if (order && order.deliveryDriverId && order.status !== 'pending') {
      toast({ title: "¡Lavadora en camino!", description: "Un repartidor ha tomado tu ruta." });
      router.push('/admin/orders');
    }
  }, [order, router]);

  // Temporizador de 5 minutos
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAcceptOffer = (offer: any) => {
    if (!firestore || !orderRef) return;
    
    // ASIGNACIÓN MAESTRA Y ACUERDO CERRADO
    updateDocumentNonBlocking(orderRef, {
      status: 'shipped',
      deliveryDriverId: offer.driverId,
      deliveryDriverName: offer.driverName,
      storeId: offer.storeId,
      storeName: offer.storeName,
      totalPrice: offer.price, // Precio de la contraoferta
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      participants: arrayUnion(offer.driverId, offer.storeOwnerId || 'SYSTEM'),
      isLogisticsPublic: false // Ya no es pública, tiene dueño
    });

    toast({ title: "¡Trato Cerrado!", className: "bg-green-600 text-white" });
    router.push('/admin/orders');
  };

  if (loadingOrder) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Sincronizando Radar...</p>
      </div>
    </div>
  );

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <header className="text-center space-y-6 mb-12">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping [animation-duration:3s]" />
            <div className="relative w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center shadow-2xl">
              <Radar className="w-12 h-12 text-primary animate-spin-slow" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Sala de Espera</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Buscando tu lavadora élite</p>
          </div>

          <div className="flex justify-center">
            <div className="bg-white border shadow-sm px-6 py-2 rounded-full flex items-center gap-3">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-mono font-bold text-slate-700">{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
              {timeRemaining === 0 && <Badge variant="destructive" className="animate-pulse">TIMEOUT</Badge>}
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 italic">Ofertas en tiempo real ({offers?.length || 0})</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Radar Vivo</span>
            </div>
          </div>

          {offers && offers.length > 0 ? (
            <div className="grid gap-6">
              {offers.map((offer) => (
                <Card key={offer.id} className="border-none rounded-[40px] bg-white shadow-xl overflow-hidden ring-1 ring-black/[0.03] animate-in slide-in-from-right-4 duration-500">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                          <StoreIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{offer.storeName}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Oferta disponible ahora</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Propuesta</p>
                        <span className="text-2xl font-black text-primary italic tracking-tighter">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.price)}
                        </span>
                      </div>
                    </div>

                    {offer.comment && (
                      <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-primary italic text-xs font-bold text-slate-600">
                        "{offer.comment}"
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => handleAcceptOffer(offer)} className="h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">
                        ACEPTAR TRATO
                      </Button>
                      <div className="flex gap-2">
                        <a href={`tel:${offer.driverPhone || '3000000000'}`} className="flex-1"><Button variant="outline" className="w-full h-14 rounded-2xl border-slate-100 text-slate-400 hover:bg-slate-50"><Phone className="w-5 h-5" /></Button></a>
                        <Button variant="outline" className="flex-1 h-14 rounded-2xl border-slate-100 text-slate-400 hover:bg-slate-50"><MessageCircle className="w-5 h-5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-slate-200 mx-auto" />
              <p className="text-slate-300 font-black uppercase tracking-widest italic text-xs">Sincronizando con alquileres cercanos...</p>
            </div>
          )}
        </section>

        <footer className="mt-16 text-center space-y-6">
          {timeRemaining === 0 && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
              <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.3em]">Tiempo de búsqueda extendido</p>
              <Button onClick={() => window.location.reload()} className="h-14 rounded-full bg-primary text-white font-black px-10 gap-2">
                <Sparkles className="w-4 h-4" /> REFRESCAR RADAR
              </Button>
            </div>
          )}
          
          <Button onClick={() => router.push('/')} variant="ghost" className="text-slate-400 hover:text-red-500 font-black text-[10px] uppercase tracking-widest">
            <XCircle className="w-4 h-4 mr-2" /> Cancelar Solicitud
          </Button>
        </footer>
      </main>
    </div>
  );
}