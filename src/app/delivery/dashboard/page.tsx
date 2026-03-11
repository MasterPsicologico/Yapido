
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Clock, 
  Loader2,
  Inbox,
  ArrowRight
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DeliveryDashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState("available");

  // Consulta para pedidos disponibles (Listos para recoger y sin repartidor)
  const availableOrdersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'orders'),
      where('status', '==', 'ready_for_pickup'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  // Consulta para pedidos aceptados por el repartidor actual
  const myDeliveriesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'orders'),
      where('deliveryDriverId', '==', user.uid),
      where('status', 'in', ['shipped']),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user?.uid]);

  const { data: availableOrders, isLoading: loadingAvailable } = useCollection(availableOrdersQuery);
  const { data: myDeliveries, isLoading: loadingMy } = useCollection(myDeliveriesQuery);

  const handleAcceptOrder = (orderId: string) => {
    if (!firestore || !user) return;
    const orderRef = doc(firestore, 'orders', orderId);
    
    updateDocumentNonBlocking(orderRef, {
      deliveryDriverId: user.uid,
      deliveryDriverName: user.displayName || 'Repartidor Vitriniando',
      status: 'shipped', // Cambia a "Enviado/En camino"
    });

    toast({
      title: "Pedido Aceptado",
      description: "¡En camino a recoger el paquete!",
    });
    setActiveTab("my-deliveries");
  };

  const handleCompleteDelivery = (orderId: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    
    updateDocumentNonBlocking(orderRef, {
      status: 'delivered',
    });

    toast({
      title: "¡Entrega Exitosa!",
      description: "Buen trabajo, el pedido ha sido entregado.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-secondary rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-secondary/20">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Despacho Logístico</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Control de entregas en tiempo real</p>
          </div>
        </div>

        <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border-none h-14 p-1 rounded-full shadow-sm w-full sm:w-auto">
            <TabsTrigger value="available" className="rounded-full h-12 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
              Disponibles ({availableOrders?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="my-deliveries" className="rounded-full h-12 px-8 font-black text-xs uppercase tracking-widest data-[state=active]:bg-secondary data-[state=active]:text-white">
              Mis Entregas ({myDeliveries?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            {loadingAvailable ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Buscando rutas...</p>
              </div>
            ) : availableOrders && availableOrders.length > 0 ? (
              <div className="grid gap-4">
                {availableOrders.map(order => (
                  <Card key={order.id} className="border-none rounded-[28px] shadow-sm overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500 text-white rounded-full text-[9px] font-black uppercase tracking-tighter border-none">
                            <Package className="w-3 h-3 mr-1" /> Listo para despacho
                          </Badge>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">#{order.id.slice(-6)}</span>
                        </div>
                        <h3 className="text-xl font-black italic text-slate-900 tracking-tighter leading-none">{order.productName}</h3>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                            <MapPin className="w-3.5 h-3.5" /> {order.storeName}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Pedido realizado hace {order.createdAt ? format(order.createdAt.toDate(), "HH:mm") : 'un momento'}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleAcceptOrder(order.id)}
                        className="rounded-full h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest gap-2 w-full sm:w-auto"
                      >
                        Aceptar Ruta <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                <Inbox className="w-16 h-16 mx-auto text-slate-100 mb-4" />
                <h3 className="text-xl font-black text-slate-300 italic uppercase">Sin rutas disponibles</h3>
                <p className="text-slate-400 text-xs font-medium mt-2">Vuelve a revisar en unos minutos para nuevas entregas.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-deliveries">
            {myDeliveries && myDeliveries.length > 0 ? (
              <div className="grid gap-6">
                {myDeliveries.map(order => (
                  <Card key={order.id} className="border-none rounded-[32px] shadow-lg overflow-hidden bg-white">
                    <div className="bg-secondary p-4 flex items-center justify-between text-white">
                       <div className="flex items-center gap-2">
                          <Navigation className="w-5 h-5 animate-pulse" />
                          <span className="text-xs font-black uppercase tracking-widest italic">Ruta en curso</span>
                       </div>
                       <Badge className="bg-white/20 text-white border-none rounded-full px-4 h-7 text-[10px] font-black italic uppercase">
                          {order.storeName}
                       </Badge>
                    </div>
                    <CardContent className="p-8 space-y-6">
                      <div className="flex justify-between items-start">
                         <div>
                            <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter leading-none">{order.productName}</h3>
                            <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">Cliente: <span className="text-primary">{order.customerName}</span></p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total a cobrar</p>
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">
                               {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice)}
                            </span>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button className="rounded-full h-14 bg-[#25d366] hover:bg-[#128c7e] text-white font-black text-sm uppercase tracking-widest gap-2 shadow-xl shadow-green-200 border-none">
                           <MessageCircle className="w-5 h-5" /> Chat Cliente
                        </Button>
                        <Button 
                          onClick={() => handleCompleteDelivery(order.id)}
                          className="rounded-full h-14 bg-secondary hover:bg-secondary/90 text-white font-black text-sm uppercase tracking-widest gap-2 shadow-xl shadow-secondary/20"
                        >
                           <CheckCircle2 className="w-5 h-5" /> Finalizar Entrega
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                <Truck className="w-16 h-16 mx-auto text-slate-100 mb-4" />
                <h3 className="text-xl font-black text-slate-300 italic uppercase">No tienes entregas activas</h3>
                <p className="text-slate-400 text-xs font-medium mt-2">Acepta una ruta del panel de disponibles para comenzar.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
