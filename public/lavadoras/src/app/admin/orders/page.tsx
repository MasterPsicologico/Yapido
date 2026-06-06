"use client";

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  MessageCircle, 
  Package, 
  Loader2, 
  Timer,
  AlertTriangle,
  ArrowRight,
  Store as StoreIcon,
  ChevronRight,
  ArrowLeft,
  Wallet,
  ShieldCheck,
  Lock,
  Star,
  RotateCcw,
  MapPin,
  TrendingUp,
  Zap,
  Truck,
  User as UserIcon,
  XCircle,
  Award,
  BarChart3,
  Activity,
  Archive,
  Trash2
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { OrderChat } from '@/components/chat/OrderChat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RatingDialog } from '@/components/order/RatingDialog';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FleetMap } from '@/components/delivery/fleet/FleetMap';
import { useFleetLiveLocations } from '@/hooks/use-fleet-live-locations';
import { Map as MapIcon } from 'lucide-react';

const STATUS_CONFIG: Record<string, {label: string, color: string, bg: string, border: string, icon: any}> = {
  inquiry: { label: "CONSULTA", color: "text-cyan-500", bg: "bg-cyan-50", border: "border-cyan-100", icon: MessageCircle },
  pending: { label: "PENDIENTE", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", icon: Timer },
  preparing: { label: "PREPARANDO", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", icon: Package },
  ready_for_pickup: { label: "LISTO EN TIENDA", color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", icon: CheckCircle2 },
  at_store: { label: "REPARTIDOR EN TIENDA", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: ShieldCheck },
  delivered_to_driver: { label: "CON REPARTIDOR", color: "text-purple-500", bg: "bg-purple-100", border: "border-purple-200", icon: Zap },
  shipped: { label: "EN REPARTO", color: "text-purple-500", bg: "bg-purple-100", border: "border-purple-200", icon: Truck },
  delivered: { label: "ENTREGADO", color: "text-emerald-500", bg: "bg-emerald-100", border: "border-emerald-200", icon: CheckCircle2 },
  cancelled: { label: "CANCELADO", color: "text-red-500", bg: "bg-red-100", border: "border-red-200", icon: AlertTriangle }
};

export default function OrdersManagementPage() {
  const { user } = useUser();
  const { profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [showMyPurchases, setShowMyPurchases] = useState(false);
  const [showFleetMap, setShowFleetMap] = useState(false);

  // EFECTO DE NAVEGACIÓN DIRECTA
  useEffect(() => {
    const handleHash = () => {
      const hashId = window.location.hash.replace('#', '');
      if (hashId && hashId.length > 5) {
        setActiveOrderId(hashId);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (!profileLoading && profile && !profile.phoneNumber) {
      toast({ title: "Acceso Restringido", description: "Registra tu teléfono.", variant: "destructive" });
      router.push('/profile');
    }
  }, [profile, profileLoading, router]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'orders'), where('participants', 'array-contains', user.uid));
  }, [firestore, user?.uid]);
  const { data: rawOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'system_admin';

  const myStoresQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    if (isAdmin) {
      return query(collection(firestore, 'stores'));
    }
    return query(collection(firestore, 'stores'), where('ownerId', '==', user.uid));
  }, [firestore, user?.uid, isAdmin]);
  const { data: myStores, isLoading: storesLoading } = useCollection(myStoresQuery);

  const contractedStoreIds = profile?.contractedStores || [];
  const trustedStoresQuery = useMemoFirebase(() => {
    if (!firestore || contractedStoreIds.length === 0) return null;
    return query(collection(firestore, 'stores'), where('id', 'in', contractedStoreIds.slice(0, 10)));
  }, [firestore, contractedStoreIds]);
  const { data: trustedStores } = useCollection(trustedStoresQuery);

  const { drivers, isLive } = useFleetLiveLocations({ storeId: selectedStoreId || undefined });

  const storeSummaries = useMemo(() => {
    if (!myStores || !rawOrders) return [];
    return myStores.map(store => {
      const storeOrders = rawOrders.filter(o => o.storeId === store.id);
      const active = storeOrders.filter(o => !['delivered', 'cancelled', 'inquiry'].includes(o.status));
      const todayDelivered = storeOrders.filter(o => o.status === 'delivered' && o.createdAt && isToday(o.createdAt.toDate()));
      const revenueToday = todayDelivered.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
      return { ...store, activeCount: active.length, todayCount: todayDelivered.length, revenueToday };
    });
  }, [myStores, rawOrders]);

  const globalKPIs = useMemo(() => {
    return storeSummaries.reduce((acc, curr) => ({
      activeCount: acc.activeCount + curr.activeCount,
      revenueToday: acc.revenueToday + curr.revenueToday,
    }), { activeCount: 0, revenueToday: 0 });
  }, [storeSummaries]);

  const handleDeleteStore = async (e: React.MouseEvent, storeId: string) => {
    e.stopPropagation(); // Evitar que el click abra la tarjeta
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta tienda? Esta acción no se puede deshacer.")) return;
    try {
      await deleteDoc(doc(firestore, 'stores', storeId));
      toast({ title: "Tienda eliminada exitosamente" });
      if (selectedStoreId === storeId) {
        setSelectedStoreId(null);
      }
    } catch (err) {
      toast({ title: "Error al eliminar", description: "Verifica tus permisos o conexión.", variant: "destructive" });
    }
  };

  if (profileLoading || ordersLoading || storesLoading) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  const isDetailView = selectedStoreId || showMyPurchases;
  const filteredOrders = isDetailView ? rawOrders?.filter(o => {
    if (showMyPurchases) return o.customerId === user?.uid;
    return o.storeId === selectedStoreId;
  }).sort((a, b) => {
    const timeA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
    const timeB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  }) : [];

  const activeFilteredOrders = filteredOrders?.filter(o => !['delivered', 'cancelled'].includes(o.status)) || [];
  const historyFilteredOrders = filteredOrders?.filter(o => ['delivered', 'cancelled'].includes(o.status)) || [];

  const renderOrderCard = (order: any) => {
    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    const isSeller = order.storeOwnerId === user?.uid;

    return (
      <Card key={order.id} id={order.id} className="relative overflow-hidden border-none rounded-[32px] bg-white shadow-lg hover:shadow-xl transition-all duration-300 ring-1 ring-black/[0.03] group">
        {/* Decoración lateral color estado */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 opacity-80", config.bg.replace('bg-', 'bg-').replace('50', '400').replace('100', '500'))} />
        
        <CardContent className="p-6 sm:p-8 space-y-5">
          {/* Header de la tarjeta */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Badge className={cn("w-fit text-[9px] font-black uppercase px-3 h-6 border-none shadow-sm", isSeller ? "bg-slate-900 text-white" : "bg-primary text-white")}>
                {isSeller ? "VENTA" : "COMPRA"}
              </Badge>
              <Badge variant="outline" className={cn("w-fit text-[9px] font-black uppercase px-3 h-6 border", config.border, config.color, config.bg)}>
                <Icon className="w-3 h-3 mr-1.5 inline-block" />
                {config.label}
              </Badge>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-full">
              {order.createdAt ? format(order.createdAt.toDate(), "dd MMM, HH:mm", { locale: es }) : ''}
            </span>
          </div>

          {/* Info Principal */}
          <div>
            <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
              {order.productName}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-slate-500">
              <StoreIcon className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">{order.storeName}</span>
            </div>
          </div>

          {/* Totales y Acciones */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total a Pagar</p>
              <span className="text-3xl font-black text-slate-900 tracking-tighter">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice || 0)}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => setActiveOrderId(order.id)} 
                className="flex-1 sm:flex-none h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                CHAT INTERNO
              </Button>
              {order.customerPhone && (
                <Button 
                  onClick={() => window.open(`https://wa.me/57${(order.customerPhone || '').replace(/\D/g, '')}`)} 
                  variant="outline"
                  className="flex-1 sm:flex-none h-12 rounded-2xl border-2 border-[#25d366] text-[#25d366] hover:bg-[#25d366] hover:text-white font-black text-[10px] sm:text-xs uppercase tracking-widest gap-2 transition-all"
                >
                  WHATSAPP
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fa]">
      <Navbar />
      
      {isDetailView ? (
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl animate-in slide-in-from-right-4 duration-300">
          <Button variant="ghost" onClick={() => { setSelectedStoreId(null); setShowMyPurchases(false); }} className="mb-6 gap-2 text-slate-500 font-bold hover:text-primary hover:bg-white/50 rounded-full px-4">
            <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
          </Button>
          
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-slate-900 break-words">
                {showMyPurchases ? "Mis Compras" : myStores?.find(s => s.id === selectedStoreId)?.name}
              </h1>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-1">Gestión de Órdenes</p>
            </div>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="w-full sm:w-auto grid grid-cols-2 mb-8 bg-slate-200/50 p-1 rounded-2xl h-14">
              <TabsTrigger value="active" className="rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                Activas ({activeFilteredOrders.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all">
                Historial ({historyFilteredOrders.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeFilteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-bold text-slate-400">No hay órdenes activas en este momento</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {activeFilteredOrders.map(renderOrderCard)}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {historyFilteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                  <Archive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-bold text-slate-400">El historial de órdenes está vacío</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {historyFilteredOrders.map(renderOrderCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>

        </main>
      ) : (
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl space-y-10 animate-in fade-in duration-500">
          
          {/* ENCABEZADO PANEL MAESTRO */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-4">
              <Link href="/admin/manage" className="group flex items-center gap-2 text-slate-500 font-bold hover:text-primary transition-colors w-fit bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none mt-0.5">Volver a Consola</span>
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-[20px] flex items-center justify-center text-white shadow-lg shadow-primary/30 transform rotate-3">
                  <BarChart3 className="w-8 h-8 -rotate-3" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none text-slate-900 drop-shadow-sm break-words">Panel Maestro</h1>
                  <p className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.4em] mt-2">Centro de Comando Digital</p>
                </div>
              </div>
            </div>
            
            {/* GLOBAL KPIs */}
            <div className="flex gap-4">
              <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Activity className="w-3 h-3 text-orange-500" /> Órdenes Activas</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{globalKPIs.activeCount}</p>
              </div>
              <div className="bg-slate-900 px-6 py-4 rounded-3xl shadow-lg shadow-slate-900/20 flex flex-col justify-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Wallet className="w-3 h-3 text-emerald-400" /> Ingresos Hoy</p>
                <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(globalKPIs.revenueToday)}
                </p>
              </div>
              <Button onClick={() => setShowFleetMap(true)} className="px-6 py-4 rounded-3xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 flex flex-col justify-center gap-1">
                <p className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-1.5"><MapIcon className="w-3 h-3" /> Mapa en Vivo</p>
                <p className="text-[8px] font-bold text-white/70 uppercase tracking-wider">{drivers.length} activo{drivers.length !== 1 ? 's' : ''}</p>
              </Button>
            </div>
          </div>

          {/* SECCIÓN PROVEEDORES DE CONFIANZA */}
          {trustedStores && trustedStores.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><Award className="w-4 h-4 text-amber-600" /></div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Proveedores de Confianza</h3>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                {trustedStores.map(store => (
                  <Link key={store.id} href={`/stores/${store.id}`}>
                    <Card className="min-w-[140px] border border-slate-100 rounded-[28px] bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-4 text-center space-y-3 group cursor-pointer">
                      <div className="relative w-14 h-14 mx-auto rounded-[18px] overflow-hidden bg-slate-50 border border-slate-100">
                        <Image src={store.imageUrl || 'https://picsum.photos/seed/store/200'} alt={store.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase italic tracking-tighter text-slate-900 truncate">{store.name}</p>
                        <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-black uppercase px-2 h-5 mt-2 transition-colors group-hover:bg-amber-100">Volver a pedir</Badge>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="grid md:grid-cols-12 gap-6 lg:gap-8">
            
            {/* SECCIÓN MIS TIENDAS (VENTAS) */}
            <section className="md:col-span-7 lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><StoreIcon className="w-4 h-4 text-blue-600" /></div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">
                  {isAdmin ? "Todas las Tiendas (Admin)" : "Mis Puntos de Venta"}
                </h3>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {storeSummaries.map((store) => (
                  <Card key={store.id} onClick={() => setSelectedStoreId(store.id)} className="group relative border border-slate-100 rounded-[32px] shadow-sm bg-white cursor-pointer hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden flex flex-col">
                    <div className="p-6 pb-4 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <StoreIcon className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex items-center gap-2">
                          {store.driverCode ? (
                            <Badge variant="outline" className="bg-slate-50 font-mono text-[10px] font-black tracking-widest text-slate-500 border-primary/20 text-primary">
                              CODE: {store.driverCode}
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                                await updateDocumentNonBlocking(doc(firestore, 'stores', store.id), { driverCode: code });
                                toast({ title: "Código Generado", description: `Nuevo código: ${code}` });
                              }}
                            >
                              Generar Código
                            </Button>
                          )}
                          {(isAdmin || store.ownerId === user?.uid) && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-red-500 z-10 transition-colors rounded-full"
                              onClick={(e) => handleDeleteStore(e, store.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{store.name}</h2>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-400 truncate">{store.address || 'Ubicación no especificada'}</p>
                      </div>
                    </div>
                    
                    <div className="px-6 py-5 bg-slate-50 mt-auto border-t border-slate-100/50 group-hover:bg-primary/[0.02] transition-colors">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Órdenes Activas</p>
                          <span className={cn("text-xl font-black tracking-tighter", store.activeCount > 0 ? "text-orange-500" : "text-slate-900")}>{store.activeCount}</span>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ventas Hoy</p>
                          <span className={cn("text-sm font-black tracking-tighter", store.revenueToday > 0 ? "text-emerald-500" : "text-slate-900")}>
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(store.revenueToday)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Flecha indicadora de hover */}
                    <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                  </Card>
                ))}

                {storeSummaries.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-white rounded-[32px] border border-dashed border-slate-200">
                    <StoreIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No tienes tiendas registradas</p>
                  </div>
                )}
              </div>
            </section>

            {/* SECCIÓN MIS COMPRAS */}
            <section className="md:col-span-5 lg:col-span-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center"><UserIcon className="w-4 h-4 text-purple-600" /></div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Área Personal</h3>
              </div>
              
              <Card onClick={() => setShowMyPurchases(true)} className="group relative border-none rounded-[32px] shadow-lg bg-gradient-to-br from-slate-900 to-black text-white cursor-pointer hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 overflow-hidden min-h-[220px] flex flex-col justify-end p-8">
                {/* Elementos decorativos de fondo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full" />
                <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <ArrowRight className="w-5 h-5 text-white -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                </div>
                
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-primary mb-6 border border-white/10">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Mis Compras</h3>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-relaxed">
                    Historial de pedidos, seguimientos activos y chats directos.
                  </p>
                </div>
              </Card>
            </section>

          </div>
        </main>
      )}

      {/* DIÁLOGO DEL CHAT */}
      <Dialog open={!!activeOrderId} onOpenChange={(v) => { if(!v) { setActiveOrderId(null); window.location.hash = ''; } }}>
        <DialogContent className="p-0 border-none bg-white max-w-none w-screen h-[100dvh] flex flex-col z-[500] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat Maestro de Órdenes</DialogTitle>
            <DialogDescription>Gestión centralizada de comunicación.</DialogDescription>
          </DialogHeader>
          {activeOrderId && <OrderChat orderId={activeOrderId} orderData={rawOrders?.find(o => o.id === activeOrderId)} onClose={() => { setActiveOrderId(null); window.location.hash = ''; }} />}
        </DialogContent>
      </Dialog>

      {/* MAPA EN VIVO DE REPARTIDORES */}
      <FleetMap isOpen={showFleetMap} onClose={() => setShowFleetMap(false)} drivers={drivers} />
    </div>
  );
}

