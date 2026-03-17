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
  RefreshCw
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { differenceInMinutes } from 'date-fns';
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
      where('status', 'in', ['shipped', 'at_store', 'collecting'])
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

  // Ordenamiento en memoria para evitar índices compuestos complejos
  const availableOrders = useMemo(() => {
    if (!rawAvailable) return [];
    return [...rawAvailable].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  }, [rawAvailable]);

  const myDeliveries = useMemo(() => {
    if (!rawMy) return [];
    return [...rawMy].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  }, [rawMy]);

  // ALGORITMO FINANCIERO "CAJA NEGRA"
  const stats = useMemo(() => {
    if (!history) return { totalEarnings: 0, count: 0 };
    // Cálculo: $1,000 por KM (supongamos promedio 3KM) - 12.5% servicio
    const baseKM = 3; 
    const payPerKM = 1000;
    const serviceFee = 0.125;
    
    const earnings = history.length * (baseKM * payPerKM) * (1 - serviceFee);
    return {
      totalEarnings: earnings,
      count: history.length
    };
  }, [history]);

  const handleAcceptOrder = (orderId: string) => {
    if (!firestore || !user) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      deliveryDriverId: user.uid, 
      deliveryDriverName: profile?.displayName || user.displayName || 'Repartidor', 
      status: 'shipped', 
      updatedAt: serverTimestamp(),
      participants: arrayUnion(user.uid),
      deliveryPhase: 'heading_to_store' // Fase 1: Ir a la tienda
    });
    toast({ title: "Ruta Aceptada", description: "Dirígete a la tienda." });
    setActiveTab("my-deliveries");
  };

  const handleArriveAtStore = (orderId: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    updateDocumentNonBlocking(orderRef, { 
      status: 'at_store', 
      deliveryCode: code,
      updatedAt: serverTimestamp() 
    });
    toast({ title: "¡Llegaste!", description: "Muestra tu código al vendedor." });
  };

  const handleCompleteDelivery = (orderId: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      status: 'delivered', 
      updatedAt: serverTimestamp(),
      earningsApplied: 2625 // Resultado final después de descuento
    });
    toast({ title: "¡Misión Cumplida!", description: "Entrega finalizada con éxito." });
  };

  if (loadingProfile) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-secondary" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary/60">Sincronizando Consola...</p>
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
          <h2 className="text-3xl font-black italic tracking-tighter">Acceso Restringido</h2>
          <p className="text-slate-400 max-w-sm font-medium">Debes registrarte como repartidor para acceder a esta consola logística.</p>
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
      
      {/* HEADER TÉCNICO: Estado Online */}
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
                {isOnline ? "OPERATIVO" : "DESCONECTADO"}
              </h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: #{user?.uid.slice(-6).toUpperCase()}</p>
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

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border h-16 p-1.5 rounded-full shadow-sm w-full grid grid-cols-4 gap-1">
            <TabsTrigger value="available" className="rounded-full h-full font-black text-[10px] uppercase tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-white">
              LIBRES ({availableOrders?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="my-deliveries" className="rounded-full h-full font-black text-[10px] uppercase tracking-tighter data-[state=active]:bg-secondary data-[state=active]:text-white">
              ACTIVAS ({myDeliveries?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="earnings" className="rounded-full h-full font-black text-[10px] uppercase tracking-tighter data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              INGRESOS
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-full h-full font-black text-[10px] uppercase tracking-tighter data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              PERFIL
            </TabsTrigger>
          </TabsList>

          {/* TAB: RUTAS DISPONIBLES */}
          <TabsContent value="available" className="animate-in fade-in duration-500">
            {!isOnline ? (
              <div className="text-center py-20 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
                <Lock className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                <h3 className="text-xl font-black text-slate-400 italic uppercase">Modo Descanso Activo</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 px-8">Inicia tu turno para ver los pedidos en tu zona.</p>
              </div>
            ) : loadingAvailable ? (
              <div className="flex flex-col items-center py-20 gap-4"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
            ) : availableOrders && availableOrders.length > 0 ? (
              <div className="grid gap-5">
                {availableOrders.map(order => (
                  <Card key={order.id} className="border-none rounded-[32px] shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all ring-1 ring-slate-100">
                    <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-8">
                      <div className="space-y-3 flex-1">
                        <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-3">RUTA PÚBLICA</Badge>
                        <h3 className="text-2xl font-black italic text-slate-900 tracking-tighter leading-none">{order.productName}</h3>
                        <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                          <MapPin className="w-3 h-3" /> {order.storeName}
                        </div>
                      </div>
                      <Button onClick={() => handleAcceptOrder(order.id)} className="w-full sm:w-auto rounded-full h-14 px-10 bg-primary text-white font-black text-xs uppercase tracking-widest gap-2 shadow-2xl transition-all active:scale-95">
                        Aceptar Ruta <ArrowRight className="w-5 h-5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
                <Inbox className="w-20 h-20 mx-auto text-slate-100 mb-6" />
                <h3 className="text-2xl font-black text-slate-300 italic uppercase tracking-tighter">Sin rutas activas</h3>
                <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-2">Mantente alerta a nuevas notificaciones</p>
              </div>
            )}
          </TabsContent>

          {/* TAB: ACTIVAS (GESTIÓN DINÁMICA) */}
          <TabsContent value="my-deliveries" className="animate-in slide-in-from-bottom-4 duration-500">
            {myDeliveries && myDeliveries.length > 0 ? (
              <div className="grid gap-8">
                {myDeliveries.map(order => {
                  const isArrived = order.status === 'at_store';
                  
                  return (
                    <Card key={order.id} className="border-none rounded-[40px] shadow-2xl overflow-hidden bg-white ring-1 ring-black/5">
                      <div className="bg-secondary p-5 flex items-center justify-between text-white border-b border-white/10">
                         <div className="flex items-center gap-3">
                            <Navigation className="w-6 h-6 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] italic">
                              {isArrived ? "ENTREGA EN TIENDA" : "EN RUTA A TIENDA"}
                            </span>
                         </div>
                         <Badge className="bg-white/20 text-white border-none rounded-full px-4 h-8 text-[10px] font-black italic uppercase">{order.storeName}</Badge>
                      </div>
                      <CardContent className="p-10 space-y-8">
                        <div className="space-y-2">
                          <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{order.productName}</h3>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Recoger en: <span className="text-primary font-black">{order.storeAddress || 'Dirección de Tienda'}</span></p>
                        </div>

                        {!isArrived ? (
                          <div className="space-y-4">
                            <Button 
                              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.storeAddress || order.storeName)}`, '_blank')}
                              variant="outline" 
                              className="w-full h-16 rounded-full border-2 border-slate-100 font-black text-sm uppercase tracking-widest gap-3 hover:bg-slate-50 transition-all"
                            >
                              <MapIcon className="w-6 h-6 text-primary" /> INICIAR RECORRIDO GPS
                            </Button>
                            <Button 
                              onClick={() => handleArriveAtStore(order.id)}
                              className="w-full h-16 rounded-full bg-secondary text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-secondary/20 transition-all active:scale-95"
                            >
                              <CheckCircle2 className="w-6 h-6" /> HE LLEGADO A LA TIENDA
                            </Button>
                          </div>
                        ) : (
                          <div className="bg-slate-900 p-8 rounded-[32px] text-center space-y-4 animate-in zoom-in duration-500">
                            <div className="flex items-center justify-center gap-2 text-secondary font-black uppercase text-[10px] tracking-[0.4em] mb-2">
                              <ShieldCheck className="w-4 h-4" /> Validación Requerida
                            </div>
                            <div className="text-6xl font-black text-white tracking-[0.2em] italic">
                              {order.deliveryCode || '----'}
                            </div>
                            <p className="text-slate-400 text-xs font-medium px-4">
                              Suministra este código al vendedor para recibir el producto físico.
                            </p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Button className="rounded-full h-14 bg-[#25d366] hover:bg-[#128c7e] text-white font-black text-[10px] uppercase tracking-widest gap-3 shadow-xl shadow-green-100 border-none transition-transform active:scale-95">
                            <MessageCircle className="w-5 h-5" /> WhatsApp Cliente
                          </Button>
                          <Button 
                            disabled={!isArrived}
                            onClick={() => handleCompleteDelivery(order.id)} 
                            className="rounded-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest gap-3 shadow-xl transition-transform active:scale-95 disabled:opacity-30"
                          >
                            <CheckCircle2 className="w-5 h-5" /> Finalizar Entrega
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
                <Truck className="w-20 h-20 mx-auto text-slate-100 mb-6" />
                <h3 className="text-2xl font-black text-slate-300 italic uppercase tracking-tighter">Sin viajes activos</h3>
                <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-2">Acepta una ruta para empezar</p>
              </div>
            )}
          </TabsContent>

          {/* TAB: INGRESOS (BILLETERA) */}
          <TabsContent value="earnings" className="animate-in fade-in duration-500">
            <div className="space-y-6">
              <Card className="border-none rounded-[48px] bg-slate-900 text-white p-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-indigo-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Balance Disponible</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-none rounded-full px-4 font-black">ACTIVO</Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-6xl font-black tracking-tighter">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(stats.totalEarnings)}
                    </span>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Saldo neto acumulado</p>
                  </div>
                  <Button className="w-full h-16 rounded-full bg-white text-slate-900 font-black text-lg uppercase tracking-tighter italic hover:bg-slate-100 transition-all shadow-2xl">
                    Solicitar Retiro <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 space-y-2 shadow-sm">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  <p className="text-3xl font-black text-slate-900 leading-none">{stats.count}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Viajes Completados</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 space-y-2 shadow-sm">
                  <RefreshCw className="w-6 h-6 text-indigo-500" />
                  <p className="text-3xl font-black text-slate-900 leading-none">12.5%</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tasa de Servicio</p>
                </div>
              </div>

              <div className="bg-white rounded-[40px] border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <History className="w-5 h-5 text-slate-400" />
                  <h4 className="font-black text-sm uppercase tracking-widest">Últimos Movimientos</h4>
                </div>
                {history && history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map(h => (
                      <div key={h.id} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
                        <div>
                          <p className="font-black text-slate-800 text-sm uppercase italic tracking-tighter">{h.productName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{h.storeName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-green-600 text-sm">+$2.625</p>
                          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Neto</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-10 text-slate-300 font-bold uppercase text-[10px] tracking-widest italic">Sin transacciones registradas</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB: PERFIL (DOCUMENTACIÓN Y SOPORTE) */}
          <TabsContent value="profile" className="animate-in fade-in duration-500">
            <div className="space-y-6">
              <Card className="border-none rounded-[48px] bg-white p-10 shadow-sm border border-slate-100">
                <div className="flex flex-col items-center text-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-slate-50 border-[6px] border-white shadow-xl flex items-center justify-center relative">
                    <Truck className="w-10 h-10 text-primary" />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                      <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase">{profile?.displayName || user?.displayName}</h3>
                    <Badge className="bg-secondary/10 text-secondary border-none font-black text-[9px] px-4 py-1 mt-2">REPARTIDOR ELITE</Badge>
                  </div>
                </div>

                <div className="grid gap-4 mt-10">
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 text-slate-600 font-bold text-xs uppercase tracking-widest">
                      <ShieldCheck className="w-4 h-4 text-green-500" /> Identidad Verificada
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 text-slate-600 font-bold text-xs uppercase tracking-widest">
                      <ShieldCheck className="w-4 h-4 text-green-500" /> Vehículo Registrado
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 text-slate-600 font-bold text-xs uppercase tracking-widest">
                      <AlertCircle className="w-4 h-4 text-amber-500" /> Seguro de Accidentes
                    </div>
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase">Pagar hoy</span>
                  </div>
                </div>

                <Button variant="ghost" className="w-full mt-10 h-14 rounded-2xl text-red-500 hover:bg-red-50 font-black text-xs uppercase tracking-[0.2em] gap-3">
                  Cerrar Sesión Logística
                </Button>
              </Card>

              <div className="bg-primary p-8 rounded-[40px] text-white space-y-4 shadow-2xl shadow-primary/20">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-6 h-6" />
                  <h4 className="font-black italic uppercase tracking-tighter text-xl">Soporte Directo</h4>
                </div>
                <p className="text-white/70 text-xs font-medium leading-relaxed">¿Tienes problemas con un pedido o una entrega? Nuestro equipo de moderadores está listo para ayudarte 24/7.</p>
                <Button className="w-full h-14 rounded-full bg-white text-primary font-black uppercase text-xs tracking-widest hover:bg-slate-50">
                  Contactar Soporte
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}