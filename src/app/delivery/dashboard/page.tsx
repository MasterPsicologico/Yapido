
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
  Timer
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DeliveryDashboardPage() {
  const { user } = useUser();
  const { profile, isLoading: loadingProfile } = useProfile();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState("available");

  const isConfirmedRepartidor = profile?.role === 'repartidor';

  const availableOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !isConfirmedRepartidor) return null;
    return query(
      collection(firestore, 'orders'),
      where('status', '==', 'ready_for_pickup'),
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
    updateDocumentNonBlocking(orderRef, { deliveryDriverId: user.uid, deliveryDriverName: user.displayName || 'Repartidor', status: 'shipped', updatedAt: serverTimestamp() });
    toast({ title: "Pedido Aceptado", description: "¡En camino a recoger el paquete!" });
    setActiveTab("my-deliveries");
  };

  const handleCompleteDelivery = (orderId: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { status: 'delivered', updatedAt: serverTimestamp() });
    toast({ title: "¡Entrega Exitosa!", description: "Buen trabajo." });
  };

  if (loadingProfile) {
    return <div className="flex flex-col min-h-screen bg-slate-50"><Navbar /><div className="flex-1 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div></div>;
  }

  if (!isConfirmedRepartidor) {
    return <div className="flex flex-col min-h-screen bg-slate-50"><Navbar /><div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4"><Truck className="w-10 h-10 text-slate-200" /><h2 className="text-2xl font-black italic uppercase">Acceso Restringido</h2><Button variant="default" className="rounded-full" onClick={() => window.location.href = '/delivery/register'}>Ir a Registro</Button></div></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-secondary rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-secondary/20"><Truck className="w-7 h-7" /></div>
          <div><h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Despacho Logístico</h1><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Control de entregas en tiempo real</p></div>
        </div>

        <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border-none h-14 p-1 rounded-full shadow-sm w-full sm:w-auto">
            <TabsTrigger value="available" className="rounded-full h-12 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Disponibles ({availableOrders?.length || 0})</TabsTrigger>
            <TabsTrigger value="my-deliveries" className="rounded-full h-12 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-secondary data-[state=active]:text-white">Mis Entregas ({myDeliveries?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            {loadingAvailable ? <div className="flex flex-col items-center py-20 gap-4"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : availableOrders && availableOrders.length > 0 ? (
              <div className="grid gap-4">
                {availableOrders.map(order => (
                  <Card key={order.id} className="border-none rounded-[28px] shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <Badge className="bg-indigo-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest border-none"><Zap className="w-3 h-3 mr-1" /> Alerta de Despacho</Badge>
                        <h3 className="text-xl font-black italic text-slate-900 tracking-tighter">{order.productName}</h3>
                        <div className="flex flex-col gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <div className="flex items-center gap-1.5 text-primary"><MapPin className="w-3.5 h-3.5" /> {order.storeName}</div>
                          <div className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" /> Pedido hace: {differenceInMinutes(new Date(), order.createdAt.toDate())} min</div>
                        </div>
                      </div>
                      <Button onClick={() => handleAcceptOrder(order.id)} className="rounded-full h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-primary/20">Aceptar Ruta <ArrowRight className="w-4 h-4" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100"><Inbox className="w-16 h-16 mx-auto text-slate-100 mb-4" /><h3 className="text-xl font-black text-slate-300 italic uppercase">Sin rutas disponibles</h3></div>}
          </TabsContent>

          <TabsContent value="my-deliveries">
            {myDeliveries && myDeliveries.length > 0 ? (
              <div className="grid gap-6">
                {myDeliveries.map(order => (
                  <Card key={order.id} className="border-none rounded-[32px] shadow-lg overflow-hidden bg-white">
                    <div className="bg-secondary p-4 flex items-center justify-between text-white">
                       <div className="flex items-center gap-2"><Navigation className="w-5 h-5 animate-pulse" /><span className="text-xs font-black uppercase tracking-widest italic">Ruta en curso</span></div>
                       <Badge className="bg-white/20 text-white border-none rounded-full px-4 h-7 text-[10px] font-black italic uppercase">{order.storeName}</Badge>
                    </div>
                    <CardContent className="p-8 space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                         <div><h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">{order.productName}</h3><p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">Cliente: <span className="text-primary">{order.customerName}</span></p></div>
                         <div className="text-left sm:text-right"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total a cobrar</p><span className="text-2xl font-black text-slate-900 tracking-tighter">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice)}</span></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button className="rounded-full h-14 bg-[#25d366] hover:bg-[#128c7e] text-white font-black text-sm uppercase tracking-widest gap-2 shadow-xl shadow-green-200 border-none"><MessageCircle className="w-5 h-5" /> Chat Cliente</Button>
                        <Button onClick={() => handleCompleteDelivery(order.id)} className="rounded-full h-14 bg-secondary hover:bg-secondary/90 text-white font-black text-sm uppercase tracking-widest gap-2 shadow-xl shadow-secondary/20"><CheckCircle2 className="w-5 h-5" /> Finalizar Entrega</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100"><Truck className="w-16 h-16 mx-auto text-slate-100 mb-4" /><h3 className="text-xl font-black text-slate-300 italic uppercase">Sin entregas activas</h3></div>}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
