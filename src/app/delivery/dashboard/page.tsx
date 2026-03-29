
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
  ChevronLeft
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { WeeklyChallenge } from '@/components/delivery/WeeklyChallenge';

export default function DeliveryDashboardPage() {
  const { user } = useUser();
  const { profile, level, isLoading: loadingProfile } = useProfile();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState("available");
  const [isOnline, setIsOnline] = useState(true);
  
  // Estados de Cámara e Identidad
  const [showCamera, setShowCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Estados de Geovalla y Seguimiento
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const watchId = useRef<number | null>(null);

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

  // LÓGICA DE GEOLOCALIZACIÓN Y LLEGADA AUTOMÁTICA
  useEffect(() => {
    if (activeMission && activeMission.status === 'shipped' && typeof window !== 'undefined' && navigator.geolocation) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation(position.coords);
          // Simulación de geovalla para demo (en un entorno real necesitaríamos lat/lng de la tienda)
          // Si el usuario está activo y la misión es 'shipped', monitoreamos.
          // Por ahora, como no tenemos coordenadas reales en el backend, dejamos el motor listo para cuando se integren.
        },
        (error) => console.error("Error GPS:", error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [activeMission]);

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

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      {/* VISTA DE MISIÓN ACTIVA (PANTALLA COMPLETA) */}
      {activeMission ? (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
          <div className="h-16 bg-slate-900 flex items-center justify-between px-6 text-white shrink-0">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Misión en Curso</span>
            </div>
            <Badge className="bg-primary text-white border-none font-black italic px-4 uppercase">{activeMission.status === 'shipped' ? 'EN RUTA' : 'EN TIENDA'}</Badge>
          </div>

          <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-6 space-y-10">
            <div className="space-y-2 text-center pt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Producto a Recoger</p>
              <h1 className="text-[3.2rem] font-black italic uppercase tracking-tighter leading-[0.85] text-slate-900">
                {activeMission.productName}
              </h1>
              <div className="flex items-center justify-center gap-2 mt-4">
                <StoreIcon className="w-4 h-4 text-primary" />
                <p className="text-sm font-black uppercase italic text-slate-600">{activeMission.storeName}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-2xl space-y-8 ring-1 ring-black/[0.03]">
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubicación Tienda</p>
                    <p className="text-lg font-black uppercase italic text-slate-800 truncate">{activeMission.storeAddress || 'Aguachica'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Button 
                    onClick={() => handleOpenMaps(activeMission.storeAddress)}
                    className="h-20 rounded-[28px] bg-slate-900 hover:bg-black text-white font-black text-xl uppercase tracking-tighter italic gap-4 shadow-2xl active:scale-95 transition-all"
                  >
                    <MapPinned className="w-8 h-8 text-primary" /> DIRIGIRME A LA TIENDA
                  </Button>
                  
                  {activeMission.status === 'shipped' ? (
                    <Button 
                      onClick={() => handleManualArrival(activeMission.id)}
                      className="h-20 rounded-[28px] bg-secondary hover:bg-secondary/90 text-white font-black text-xl uppercase tracking-tighter italic gap-4 shadow-xl active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-8 h-8" /> YA ESTOY EN LA TIENDA
                    </Button>
                  ) : (
                    <div className="bg-green-50 border-2 border-green-100 p-6 rounded-[28px] flex flex-col items-center gap-2 text-center animate-in zoom-in">
                      <ShieldCheck className="w-10 h-10 text-green-500" />
                      <p className="text-sm font-black uppercase text-green-700">Estado: Notificando Despacho</p>
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">El vendedor está preparando tu entrega</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-dashed flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-slate-100">
                    <AvatarFallback className="bg-slate-50 text-slate-400 font-black">C</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                    <p className="text-xs font-black uppercase">{activeMission.customerName}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 text-slate-600 h-12 w-12">
                  <MessageCircle className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </main>

          <div className="p-6 bg-white border-t">
            <p className="text-[8px] text-center text-slate-300 font-black uppercase tracking-[0.4em]">Seguimiento GPS Activo • Vitriniando Seguro</p>
          </div>
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
                  <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Garantía</p><p className="text-sm font-black italic uppercase">VIP</p></div>
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
