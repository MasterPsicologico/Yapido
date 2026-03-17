"use client";

import { useState, useMemo, useEffect } from 'react';
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
  Clock,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Map as MapIcon,
  CreditCard,
  History,
  Lock,
  RefreshCw,
  Store as StoreIcon
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function DeliveryDashboardPage() {
  const { user } = useUser();
  const { profile, isLoading: loadingProfile } = useProfile();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState("available");
  const [isOnline, setIsOnline] = useState(true);

  const isConfirmedRepartidor = profile?.role === 'repartidor' || profile?.role === 'admin';

  // CONSULTAS LOGÍSTICAS OPTIMIZADAS
  const availableOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !isConfirmedRepartidor || !isOnline) return null;
    return query(
      collection(firestore, 'orders'),
      where('isLogisticsPublic', '==', true),
      where('status', 'in', ['preparing', 'ready_for_pickup'])
    );
  }, [firestore, isConfirmedRepartidor, isOnline]);

  const myDeliveriesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isConfirmedRepartidor) return null;
    return query(
      collection(firestore, 'orders'),
      where('deliveryDriverId', '==', user.uid),
      where('status', 'in', ['shipped', 'at_store', 'delivered_to_driver'])
    );
  }, [firestore, user?.uid, isConfirmedRepartidor]);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isConfirmedRepartidor) return null;
    return query(
      collection(firestore, 'orders'),
      where('deliveryDriverId', '==', user.uid),
      where('status', '==', 'delivered')
    );
  }, [firestore, user?.uid, isConfirmedRepartidor]);

  const { data: rawAvailable, isLoading: loadingAvailable } = useCollection(availableOrdersQuery);
  const { data: rawMy, isLoading: loadingMy } = useCollection(myDeliveriesQuery);
  const { data: history } = useCollection(historyQuery);

  const availableOrders = useMemo(() => {
    if (!rawAvailable) return [];
    return [...rawAvailable].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  }, [rawAvailable]);

  const myDeliveries = useMemo(() => {
    if (!rawMy) return [];
    return [...rawMy].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  }, [rawMy]);

  // CÁLCULO FINANCIERO CAJA NEGRA ($1000/KM - 12.5% comisión)
  const calculateNetEarnings = (kms: number = 3) => {
    const gross = kms * 1000;
    const net = gross * (1 - 0.125);
    return Math.floor(net);
  };

  const handleAcceptOrder = (orderId: string) => {
    if (!firestore || !user) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      deliveryDriverId: user.uid, 
      deliveryDriverName: profile?.displayName || user.displayName || 'Repartidor', 
      status: 'shipped', 
      updatedAt: serverTimestamp(),
      participants: arrayUnion(user.uid),
      deliveryPhase: 'heading_to_store'
    });
    toast({ title: "Ruta Aceptada", description: "Dirígete a la tienda inmediatamente." });
    setActiveTab("my-deliveries");
  };

  const handleArriveAtStore = (orderId: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    // Generar código aleatorio de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    updateDocumentNonBlocking(orderRef, { 
      status: 'at_store', 
      deliveryCode: code,
      updatedAt: serverTimestamp() 
    });
    toast({ title: "¡Has llegado!", description: "Muestra tu código al vendedor." });
  };

  const handleCompleteDelivery = (orderId: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      status: 'delivered', 
      updatedAt: serverTimestamp(),
      earningsApplied: calculateNetEarnings()
    });
    toast({ title: "¡Misión Cumplida!", description: "Entrega finalizada con éxito." });
  };

  if (loadingProfile) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConfirmedRepartidor) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
          <Truck className="w-16 h-16 text-slate-200" />
          <h2 className="text-2xl font-black uppercase italic italic tracking-tighter">Acceso Restringido</h2>
          <p className="text-slate-400 max-w-xs">Debes estar verificado como repartidor.</p>
          <Button onClick={() => window.location.href = '/delivery/register'} className="rounded-full bg-secondary h-12 px-8">Registrarme</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <div className="bg-white border-b px-4 py-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-lg",
              isOnline ? "bg-green-500 text-white shadow-green-200" : "bg-slate-200 text-slate-400"
            )}>
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">
                {isOnline ? "OPERATIVO" : "FUERA DE TURNO"}
              </h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">REPARTIDOR VERIFICADO</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsOnline(!isOnline)}
            className={cn(
              "rounded-full h-12 px-8 font-black text-xs uppercase tracking-[0.2em] transition-all",
              isOnline ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-500 text-white hover:bg-green-600"
            )}
          >
            {isOnline ? "Cerrar Turno" : "Iniciar Turno"}
          </Button>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border h-16 p-1 rounded-full shadow-sm w-full grid grid-cols-4">
            <TabsTrigger value="available" className="rounded-full h-full font-black text-[10px] uppercase tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-white">LIBRES</TabsTrigger>
            <TabsTrigger value="my-deliveries" className="rounded-full h-full font-black text-[10px] uppercase tracking-tighter data-[state=active]:bg-secondary data-[state=active]:text-white">ACTIVAS</TabsTrigger>
            <TabsTrigger value="earnings" className="rounded-full h-full font-black text-[10px] uppercase tracking-tighter data-[state=active]:bg-slate-900 data-[state=active]:text-white">INGRESOS</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-full h-full font-black text-[10px] uppercase tracking-tighter data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">PERFIL</TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            {!isOnline ? (
              <div className="text-center py-20 bg-slate-50 rounded-[48px] border-2 border-dashed">
                <Lock className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                <h3 className="text-xl font-black text-slate-400 uppercase italic">Modo Desconectado</h3>
              </div>
            ) : availableOrders.length > 0 ? (
              <div className="grid gap-4">
                {availableOrders.map(order => (
                  <Card key={order.id} className="border-none rounded-[32px] shadow-sm bg-white p-6 flex flex-col sm:flex-row items-center justify-between gap-6 ring-1 ring-slate-100">
                    <div className="space-y-2 flex-1">
                      <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase px-3">RUTA PÚBLICA</Badge>
                      <h3 className="text-2xl font-black italic text-slate-900 tracking-tighter leading-none">{order.productName}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><StoreIcon className="w-3 h-3" /> {order.storeName}</p>
                    </div>
                    <Button onClick={() => handleAcceptOrder(order.id)} className="w-full sm:w-auto rounded-full h-14 px-10 bg-primary text-white font-black uppercase text-xs tracking-widest gap-2 shadow-2xl">
                      Aceptar Ruta <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-300 font-black uppercase tracking-[0.2em] italic">No hay rutas libres</div>
            )}
          </TabsContent>

          <TabsContent value="my-deliveries">
            {myDeliveries.length > 0 ? (
              <div className="grid gap-8">
                {myDeliveries.map(order => {
                  const isAtStore = order.status === 'at_store';
                  const isPickedUp = order.status === 'delivered_to_driver';
                  
                  return (
                    <Card key={order.id} className="border-none rounded-[40px] shadow-2xl overflow-hidden bg-white ring-1 ring-black/5">
                      <div className={cn("p-5 flex items-center justify-between text-white border-b", isPickedUp ? "bg-slate-900" : "bg-secondary")}>
                         <div className="flex items-center gap-3">
                            <Navigation className={cn("w-6 h-6", !isPickedUp && "animate-pulse")} />
                            <span className="text-xs font-black uppercase tracking-[0.2em] italic">
                              {isPickedUp ? "EN RUTA AL CLIENTE" : isAtStore ? "VALIDANDO EN TIENDA" : "RECOGER EN TIENDA"}
                            </span>
                         </div>
                         <Badge className="bg-white/20 text-white border-none rounded-full px-4 h-8 text-[10px] font-black italic uppercase">{order.storeName}</Badge>
                      </div>
                      
                      <CardContent className="p-10 space-y-10">
                        <div className="space-y-2">
                          <h3 className="text-[2.8rem] font-black text-slate-900 italic uppercase leading-[0.85] tracking-tighter">
                            {order.productName}
                          </h3>
                          <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest pt-2">
                            <MapPin className="w-4 h-4" /> 
                            {isPickedUp ? (order.customerAddress || 'Dirección de Cliente') : (order.storeAddress || 'Dirección de Tienda')}
                          </div>
                        </div>

                        {!isPickedUp ? (
                          <div className="space-y-4">
                            {!isAtStore ? (
                              <>
                                <Button 
                                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.storeAddress || order.storeName)}`, '_blank')}
                                  variant="outline" 
                                  className="w-full h-16 rounded-[24px] border-2 border-slate-100 font-black text-sm uppercase tracking-widest gap-3 hover:bg-slate-50"
                                >
                                  <MapIcon className="w-6 h-6 text-primary" /> INICIAR GPS A TIENDA
                                </Button>
                                <Button 
                                  onClick={() => handleArriveAtStore(order.id)}
                                  className="w-full h-16 rounded-[24px] bg-secondary text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl"
                                >
                                  <CheckCircle2 className="w-6 h-6" /> HE LLEGADO A LA TIENDA
                                </Button>
                              </>
                            ) : (
                              <div className="bg-slate-900 p-8 rounded-[32px] text-center space-y-4 animate-in zoom-in">
                                <div className="text-secondary font-black uppercase text-[10px] tracking-[0.4em] mb-2 flex items-center justify-center gap-2">
                                  <ShieldCheck className="w-4 h-4" /> Código de Entrega
                                </div>
                                <div className="text-7xl font-black text-white tracking-[0.2em] italic">
                                  {order.deliveryCode}
                                </div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Suministra este código al vendedor</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Button 
                              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress || order.customerName)}`, '_blank')}
                              className="w-full h-16 rounded-[24px] bg-primary text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-primary/20"
                            >
                              <Navigation className="w-6 h-6" /> INICIAR GPS A CLIENTE
                            </Button>
                            <Button 
                              onClick={() => handleCompleteDelivery(order.id)}
                              className="w-full h-16 rounded-[24px] bg-green-500 text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl"
                            >
                              <CheckCircle2 className="w-6 h-6" /> FINALIZAR ENTREGA
                            </Button>
                          </div>
                        )}

                        <div className="pt-4 flex items-center justify-between bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tu Ganancia Neta</span>
                            <span className="text-3xl font-black text-slate-900 tracking-tighter">
                              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(calculateNetEarnings())}
                            </span>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] uppercase tracking-widest px-4 py-1">RECORRIDO ~3KM</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-300 font-black uppercase tracking-[0.2em] italic">No tienes entregas activas</div>
            )}
          </TabsContent>

          <TabsContent value="earnings">
            <div className="space-y-6">
              <Card className="border-none rounded-[48px] bg-slate-900 text-white p-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <CreditCard className="w-6 h-6 text-primary" />
                    <Badge className="bg-green-500 text-white border-none rounded-full px-4 font-black">ACTIVO</Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-6xl font-black tracking-tighter">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(history?.reduce((acc, curr) => acc + (curr.earningsApplied || 0), 0) || 0)}
                    </span>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Saldo total generado</p>
                  </div>
                  <Button className="w-full h-16 rounded-full bg-white text-slate-900 font-black text-lg uppercase tracking-widest">Solicitar Retiro</Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}