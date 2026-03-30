
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Package, 
  MessageCircle, 
  Loader2,
  ArrowRight,
  Zap,
  Timer,
  ShieldCheck,
  TrendingUp,
  Store as StoreIcon,
  Camera,
  X,
  Star,
  ExternalLink,
  Award,
  Calendar,
  MapPinned,
  Phone,
  Wallet,
  Clock,
  AlertTriangle,
  RotateCcw,
  Lock
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc, addDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { WeeklyChallenge } from '@/components/delivery/WeeklyChallenge';
import Image from 'next/image';
import { OrderChat } from '@/components/chat/OrderChat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { releaseOrder } from '@/ai/flows/release-order-flow';
import { AgentProgressOverlay } from '@/components/agents/AgentProgressOverlay';

const RELEASE_REASONS = [
  "Falla técnica en el vehículo",
  "Emergencia personal",
  "Dirección inalcanzable",
  "Espera excesiva en tienda",
  "Otro motivo"
];

export default function DeliveryDashboardPage() {
  const { user } = useUser();
  const { profile, level, isLoading: loadingProfile } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("available");
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [isMissionChatOpen, setIsMissionChatOpen] = useState(false);
  
  // ESTADOS DE LIBERACIÓN
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseLogs, setReleaseLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!loadingProfile && profile && !profile.phoneNumber) {
      toast({ title: "Acceso Restringido", description: "Registra tu teléfono.", variant: "destructive" });
      router.push('/profile');
    }
  }, [profile, loadingProfile, router]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isConfirmedRepartidor = profile?.role === 'repartidor' || profile?.role === 'admin';

  const availableOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !isConfirmedRepartidor || !isOnline) return null;
    return query(collection(firestore, 'orders'), where('isLogisticsPublic', '==', true), where('status', 'in', ['preparing', 'ready_for_pickup']));
  }, [firestore, isConfirmedRepartidor, isOnline]);

  const myDeliveriesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isConfirmedRepartidor) return null;
    return query(collection(firestore, 'orders'), where('participants', 'array-contains', user.uid), where('status', 'in', ['shipped', 'at_store', 'delivered_to_driver']));
  }, [firestore, user?.uid, isConfirmedRepartidor]);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isConfirmedRepartidor) return null;
    return query(collection(firestore, 'orders'), where('participants', 'array-contains', user.uid), where('status', '==', 'delivered'));
  }, [firestore, user?.uid, isConfirmedRepartidor]);

  const { data: rawAvailable } = useCollection(availableOrdersQuery);
  const { data: rawMy } = useCollection(myDeliveriesQuery);
  const { data: history } = useCollection(historyQuery);

  const stats = useMemo(() => {
    return {
      rating: profile?.avgRating || 5.0,
      deliveredCount: history?.length || 0
    };
  }, [profile, history]);

  const availableOrders = useMemo(() => {
    if (!rawAvailable) return [];
    return [...rawAvailable].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  }, [rawAvailable]);

  const myDeliveries = useMemo(() => {
    if (!rawMy) return [];
    return [...rawMy].filter(o => o.deliveryDriverId === user?.uid);
  }, [rawMy, user?.uid]);

  const activeMission = useMemo(() => myDeliveries.find(o => ['shipped', 'at_store', 'delivered_to_driver'].includes(o.status)), [myDeliveries]);

  const customerRef = useMemoFirebase(() => (!firestore || !activeMission?.customerId) ? null : doc(firestore, 'users', activeMission.customerId), [firestore, activeMission?.customerId]);
  const { data: customerProfile } = useDoc(customerRef);

  const handleAcceptOrder = (orderId: string) => {
    if (!firestore || !user) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      deliveryDriverId: user.uid, 
      deliveryDriverName: profile?.displayName || user.displayName || 'Repartidor', 
      status: 'shipped', 
      updatedAt: serverTimestamp(),
      participants: arrayUnion(user.uid)
    });
    toast({ title: "Ruta Aceptada" });
    setActiveTab("my-deliveries");
  };

  const handleReleaseOrderAction = async () => {
    if (!activeMission || !user || !firestore || !selectedReason) return;

    const orderRef = doc(firestore, 'orders', activeMission.id);
    const incidentRef = collection(firestore, 'incidents');
    
    // 1. REGISTRO INMEDIATO EN FIRESTORE (OPTIMISTA)
    addDocumentNonBlocking(incidentRef, {
      orderId: activeMission.id,
      driverId: user.uid,
      driverName: profile?.displayName || 'Repartidor',
      reason: selectedReason,
      hasProducts: activeMission.status === 'delivered_to_driver',
      orderValue: activeMission.totalPrice || 0,
      storeId: activeMission.storeId,
      storeName: activeMission.storeName,
      createdAt: serverTimestamp(),
      type: 'ORDER_RELEASE',
      agentOwner: 'soporte'
    });

    updateDocumentNonBlocking(orderRef, {
      status: 'ready_for_pickup',
      deliveryDriverId: null,
      deliveryDriverName: null,
      isLogisticsPublic: true,
      updatedAt: serverTimestamp(),
      participants: arrayRemove(user.uid)
    });

    // 2. ACTIVAR OVERLAY DE IA
    setIsReleaseDialogOpen(false);
    setIsReleasing(true);
    setReleaseLogs(["Protocolo de liberación activado...", "Sincronizando Ciudadela de Agentes..."]);

    try {
      // 3. LLAMAR AL ORQUESTADOR EN BACKGROUND (PARA VELOCIDAD)
      const result = await releaseOrder({
        orderId: activeMission.id,
        driverId: user.uid,
        reason: selectedReason,
        hasProducts: activeMission.status === 'delivered_to_driver',
        orderValue: activeMission.totalPrice || 0,
        storeId: activeMission.storeId,
        storeName: activeMission.storeName
      });

      setReleaseLogs(prev => [...prev, ...result.agentLogs]);

      if (result.debtApplied) {
        const userRef = doc(firestore, 'users', user.uid);
        updateDocumentNonBlocking(userRef, { balance: (profile?.balance || 0) - result.debtApplied, updatedAt: serverTimestamp() });
      }
    } catch (e) {
      console.warn("Fallo IA en background.");
      setReleaseLogs(prev => [...prev, "Finalizando procesos internos..."]);
    }
  };

  const handleFinishRelease = () => {
    setIsReleasing(false);
    // REDIRECCIÓN MAESTRA A LA PÁGINA DE ÉXITO
    router.replace('/delivery/release-success');
  };

  const handleOpenMaps = (address: string) => {
    if (!address) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
  };

  if (loadingProfile) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (!isConfirmedRepartidor) return <div className="flex flex-col min-h-screen items-center justify-center p-8 text-center gap-6"><Truck className="w-16 h-16 text-slate-200" /><h2 className="text-3xl font-black uppercase italic">Acceso Restringido</h2><Button onClick={() => router.push('/delivery/register')} className="rounded-full bg-secondary h-14 px-10">Unirme al Equipo</Button></div>;

  const hasProducts = activeMission?.status === 'delivered_to_driver';

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f8fafc] overflow-hidden">
      <Navbar />
      
      {/* OVERLAY DE PROGRESO DE IA (LIBERACIÓN) */}
      <AgentProgressOverlay 
        isOpen={isReleasing} 
        logs={releaseLogs} 
        onComplete={handleFinishRelease} 
      />

      {activeMission ? (
        <div className="flex flex-col h-[calc(100dvh-64px)] animate-in slide-in-from-bottom duration-500 overflow-hidden relative z-[40]">
          {/* HEADER DE MISIÓN */}
          <div className="h-16 bg-slate-900 flex items-center justify-between px-4 text-white shrink-0 shadow-xl z-20">
            <Button variant="ghost" size="icon" onClick={() => setIsReleaseDialogOpen(true)} className="h-10 w-10 text-white/40 hover:text-red-400 rounded-full"><X className="w-5 h-5" /></Button>
            <Badge className={cn("text-white border-none font-black px-4 h-8 uppercase text-[10px] tracking-widest", hasProducts ? "bg-purple-600" : "bg-green-500")}>
              {hasProducts ? "CON PRODUCTO" : "EN TIENDA"}
            </Badge>
            <div className="flex items-center gap-3">
              <span className="text-sm font-black italic">{format(currentTime, 'HH:mm')}</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Clock className="w-4 h-4 text-primary" /></div>
            </div>
          </div>

          {/* CONTENIDO SCROLLABLE */}
          <main className="flex-1 overflow-y-auto no-scrollbar">
            <div className="px-6 py-10 pb-20 space-y-8 max-w-2xl mx-auto">
              <section className="text-center space-y-4">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">MISIÓN ACTIVA #{activeMission.id.slice(-6).toUpperCase()}</p>
                <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">{activeMission.productName}</h1>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-slate-900 text-white px-5 py-2 rounded-full"><StoreIcon className="w-4 h-4 text-primary inline mr-2" /><span className="text-xs font-black uppercase italic">{activeMission.storeName}</span></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{activeMission.storeAddress}</p>
                </div>
              </section>

              <Button onClick={() => handleOpenMaps(activeMission.storeAddress)} className="w-full h-20 rounded-[28px] bg-primary text-white font-black text-xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all">
                <MapPinned className="w-7 h-7" /> RECOGER PEDIDO
              </Button>

              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Lista de Artículos</h3>
                {activeMission.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-3xl bg-white border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border"><Image src={item.imageUrl || 'https://picsum.photos/seed/p/200'} alt={item.name} fill className="object-cover" /></div>
                      <div><p className="text-sm font-black uppercase italic leading-none">{item.name}</p><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Cant: x{item.quantity}</p></div>
                    </div>
                    <Badge className="bg-slate-50 text-slate-400 border-none">#{idx+1}</Badge>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-[32px] bg-slate-900 text-white shadow-xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase">A cobrar</p>
                  <p className="text-xl font-black italic">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(activeMission.totalPrice || 0)}</p>
                </div>
                <div className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Pago</p>
                  <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-green-500" /><p className="text-xs font-black uppercase italic">{activeMission.paymentMethod?.toUpperCase()}</p></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-dashed">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border-4 border-white shadow-xl"><AvatarImage src={customerProfile?.photoURL} /><AvatarFallback className="bg-primary text-white font-black text-xl">{activeMission.customerName?.charAt(0)}</AvatarFallback></Avatar>
                  <div><p className="text-[9px] font-black text-slate-400 uppercase">Cliente</p><p className="text-lg font-black uppercase italic leading-none">{activeMission.customerName}</p></div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${activeMission.customerPhone}`}><Button variant="ghost" size="icon" className="rounded-full bg-white text-slate-600 h-12 w-12 shadow-md"><Phone className="w-5 h-5" /></Button></a>
                  <Button onClick={() => setIsMissionChatOpen(true)} className="rounded-full bg-slate-900 text-white h-12 w-12 shadow-xl"><MessageCircle className="w-5 h-5 text-primary" /></Button>
                </div>
              </div>

              {/* SECCIÓN DE SOPORTE OPERATIVO */}
              <section className="pt-10 border-t space-y-4">
                <div className="flex items-center gap-3 text-orange-500">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="text-sm font-black uppercase tracking-widest italic">¿Problemas Críticos?</h3>
                </div>
                <Button 
                  onClick={() => setIsReleaseDialogOpen(true)} 
                  variant="outline" 
                  className="w-full h-14 rounded-2xl border-red-100 text-red-500 font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-red-50"
                >
                  <RotateCcw className="w-4 h-4" /> LIBERAR PEDIDO AHORA
                </Button>
              </section>
            </div>
          </main>

          {/* BARRA DE SEGUIMIENTO */}
          <div className="shrink-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Monitoreo Satelital Activo</span></div>
              <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden relative"><div className="absolute inset-0 bg-green-500 animate-progress-loading" /></div>
            </div>
          </div>

          {/* DIÁLOGO DE CHAT DE MISIÓN (CON ACCESIBILIDAD) */}
          <Dialog open={isMissionChatOpen} onOpenChange={setIsMissionChatOpen}>
            <DialogContent className="p-0 border-none bg-white max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 flex flex-col z-[300]">
              <DialogHeader className="sr-only">
                <DialogTitle>Chat de Misión</DialogTitle>
                <DialogDescription>Canal de comunicación con el cliente del pedido.</DialogDescription>
              </DialogHeader>
              <OrderChat orderId={activeMission.id} orderData={activeMission} onClose={() => setIsMissionChatOpen(false)} />
            </DialogContent>
          </Dialog>
          
          {/* DIÁLOGO DE LIBERACIÓN */}
          <Dialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
            <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px] z-[400]">
              <DialogHeader className="items-center text-center">
                <RotateCcw className={cn("w-12 h-12 mb-4", hasProducts ? "text-red-500" : "text-orange-500")} />
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Liberar Pedido</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">Selecciona el motivo de deserción de ruta.</DialogDescription>
              </DialogHeader>
              
              {hasProducts && (
                <div className="bg-red-50 border-2 border-red-100 p-5 rounded-3xl space-y-2 animate-pulse mb-4">
                  <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase">
                    <AlertTriangle className="w-4 h-4" /> AVISO DE DEUDA
                  </div>
                  <p className="text-[10px] font-bold text-red-700 uppercase">
                    Se aplicará deuda inmediata por el valor total: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(activeMission.totalPrice || 0)}
                  </p>
                </div>
              )}

              <div className="py-6 space-y-2">
                {RELEASE_REASONS.map(r => (
                  <button 
                    key={r} 
                    onClick={() => setSelectedReason(r)} 
                    className={cn(
                      "w-full p-4 rounded-2xl text-left text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                      selectedReason === r 
                        ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
                        : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setIsReleaseDialogOpen(false)} className="font-black uppercase text-[10px]">VOLVER</Button>
                <Button 
                  onClick={handleReleaseOrderAction} 
                  disabled={!selectedReason} 
                  className={cn(
                    "flex-1 h-14 rounded-full font-black uppercase text-xs tracking-widest shadow-xl",
                    hasProducts ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 text-white"
                  )}
                >
                  CONFIRMAR LIBERACIÓN
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="bg-white border-b relative overflow-hidden px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 border-[4px] border-white shadow-2xl"><AvatarImage src={profile?.photoURL} className="object-cover" /><AvatarFallback className="bg-primary text-white font-black text-2xl">R</AvatarFallback></Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-3"><h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{profile?.displayName || 'Repartidor'}</h1><Badge className={cn("h-6 border-none font-black italic text-[9px]", level.bg, level.color)}>{level.name}</Badge></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-primary" /> Verificado • {stats.rating} <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" /></p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-[32px] border">
                <Button onClick={() => setIsOnline(!isOnline)} className={cn("rounded-full h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl transition-all", isOnline ? "bg-red-50 text-red-500 shadow-red-100" : "bg-green-500 text-white shadow-green-200")}>{isOnline ? "Cerrar Turno" : "Iniciar Turno"}</Button>
              </div>
            </div>
          </div>

          <main className="container mx-auto px-4 py-8 max-w-2xl">
            <WeeklyChallenge orders={history} />
            <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="mt-10 space-y-8">
              <TabsList className="bg-white border h-16 p-1 rounded-full shadow-sm w-full grid grid-cols-3">
                <TabsTrigger value="available" className="rounded-full font-black text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white">RUTAS LIBRES</TabsTrigger>
                <TabsTrigger value="my-deliveries" className="rounded-full font-black text-[10px] data-[state=active]:bg-secondary data-[state=active]:text-white">ACTIVAS ({myDeliveries.length})</TabsTrigger>
                <TabsTrigger value="earnings" className="rounded-full font-black text-[10px] data-[state=active]:bg-slate-900 data-[state=active]:text-white">INGRESOS</TabsTrigger>
              </TabsList>
              <TabsContent value="available">
                {isOnline ? (
                  availableOrders.length > 0 ? (
                    <div className="grid gap-4">
                      {availableOrders.map(order => (
                        <Card key={order.id} className="border-none rounded-[32px] shadow-sm bg-white p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-xl transition-all">
                          <div className="space-y-2 flex-1"><Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase">DISPONIBLE</Badge><h3 className="text-3xl font-black italic tracking-tighter uppercase">{order.productName}</h3><p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><StoreIcon className="w-3 h-3" /> {order.storeName}</p></div>
                          <Button onClick={() => handleAcceptOrder(order.id)} className="w-full sm:w-auto rounded-full h-16 px-10 bg-primary text-white font-black uppercase text-xs tracking-widest gap-3 shadow-2xl">ACEPTAR RUTA <ArrowRight className="w-5 h-5" /></Button>
                        </Card>
                      ))}
                    </div>
                  ) : <div className="text-center py-20 text-slate-300 font-black uppercase italic tracking-widest">Esperando nuevas rutas...</div>
                ) : <div className="text-center py-20 bg-slate-50 rounded-[48px] border-2 border-dashed space-y-4"><Lock className="w-16 h-16 mx-auto text-slate-200" /><h3 className="text-xl font-black text-slate-400 uppercase italic">Modo Desconectado</h3><Button onClick={() => setIsOnline(true)} className="rounded-full bg-green-500 h-12 shadow-lg px-8 font-black">Iniciar Turno Ahora</Button></div>}
              </TabsContent>
              <TabsContent value="earnings">
                <Card className="border-none rounded-[48px] bg-slate-900 text-white p-10 overflow-hidden relative shadow-2xl"><div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" /><div className="relative z-10 space-y-10"><Badge className="bg-green-500 text-white border-none rounded-full px-5 font-black h-8 text-[10px] uppercase">COBRO ACTIVO</Badge><div className="space-y-2"><span className="text-7xl font-black tracking-tighter leading-none">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(profile?.balance || 0)}</span><p className="text-slate-400 text-xs font-bold uppercase italic ml-2">Saldo neto actual</p></div><Button className="w-full h-20 rounded-full bg-white text-slate-900 font-black text-xl uppercase tracking-widest">Solicitar Pago</Button></div></Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      )}
    </div>
  );
}
