
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Package, 
  MessageCircle, 
  Loader2,
  Inbox,
  ArrowRight,
  Zap,
  Timer,
  Clock
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, orderBy, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DeliveryDashboardPage() {
  const { user } = useUser();
  const { profile, isLoading: loadingProfile } = useProfile();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState("available");

  const isConfirmedRepartidor = profile?.role === 'repartidor' || profile?.role === 'admin';

  // CONSULTA LOGÍSTICA: Incluye el filtro 'isLogisticsPublic' para satisfacer las reglas de Firestore
  const availableOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !isConfirmedRepartidor) return null;
    return query(
      collection(firestore, 'orders'),
      where('isLogisticsPublic', '==', true),
      where('status', 'in', ['preparing', 'ready_for_pickup']),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, isConfirmedRepartidor]);

  const myDeliveriesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isConfirmedRepartidor) return null;
    return query(
      collection(firestore, 'orders'),
      where('deliveryDriverId', '==', user.uid),
      where('status', '==', 'shipped'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user?.uid, isConfirmedRepartidor]);

  const { data: availableOrders, isLoading: loadingAvailable } = useCollection(availableOrdersQuery);
  const { data: myDeliveries, isLoading: loadingMy } = useCollection(myDeliveriesQuery);

  const handleAcceptOrder = (orderId: string) => {
    if (!firestore || !user) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      deliveryDriverId: user.uid, 
      deliveryDriverName: profile?.displayName || user.displayName || 'Repartidor', 
      status: 'shipped', 
      updatedAt: serverTimestamp(),
      // Al aceptar, el repartidor se une legalmente al pedido
      participants: arrayUnion(user.uid)
    });
    toast({ title: "Ruta Aceptada", description: "¡Dirígete a la tienda ahora!" });
    setActiveTab("my-deliveries");
  };

  const handleCompleteDelivery = (orderId: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { status: 'delivered', updatedAt: serverTimestamp() });
    toast({ title: "¡Entrega Confirmada!", description: "Misión cumplida." });
  };

  if (loadingProfile) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-secondary" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary/60">Logística en Línea</p>
        </div>
      </div>
    );
  }

  if (!isConfirmedRepartidor) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-100">
            <Truck className="w-12 h-12 text-slate-200" />
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Acceso Restringido</h2>
          <p className="text-slate-400 max-w-sm font-medium">Debes registrarte como repartidor oficial para acceder a esta consola.</p>
          <Button onClick={() => window.location.href = '/delivery/register'} className="rounded-full h-14 px-10 text-lg font-black bg-secondary">
            Unirme al Equipo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 bg-secondary rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-secondary/20 border-b-4 border-black/10">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Despacho Central</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Operativo en Aguachica</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border h-16 p-1.5 rounded-full shadow-sm w-full sm:w-auto">
            <TabsTrigger value="available" className="rounded-full h-13 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              Rutas Libres ({availableOrders?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="my-deliveries" className="rounded-full h-13 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-secondary data-[state=active]:text-white transition-all">
              Mis Viajes ({myDeliveries?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="animate-in fade-in duration-500">
            {loadingAvailable ? (
              <div className="flex flex-col items-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : availableOrders && availableOrders.length > 0 ? (
              <div className="grid gap-5">
                {availableOrders.map(order => {
                  const minutesAgo = order.createdAt ? differenceInMinutes(new Date(), order.createdAt.toDate()) : 0;
                  const isReady = order.status === 'ready_for_pickup';
                  
                  return (
                    <Card key={order.id} className="border-none rounded-[32px] shadow-sm bg-white overflow-hidden border border-slate-100 group hover:shadow-xl transition-all">
                      <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-8">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={cn(
                              "rounded-full text-[9px] font-black uppercase tracking-widest border-none px-3",
                              isReady ? "bg-green-500 text-white" : "bg-indigo-500 text-white"
                            )}>
                              <Zap className="w-3 h-3 mr-1.5" /> 
                              {isReady ? "PEDIDO LISTO" : "EN PREPARACIÓN (ALERTA)"}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-300">ID: #{order.id.slice(-6)}</span>
                          </div>
                          
                          <h3 className="text-2xl font-black italic text-slate-900 tracking-tighter leading-none">{order.productName}</h3>
                          
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-primary">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="text-xs font-black uppercase tracking-widest">{order.storeName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                              <Clock className="w-4 h-4 shrink-0" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Solicitado hace: {minutesAgo} min</span>
                            </div>
                          </div>
                        </div>
                        <Button onClick={() => handleAcceptOrder(order.id)} className="w-full sm:w-auto rounded-full h-14 px-10 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-2xl transition-all active:scale-95">
                          Aceptar Ruta <ArrowRight className="w-5 h-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
                <Inbox className="w-20 h-20 mx-auto text-slate-100 mb-6" />
                <h3 className="text-2xl font-black text-slate-300 italic uppercase tracking-tighter">Sin rutas activas</h3>
                <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mt-2">Mantente alerta, morrocoy</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-deliveries" className="animate-in slide-in-from-bottom-4 duration-500">
            {myDeliveries && myDeliveries.length > 0 ? (
              <div className="grid gap-8">
                {myDeliveries.map(order => (
                  <Card key={order.id} className="border-none rounded-[40px] shadow-2xl overflow-hidden bg-white ring-1 ring-black/5">
                    <div className="bg-secondary p-5 flex items-center justify-between text-white border-b border-white/10">
                       <div className="flex items-center gap-3">
                          <Navigation className="w-6 h-6 animate-pulse" />
                          <span className="text-xs font-black uppercase tracking-[0.2em] italic">Ruta en curso</span>
                       </div>
                       <Badge className="bg-white/20 text-white border-none rounded-full px-4 h-8 text-[10px] font-black italic uppercase">{order.storeName}</Badge>
                    </div>
                    <CardContent className="p-10 space-y-8">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                         <div className="space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">{order.productName}</h3>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Entregar a: <span className="text-primary font-black">{order.customerName}</span></p>
                         </div>
                         <div className="text-left sm:text-right bg-slate-50 p-4 rounded-3xl min-w-[180px]">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Cobro COP</p>
                            <span className="text-3xl font-black text-slate-900 tracking-tighter">
                              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice)}
                            </span>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button className="rounded-full h-16 bg-[#25d366] hover:bg-[#128c7e] text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-green-100 border-none transition-transform active:scale-95">
                          <MessageCircle className="w-6 h-6" /> WhatsApp Cliente
                        </Button>
                        <Button onClick={() => handleCompleteDelivery(order.id)} className="rounded-full h-16 bg-secondary hover:bg-secondary/90 text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-secondary/20 transition-transform active:scale-95">
                          <CheckCircle2 className="w-6 h-6" /> Finalizar Entrega
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
                <Truck className="w-20 h-20 mx-auto text-slate-100 mb-6" />
                <h3 className="text-2xl font-black text-slate-300 italic uppercase tracking-tighter">Sin viajes en curso</h3>
                <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mt-2">Acepta una ruta para empezar</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
