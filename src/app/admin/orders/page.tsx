
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Truck, 
  MessageCircle, 
  Package, 
  Search, 
  Loader2, 
  Zap,
  User as UserIcon,
  Timer,
  AlertTriangle,
  ArrowRight,
  Calendar,
  MapPin,
  Store as StoreIcon,
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { OrderChat } from '@/components/chat/OrderChat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Link from 'next/link';

const STATUS_CONFIG = {
  pending: { label: "PENDIENTE", color: "bg-orange-500", icon: Timer },
  preparing: { label: "PREPARANDO", color: "bg-blue-500", icon: Package },
  ready_for_pickup: { label: "LISTO PARA REPARTO", color: "bg-indigo-500", icon: CheckCircle2 },
  shipped: { label: "EN REPARTO", color: "bg-purple-500", icon: Truck },
  delivered: { label: "ENTREGADO", color: "bg-green-500", icon: CheckCircle2 },
  cancelled: { label: "CANCELADO", color: "bg-red-500", icon: AlertTriangle }
};

export default function OrdersManagementPage() {
  const { user } = useUser();
  const { profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [showMyPurchases, setShowMyPurchases] = useState(false);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<any | null>(null);

  // 1. Consultar tiendas propiedad del usuario
  const myStoresQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'stores'), where('ownerId', '==', user.uid));
  }, [firestore, user?.uid]);
  const { data: myStores, isLoading: storesLoading } = useCollection(myStoresQuery);

  // 2. Consultar todas las órdenes donde participa
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'orders'), where('participants', 'array-contains', user.uid));
  }, [firestore, user?.uid]);
  const { data: rawOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  // 3. Procesar datos para las tarjetas de resumen de tiendas
  const storeSummaries = useMemo(() => {
    if (!myStores || !rawOrders) return [];
    return myStores.map(store => {
      const storeOrders = rawOrders.filter(o => o.storeId === store.id);
      const active = storeOrders.filter(o => !['delivered', 'cancelled'].includes(o.status));
      const todayDelivered = storeOrders.filter(o => o.status === 'delivered' && o.createdAt && isToday(o.createdAt.toDate()));
      const revenueToday = todayDelivered.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

      return {
        ...store,
        activeCount: active.length,
        todayCount: todayDelivered.length,
        revenueToday
      };
    });
  }, [myStores, rawOrders]);

  const myPurchasesCount = useMemo(() => {
    if (!rawOrders || !user) return 0;
    return rawOrders.filter(o => o.customerId === user.uid).length;
  }, [rawOrders, user]);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
    if (newStatus === 'preparing') updateData.isLogisticsPublic = true;
    updateDocumentNonBlocking(orderRef, updateData);
    toast({ title: "Estado Actualizado" });
  };

  const handleWhatsAppChat = (phone: string, productName: string) => {
    if (!phone) {
      toast({ title: "Sin número", variant: "destructive" });
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Hola, te hablo de Vitriniando sobre tu pedido de ${productName}.`;
    window.open(`https://wa.me/57${cleanPhone.startsWith('57') ? cleanPhone.slice(2) : cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (profileLoading || ordersLoading || storesLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando Gestión...</p>
        </div>
      </div>
    );
  }

  // Vista Detallada de una Tienda o Mis Compras
  if (selectedStoreId || showMyPurchases) {
    const contextName = showMyPurchases ? "Mis Compras" : storeSummaries.find(s => s.id === selectedStoreId)?.name;
    const filteredOrders = rawOrders?.filter(o => {
      const matchesSearch = o.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || o.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (showMyPurchases) return o.customerId === user?.uid;
      return o.storeId === selectedStoreId;
    }).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex flex-col gap-6 mb-10">
            <Button 
              variant="ghost" 
              onClick={() => { setSelectedStoreId(null); setShowMyPurchases(false); }}
              className="w-fit gap-2 text-slate-400 font-bold hover:text-primary p-0 h-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Volver a mis Vitrinas
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary rounded-[22px] flex items-center justify-center text-white shadow-xl">
                <ClipboardList className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{contextName}</h1>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Control en Vivo</p>
              </div>
            </div>

            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Buscar cliente o producto..." 
                className="pl-10 h-12 rounded-2xl border-none bg-white shadow-sm font-medium" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid gap-8">
            {filteredOrders && filteredOrders.length > 0 ? filteredOrders.map(order => {
              const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const isVenta = order.storeOwnerId === user?.uid;
              const dateStr = order.createdAt ? format(order.createdAt.toDate(), "d 'DE' MMMM, HH:mm", { locale: es }).toUpperCase() : 'Cargando...';
              
              return (
                <Card key={order.id} id={order.id} className="border-none rounded-[48px] overflow-hidden shadow-2xl bg-white">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={cn("text-white border-none rounded-full px-6 h-10 text-[10px] font-black uppercase tracking-widest", isVenta ? "bg-primary" : "bg-secondary")}>
                        <Zap className="w-3.5 h-3.5 mr-2" />
                        {isVenta ? "VENTA RECIBIDA" : "MI COMPRA"}
                      </Badge>
                      <Badge className={cn(status.color, "text-white border-none rounded-full px-6 h-10 text-[10px] font-black uppercase tracking-widest gap-2")}>
                        <Clock className="w-3.5 h-3.5" /> {status.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 w-fit px-5 py-2 rounded-full border border-slate-100">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dateStr}</span>
                    </div>

                    <div className="space-y-5">
                      <h3 className="text-[2.8rem] font-black text-slate-900 italic uppercase leading-none tracking-tighter">
                        {order.productName}
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <UserIcon className="w-4.5 h-4.5 text-primary" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">CLIENTE: </span>
                          <Link href={`/profile/${isVenta ? order.customerId : order.storeOwnerId}`} className="text-base font-black text-slate-800 hover:text-primary">{isVenta ? order.customerName : order.storeName}</Link>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4.5 h-4.5 text-secondary" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">UBICACIÓN: </span>
                          <span className="text-base font-black text-slate-800 italic">WhatsApp</span>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-2 pt-2">
                        <span className="text-6xl font-black text-slate-900 tracking-tighter">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] italic">X{order.quantity}UN.</span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      {isVenta && order.status === 'pending' && (
                        <Button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="w-full h-16 rounded-full bg-primary font-black text-sm uppercase tracking-widest gap-3 shadow-xl">
                          <Package className="w-6 h-6" /> PREPARAR
                        </Button>
                      )}
                      {isVenta && order.status === 'preparing' && (
                        <Button onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')} className="w-full h-16 rounded-full bg-indigo-600 font-black text-sm uppercase tracking-widest gap-3 shadow-xl">
                          <CheckCircle2 className="w-6 h-6" /> LISTO EN TIENDA
                        </Button>
                      )}
                      <Button onClick={() => handleWhatsAppChat(isVenta ? order.customerPhone : '', order.productName)} className="w-full h-18 rounded-full bg-[#22c55e] font-black text-lg uppercase tracking-widest gap-3 shadow-xl border-none">
                        <MessageCircle className="w-7 h-7" /> CHAT CLIENTE
                      </Button>
                      <Button variant="ghost" onClick={() => setSelectedOrderForChat(order)} className="w-full h-10 rounded-full text-slate-300 font-black text-[9px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-colors">
                        CHAT INTERNO DE SOPORTE
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest italic">Sin pedidos en este historial</div>
            )}
          </div>
        </main>
        <Dialog open={!!selectedOrderForChat} onOpenChange={(v) => !v && setSelectedOrderForChat(null)}>
          <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[450px]">
            <DialogHeader className="sr-only"><DialogTitle>Chat</DialogTitle><DialogDescription>Conversación</DialogDescription></DialogHeader>
            {selectedOrderForChat && <OrderChat orderId={selectedOrderForChat.id} orderData={selectedOrderForChat} onClose={() => setSelectedOrderForChat(null)} />}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // VISTA MAESTRA: Selector de Tiendas
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center text-white shadow-2xl">
            <StoreIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Mis Negocios</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Panel Maestro de Control</p>
          </div>
        </div>

        <div className="grid gap-6">
          {storeSummaries.map((store) => (
            <Card 
              key={store.id} 
              onClick={() => setSelectedStoreId(store.id)}
              className="border-none rounded-[40px] overflow-hidden shadow-xl bg-white hover:shadow-2xl transition-all cursor-pointer group relative"
            >
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <StoreIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">{store.name}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En Línea</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-5 rounded-3xl space-y-1">
                    <div className="flex items-center gap-2 text-orange-500">
                      <Timer className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Ventas Vivas</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{store.activeCount}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl space-y-1">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Éxitos Hoy</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{store.todayCount}</p>
                  </div>
                </div>

                <div className="bg-primary/5 p-6 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">Ingresos del Día</p>
                      <p className="text-xl font-black text-slate-900 mt-1">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(store.revenueToday)}
                      </p>
                    </div>
                  </div>
                  <Button size="icon" className="rounded-full bg-primary text-white shadow-lg group-hover:scale-110 transition-transform">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Tarjeta de Mis Compras */}
          <Card 
            onClick={() => setShowMyPurchases(true)}
            className="border-none rounded-[40px] overflow-hidden shadow-md bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer group"
          >
            <CardContent className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-secondary">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">Mis Compras Personales</h3>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">{myPurchasesCount} órdenes totales</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-white/20 group-hover:text-white transition-colors" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
