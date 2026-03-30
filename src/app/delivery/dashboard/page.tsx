
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
  Map as MapIcon,
  CreditCard,
  Lock,
  Store as StoreIcon,
  Camera,
  X,
  Star,
  ExternalLink,
  Award,
  Calendar,
  MapPinned,
  ChevronLeft,
  Phone,
  Wallet,
  Info,
  Clock,
  ChevronRight,
  AlertTriangle,
  RotateCcw
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
  "Problema de salud imprevisto",
  "Emergencia personal",
  "Dirección inalcanzable o peligrosa",
  "Demasiado tiempo de espera en tienda",
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
  
  const [showCamera, setShowCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [isMissionChatOpen, setIsMissionChatOpen] = useState(false);
  
  // ESTADOS DE LIBERACIÓN
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseLogs, setReleaseLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!loadingProfile && profile && !profile.phoneNumber) {
      toast({ 
        title: "Acceso Restringido", 
        description: "Registra tu teléfono para operar como repartidor.", 
        variant: "destructive" 
      });
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
      where('participants', 'array-contains', user.uid),
      where('status', 'in', ['shipped', 'at_store', 'delivered_to_driver'])
    );
  }, [firestore, user?.uid, isConfirmedRepartidor]);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isConfirmedRepartidor) return null;
    return query(
      collection(firestore, 'orders'),
      where('participants', 'array-contains', user.uid),
      where('status', '==', 'delivered')
    );
  }, [firestore, user?.uid, isConfirmedRepartidor]);

  const { data: rawAvailable } = useCollection(availableOrdersQuery);
  const { data: rawMy } = useCollection(myDeliveriesQuery);
  const { data: history } = useCollection(historyQuery);

  const availableOrders = useMemo(() => {
    if (!rawAvailable) return [];
    return [...rawAvailable].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  }, [rawAvailable]);

  const myDeliveries = useMemo(() => {
    if (!rawMy) return [];
    return [...rawMy].filter(o => o.deliveryDriverId === user?.uid);
  }, [rawMy, user?.uid]);

  const activeMission = useMemo(() => myDeliveries.find(o => o.status === 'shipped' || o.status === 'at_store' || o.status === 'delivered_to_driver'), [myDeliveries]);

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
    toast({ title: "Ruta Aceptada", description: "Iniciando navegación..." });
    setActiveTab("my-deliveries");
  };

  const handleManualArrival = (orderId: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      status: 'at_store', 
      updatedAt: serverTimestamp() 
    });
    toast({ 
      title: "¡LLEGADA CONFIRMADA!", 
      description: "Vendedor y cliente notificados.",
      className: "bg-green-600 text-white border-none"
    });
  };

  const handleReleaseOrderAction = async () => {
    if (!activeMission || !user || !firestore || !selectedReason) return;

    setIsReleaseDialogOpen(false); // Cerramos el diálogo inmediatamente para mostrar el overlay
    setIsReleasing(true);
    setReleaseLogs(["Iniciando Protocolo de Liberación..."]);

    try {
      // 1. PERSISTENCIA DE INCIDENTE PARA EL AGENTE DE SOPORTE (ADMIN CENTER)
      const incidentRef = collection(firestore, 'incidents');
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

      // 2. INVOCACIÓN A LA IA
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

      if (result.success) {
        const orderRef = doc(firestore, 'orders', activeMission.id);
        const updateData: any = {
          status: 'ready_for_pickup',
          deliveryDriverId: null,
          deliveryDriverName: null,
          isLogisticsPublic: true,
          updatedAt: serverTimestamp(),
          participants: arrayRemove(user.uid)
        };

        updateDocumentNonBlocking(orderRef, updateData);

        if (result.debtApplied) {
          const userRef = doc(firestore, 'users', user.uid);
          const currentBalance = profile?.balance || 0;
          updateDocumentNonBlocking(userRef, {
            balance: currentBalance - result.debtApplied,
            updatedAt: serverTimestamp()
          });
        }
      } else {
        toast({ title: "Error en la IA", description: result.message, variant: "destructive" });
        setIsReleasing(false);
      }
    } catch (e) {
      toast({ title: "Error crítico", variant: "destructive" });
      setIsReleasing(false);
    }
  };

  const handleFinishRelease = () => {
    setIsReleasing(false);
    router.replace('/delivery/dashboard'); // Forzamos recarga del panel para nuevas rutas
  };

  const handleOpenMaps = (address: string) => {
    if (!address) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const stats = useMemo(() => {
    if (!history) return { rating: 5.0, count: 0, earnings: 0 };
    const validRatings = history.filter(o => o.rating).map(o => o.rating);
    const avgRating = validRatings.length > 0 ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length : 5.0;
    return {
      rating: avgRating.toFixed(1),
      count: history.length,
      earnings: history.reduce((acc, curr) => acc + (curr.earningsApplied || 0), 0)
    };
  }, [history]);

  useEffect(() => {
    if (showCamera && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (e) { toast({ title: "Cámara no disponible", variant: "destructive" }); }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && user && firestore) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        setIsCapturing(true);
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const userRef = doc(firestore, 'users', user.uid);
        updateDocumentNonBlocking(userRef, { photoURL: dataUrl, updatedAt: serverTimestamp() });
        toast({ title: "¡Identidad Actualizada!", description: "Tu nueva foto es ahora pública." });
        setIsCapturing(false);
        stopCamera();
      }
    }
  };

  if (loadingProfile) {
    return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (profile && !profile.phoneNumber) return null;

  if (!isConfirmedRepartidor) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
          <Truck className="w-16 h-16 text-slate-200" />
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Acceso Restringido</h2>
          <Button onClick={() => window.location.href = '/delivery/register'} className="rounded-full bg-secondary h-14 px-10">Unirme al Equipo</Button>
        </div>
      </div>
    );
  }

  const LevelIcon = level.icon;
  const suggestedArrival = activeMission ? format(addMinutes(currentTime, 18), 'HH:mm') : null;
  const hasProducts = activeMission?.status === 'delivered_to_driver';

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      {/* OVERLAY DE INTELIGENCIA PARA LIBERACIÓN CON AUTO-RETORNO */}
      <AgentProgressOverlay 
        isOpen={isReleasing} 
        logs={releaseLogs} 
        onComplete={handleFinishRelease}
      />

      {activeMission ? (
        <div className="fixed inset-0 z-[40] bg-[#f8fafc] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
          <div className="h-16 bg-slate-900 flex items-center justify-between px-4 text-white shrink-0 shadow-2xl relative">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsReleaseDialogOpen(true)} 
                className="h-10 w-10 text-white/40 hover:text-red-400 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </Button>
              {activeMission.status === 'shipped' ? (
                <Button 
                  onClick={() => handleManualArrival(activeMission.id)}
                  className="h-10 bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest px-4 rounded-full shadow-lg border-none"
                >
                  LLEGUÉ A TIENDA
                </Button>
              ) : (
                <Badge className={cn(
                  "text-white border-none font-black italic px-4 py-1 h-8 uppercase text-[10px] tracking-widest",
                  hasProducts ? "bg-purple-600" : "bg-green-500"
                )}>
                  {hasProducts ? "CON PRODUCTO" : "EN TIENDA"}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right flex flex-col justify-center">
                <span className="text-[14px] font-black text-white leading-none tracking-tighter">
                  {format(currentTime, 'HH:mm')}
                </span>
                <p className="text-[8px] font-black text-primary uppercase tracking-widest mt-0.5 italic">
                  ETA: {suggestedArrival}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                <Clock className="w-5 h-5 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
            <section className="px-6 pt-10 pb-8 space-y-4 text-center">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-3">PEDIDO #{activeMission.id.slice(-6).toUpperCase()}</p>
                <h1 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter leading-[0.85] text-slate-900 drop-shadow-sm">
                  {activeMission.productName}
                </h1>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full shadow-lg">
                  <StoreIcon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-black uppercase italic tracking-widest">{activeMission.storeName}</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{activeMission.storeAddress || 'Aguachica, Cesar'}</p>
              </div>
            </section>

            <section className="px-6 py-6 flex flex-col gap-4">
              <Button 
                onClick={() => handleOpenMaps(activeMission.storeAddress)}
                className="h-24 rounded-[32px] bg-primary hover:bg-primary/90 text-white font-black text-2xl uppercase tracking-tighter italic gap-5 shadow-[0_20px_50px_rgba(59,130,246,0.3)] active:scale-95 transition-all"
              >
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <MapPinned className="w-8 h-8" />
                </div>
                INICIAR RUTA
              </Button>
            </section>

            <section className="px-6 py-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-secondary rounded-full" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Contenido del Pedido</h3>
                </div>
                <div className="space-y-3">
                  {activeMission.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-3xl bg-white border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-50">
                          <Image src={item.imageUrl || 'https://picsum.photos/seed/p/200'} alt={item.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase italic leading-none text-slate-800">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Cantidad: x{item.quantity}</p>
                        </div>
                      </div>
                      <Badge className="bg-slate-50 text-slate-600 border-none font-black text-[10px]">SKU-{idx+1}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-[32px] bg-slate-900 text-white shadow-xl space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total a Validar</p>
                  <p className="text-xl font-black italic tracking-tighter">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(activeMission.totalPrice || 0)}
                  </p>
                </div>
                <div className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Método de Pago</p>
                  <div className="flex items-center gap-2">
                    {activeMission.paymentMethod === 'digital' ? <CreditCard className="w-4 h-4 text-primary" /> : <Wallet className="w-4 h-4 text-green-500" />}
                    <p className="text-xs font-black uppercase italic text-slate-800">{activeMission.paymentMethod === 'digital' ? 'ONLINE' : 'EFECTIVO'}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="px-6 py-8 border-t border-dashed border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border-4 border-white shadow-xl ring-1 ring-slate-100">
                    <AvatarImage src={customerProfile?.photoURL} className="object-cover" />
                    <AvatarFallback className="bg-primary text-white font-black text-xl">
                      {activeMission.customerName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entregando a</p>
                    <p className="text-lg font-black uppercase italic text-slate-900 leading-none">{activeMission.customerName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[150px]">{activeMission.customerAddress}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${activeMission.customerPhone}`}>
                    <Button variant="ghost" size="icon" className="rounded-full bg-white text-slate-600 h-12 w-12 shadow-md border border-slate-50 active:scale-95 transition-all">
                      <Phone className="w-5 h-5" />
                    </Button>
                  </a>
                  <Button 
                    onClick={() => setIsMissionChatOpen(true)}
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-slate-900 text-white h-12 w-12 shadow-xl active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </Button>
                </div>
              </div>
            </section>

            <section className="px-6 py-12 border-t border-slate-100 bg-slate-50/50">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">¿Problemas con la ruta?</h3>
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Si no puedes completar esta entrega por una causa de fuerza mayor, debes liberar la ruta para que la Ciudadela de Agentes pueda reasignarla inmediatamente.
                </p>
                <Button 
                  onClick={() => setIsReleaseDialogOpen(true)}
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 font-black uppercase text-[10px] tracking-[0.2em] gap-2 transition-all shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" /> LIBERAR PEDIDO AHORA
                </Button>
              </div>
            </section>
          </main>

          <Dialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
            <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px] overflow-hidden z-[300]">
              <DialogHeader className="items-center text-center">
                <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-in zoom-in", hasProducts ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600")}>
                  <RotateCcw className="w-8 h-8" />
                </div>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
                  Liberar Pedido
                </DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">
                  Selecciona el motivo por el cual no puedes completar esta ruta.
                </DialogDescription>
              </DialogHeader>

              {hasProducts && (
                <div className="bg-red-50 border-2 border-red-100 p-5 rounded-3xl space-y-3 animate-pulse">
                  <div className="flex items-center gap-3 text-red-600">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <h4 className="font-black text-xs uppercase tracking-widest">AVISO DE DEUDA TÉCNICA</h4>
                  </div>
                  <p className="text-[11px] font-bold text-red-700/80 leading-relaxed uppercase">
                    Has recibido los productos de la tienda. Al liberar este pedido, se generará una **deuda inmediata de {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(activeMission.totalPrice || 0)}** en tu cuenta.
                  </p>
                </div>
              )}

              <div className="py-6 space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                {RELEASE_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={cn(
                      "w-full p-4 rounded-2xl text-left text-xs font-black uppercase tracking-widest transition-all border-2",
                      selectedReason === reason 
                        ? "bg-slate-900 text-white border-slate-900 scale-[1.02] shadow-lg" 
                        : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <DialogFooter className="sm:justify-center gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsReleaseDialogOpen(false)}
                  className="rounded-full h-14 font-black uppercase text-slate-400 hover:text-slate-600"
                >
                  VOLVER
                </Button>
                <Button 
                  onClick={handleReleaseOrderAction}
                  disabled={!selectedReason || isReleasing}
                  className={cn(
                    "flex-1 h-14 rounded-full font-black uppercase tracking-widest shadow-xl transition-all active:scale-95",
                    hasProducts ? "bg-red-600 hover:bg-red-700 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"
                  )}
                >
                  CONFIRMAR LIBERACIÓN
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="fixed bottom-0 inset-x-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-[110]">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Seguimiento GPS Activo</span>
              </div>
              <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-green-500 animate-progress-loading" />
              </div>
            </div>
          </div>

          <Dialog open={isMissionChatOpen} onOpenChange={setIsMissionChatOpen}>
            <DialogContent className="p-0 border-none bg-white shadow-none max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 flex flex-col z-[200]">
              <DialogHeader className="sr-only">
                <DialogTitle>Chat Interno</DialogTitle>
                <DialogDescription>Comunicación directa por pedido.</DialogDescription>
              </DialogHeader>
              <OrderChat orderId={activeMission.id} orderData={activeMission} onClose={() => setIsMissionChatOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <>
          <div className="bg-white border-b relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="container mx-auto max-w-4xl px-4 py-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="relative group cursor-pointer" onClick={startCamera}>
                    <Avatar className="w-24 h-24 border-[4px] border-white shadow-2xl ring-1 ring-slate-100 group-hover:scale-105 transition-transform duration-500">
                      <AvatarImage src={profile?.photoURL} className="object-cover" />
                      <AvatarFallback className="bg-primary text-white font-black text-2xl">R</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center text-white transition-opacity">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                        {profile?.displayName || 'Repartidor'}
                      </h1>
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 h-6 rounded-full border shadow-sm animate-in zoom-in duration-500",
                        level.bg, level.color, level.border
                      )}>
                        <LevelIcon className="w-3 h-3" />
                        <span className="font-black text-[9px] uppercase italic tracking-widest">{level.name}</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3 text-primary" /> Verificado • {stats.rating} <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" />
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Button asChild variant="outline" size="sm" className="h-8 rounded-full border-slate-100 text-[9px] font-black uppercase tracking-widest gap-2 hover:bg-slate-50 shadow-sm">
                        <Link href={`/profile/${user?.uid}`}><ExternalLink className="w-3 h-3" /> Ver Hoja de Vida</Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-[32px] border border-slate-100 shadow-inner">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Tu Estado</p>
                    <p className={cn("text-xl font-black italic tracking-tighter uppercase", isOnline ? "text-green-600" : "text-slate-400")}>
                      {isOnline ? "OPERATIVO" : "DESCONECTADO"}
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsOnline(!isOnline)}
                    className={cn(
                      "rounded-full h-14 px-10 font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95",
                      isOnline ? "bg-red-50 text-red-500 hover:bg-red-100 shadow-red-100" : "bg-green-500 text-white hover:bg-green-600 shadow-green-200"
                    )}
                  >
                    {isOnline ? "Cerrar Turno" : "Iniciar Turno"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
                <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500"><TrendingUp className="w-5 h-5" /></div>
                  <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nivel</p><p className="text-sm font-black italic uppercase">{level.name}</p></div>
                </div>
                <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><CheckCircle2 className="w-5 h-5" /></div>
                  <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entregas</p><p className="text-sm font-black italic uppercase">{stats.count}+</p></div>
                </div>
                <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500"><Calendar className="w-5 h-5" /></div>
                  <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Unido hace</p><p className="text-sm font-black italic uppercase truncate">{profile?.createdAt ? formatDistanceToNow(profile.createdAt.toDate(), { locale: es }) : '...'}</p></div>
                </div>
                <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500"><Award className="w-5 h-5" /></div>
                  <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Balance</p><p className={cn("text-sm font-black italic uppercase", (profile?.balance || 0) < 0 ? "text-red-500" : "text-green-600")}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(profile?.balance || 0)}</p></div>
                </div>
              </div>
            </div>
          </div>

          <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
            <div className="mb-10">
              <WeeklyChallenge orders={history} />
            </div>

            <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="bg-white border h-16 p-1 rounded-full shadow-sm w-full grid grid-cols-3">
                <TabsTrigger value="available" className="rounded-full h-full font-black text-[10px] uppercase tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-white">RUTAS LIBRES</TabsTrigger>
                <TabsTrigger value="my-deliveries" className="rounded-full h-full font-black text-[10px] uppercase tracking-tighter data-[state=active]:bg-secondary data-[state=active]:text-white">ACTIVAS ({myDeliveries.length})</TabsTrigger>
                <TabsTrigger value="earnings" className="rounded-full h-full font-black text-[10px] uppercase tracking-tighter data-[state=active]:bg-slate-900 data-[state=active]:text-white">INGRESOS</TabsTrigger>
              </TabsList>

              <TabsContent value="available">
                {!isOnline ? (
                  <div className="text-center py-20 bg-slate-50 rounded-[48px] border-2 border-dashed space-y-4">
                    <Lock className="w-16 h-16 mx-auto text-slate-200" />
                    <h3 className="text-xl font-black text-slate-400 uppercase italic">Modo Desconectado</h3>
                    <Button onClick={() => setIsOnline(true)} className="rounded-full bg-green-500 h-12 shadow-lg px-8 font-black">Iniciar Turno Ahora</Button>
                  </div>
                ) : availableOrders.length > 0 ? (
                  <div className="grid gap-4">
                    {availableOrders.map(order => (
                      <Card key={order.id} className="border-none rounded-[32px] shadow-sm bg-white p-6 flex flex-col sm:flex-row items-center justify-between gap-6 ring-1 ring-slate-100 hover:shadow-xl transition-all">
                        <div className="space-y-2 flex-1 text-center sm:text-left">
                          <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase px-3">RUTA DISPONIBLE</Badge>
                          <h3 className="text-[2.2rem] font-black italic text-slate-900 tracking-tighter leading-[0.85] uppercase">{order.productName}</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2"><StoreIcon className="w-3 h-3" /> {order.storeName}</p>
                        </div>
                        <Button onClick={() => handleAcceptOrder(order.id)} className="w-full sm:w-auto rounded-full h-16 px-10 bg-primary text-white font-black uppercase text-xs tracking-widest gap-3 shadow-2xl active:scale-95 transition-transform">
                          ACEPTAR RUTA <ArrowRight className="w-5 h-5" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-300 font-black uppercase tracking-[0.2em] italic">Esperando nuevas rutas...</div>
                )}
              </TabsContent>

              <TabsContent value="my-deliveries">
                {myDeliveries.length > 0 ? (
                  <div className="grid gap-8">
                    {myDeliveries.map(order => (
                      <Card key={order.id} className="border-none rounded-[40px] shadow-2xl overflow-hidden bg-white ring-1 ring-black/5 cursor-pointer hover:scale-[1.02] transition-transform">
                        <div className="p-5 flex items-center justify-between text-white border-b bg-secondary">
                           <div className="flex items-center gap-3">
                              <Navigation className="w-6 h-6 animate-pulse" />
                              <span className="text-xs font-black uppercase tracking-[0.2em] italic">RECOGER EN TIENDA</span>
                           </div>
                           <Badge className="bg-white/20 text-white border-none rounded-full px-4 h-8 text-[10px] font-black italic uppercase">{order.storeName}</Badge>
                        </div>
                        <CardContent className="p-10 space-y-8">
                          <h3 className="text-[2.8rem] font-black text-slate-900 italic uppercase leading-[0.85] tracking-tighter">{order.productName}</h3>
                          <div className="flex items-center gap-3 text-primary font-black uppercase text-xs tracking-widest bg-slate-50 p-4 rounded-2xl">
                            <MapPin className="w-5 h-5" /> {order.storeAddress || 'Dirección de Tienda'}
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center italic">Pulsa para expandir misión</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-300 font-black uppercase tracking-[0.2em] italic">Sin misiones activas</div>
                )}
              </TabsContent>

              <TabsContent value="earnings">
                <Card className="border-none rounded-[48px] bg-slate-900 text-white p-10 overflow-hidden relative shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                  <div className="relative z-10 space-y-10">
                    <div className="flex items-center justify-between">
                      <CreditCard className="w-8 h-8 text-primary" />
                      <Badge className="bg-green-500 text-white border-none rounded-full px-5 font-black h-8 text-[10px] uppercase">ACTIVO PARA COBRO</Badge>
                    </div>
                    <div className="space-y-2">
                      <span className="text-7xl font-black tracking-tighter leading-none">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(stats.earnings)}
                      </span>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic ml-2">Total neto generado hoy</p>
                    </div>
                    <Button className="w-full h-20 rounded-full bg-white text-slate-900 font-black text-xl uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">Solicitar Transferencia</Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col p-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="text-white font-black uppercase text-xl tracking-tighter italic">Identidad Logística</h4>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Tómate una foto profesional</p>
            </div>
            <Button variant="ghost" size="icon" onClick={stopCamera} className="text-white rounded-full hover:bg-white/10"><X className="w-8 h-8" /></Button>
          </div>
          
          <div className="flex-1 relative rounded-[48px] overflow-hidden bg-slate-900 border-4 border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.3)]">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/20 border-dashed rounded-full" />
            </div>
          </div>

          <div className="py-12 flex flex-col items-center gap-6">
            <Button 
              onClick={capturePhoto} 
              disabled={isCapturing}
              className="w-24 h-24 rounded-full bg-white text-black border-[10px] border-slate-300 hover:scale-110 active:scale-90 transition-all shadow-2xl flex items-center justify-center"
            >
              {isCapturing ? <Loader2 className="w-10 h-10 animate-spin" /> : <Camera className="w-10 h-10" />}
            </Button>
            <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.4em]">Capturar ahora</span>
          </div>
        </div>
      )}
    </div>
  );
}
