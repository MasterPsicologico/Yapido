
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
  Wallet,
  ShieldCheck,
  Hash,
  ArrowUpRight,
  Edit3,
  Map as MapIcon,
  Save,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { OrderChat } from '@/components/chat/OrderChat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Link from 'next/link';
import { Label } from '@/components/ui/label';

const STATUS_CONFIG = {
  pending: { label: "PENDIENTE", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", icon: Timer },
  preparing: { label: "PREPARANDO", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", icon: Package },
  ready_for_pickup: { label: "LISTO EN TIENDA", color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", icon: CheckCircle2 },
  shipped: { label: "EN REPARTO", color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100", icon: Truck },
  delivered: { label: "ENTREGADO", color: "text-green-500", bg: "bg-green-50", border: "border-green-100", icon: CheckCircle2 },
  cancelled: { label: "CANCELADO", color: "text-red-500", bg: "bg-red-50", border: "border-red-100", icon: AlertTriangle }
};

export default function OrdersManagementPage() {
  const { user } = useUser();
  const { profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [showMyPurchases, setShowMyPurchases] = useState(false);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<any | null>(null);
  const [addressUpdateOrder, setAddressUpdateOrder] = useState<any | null>(null);
  const [newAddressValue, setNewAddressValue] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<string[]>([]);

  const myStoresQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'stores'), where('ownerId', '==', user.uid));
  }, [firestore, user?.uid]);
  const { data: myStores, isLoading: storesLoading } = useCollection(myStoresQuery);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'orders'), where('participants', 'array-contains', user.uid));
  }, [firestore, user?.uid]);
  const { data: rawOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  useEffect(() => {
    const handleDeepLinking = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && rawOrders && rawOrders.length > 0) {
        const targetOrder = rawOrders.find(o => o.id === hash);
        if (targetOrder) {
          if (targetOrder.customerId === user?.uid && targetOrder.storeOwnerId !== user?.uid) {
            setShowMyPurchases(true);
            setSelectedStoreId(null);
          } else {
            setSelectedStoreId(targetOrder.storeId);
            setShowMyPurchases(false);
          }
          setTimeout(() => {
            const el = document.getElementById(hash);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }
      }
    };

    if (!ordersLoading) handleDeepLinking();
    window.addEventListener('hashchange', handleDeepLinking);
    return () => window.removeEventListener('hashchange', handleDeepLinking);
  }, [rawOrders, ordersLoading, user?.uid]);

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

  const handleOpenAddressEditor = async (order: any) => {
    setAddressUpdateOrder(order);
    setNewAddressValue(order.customerAddress || "");
    setCustomerSuggestions([]);
    
    // FETCH INTELIGENTE: Obtener direcciones registradas del cliente para sugerencias
    if (firestore && order.customerId) {
      try {
        const userRef = doc(firestore, 'users', order.customerId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          const addrs = data.addresses || (data.address ? [data.address] : []);
          setCustomerSuggestions(addrs);
        }
      } catch (e) {}
    }
  };

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
    if (newStatus === 'preparing') updateData.isLogisticsPublic = true;
    updateDocumentNonBlocking(orderRef, updateData);
    toast({ title: "Estado Actualizado" });
  };

  const handleSaveAddressPatch = async () => {
    if (!firestore || !addressUpdateOrder || !newAddressValue.trim()) return;
    setIsSavingAddress(true);
    try {
      // 1. Actualizar el pedido instantáneamente
      const orderRef = doc(firestore, 'orders', addressUpdateOrder.id);
      updateDocumentNonBlocking(orderRef, { 
        customerAddress: newAddressValue.trim(),
        updatedAt: serverTimestamp() 
      });

      // 2. Actualizar el perfil del usuario para el futuro (Sincronización Total)
      const userRef = doc(firestore, 'users', addressUpdateOrder.customerId);
      updateDocumentNonBlocking(userRef, { 
        address: newAddressValue.trim(),
        updatedAt: serverTimestamp() 
      });

      toast({ title: "¡Ubicación Corregida!", description: "Sincronizada en el pedido y perfil del cliente." });
      setAddressUpdateOrder(null);
      setNewAddressValue("");
    } catch (e) {
      toast({ title: "Error al actualizar", variant: "destructive" });
    } finally {
      setIsSavingAddress(false);
    }
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
              onClick={() => { setSelectedStoreId(null); setShowMyPurchases(false); window.location.hash = ''; }}
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
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gestión Detallada</p>
              </div>
            </div>

            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Buscar por cliente o producto..." 
                className="w-full pl-10 h-12 rounded-2xl border-none bg-white shadow-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid gap-10">
            {filteredOrders && filteredOrders.length > 0 ? filteredOrders.map(order => {
              const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const isVenta = order.storeOwnerId === user?.uid;
              const dateStr = order.createdAt ? format(order.createdAt.toDate(), "d 'DE' MMMM, HH:mm", { locale: es }).toUpperCase() : 'Cargando...';
              
              const addressToDisplay = order.customerAddress || "DIRECCIÓN NO DETECTADA (Definir en chat)";

              return (
                <Card key={order.id} id={order.id} className="border-none rounded-[48px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.1)] bg-white ring-1 ring-black/[0.03] transition-all">
                  <CardContent className="p-0">
                    <div className="bg-slate-50 px-8 py-4 flex items-center justify-between border-b">
                      <div className="flex items-center gap-3">
                        <Hash className="w-3 h-3 text-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 tracking-[0.2em]">{order.id.slice(-8).toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span className="text-[9px] font-black text-slate-400 tracking-widest">{dateStr}</span>
                      </div>
                    </div>

                    <div className="p-8 space-y-8">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={cn("text-white border-none rounded-full px-5 h-8 text-[9px] font-black uppercase tracking-widest", isVenta ? "bg-primary" : "bg-secondary")}>
                          {isVenta ? "VENTA RECIBIDA" : "MI COMPRA"}
                        </Badge>
                        <div className={cn("flex items-center gap-2 px-4 h-8 rounded-full border", status.bg, status.color, status.border)}>
                          <status.icon className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{status.label}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-[2.8rem] font-black text-slate-900 italic uppercase leading-[0.85] tracking-tighter">
                          {order.productName}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 gap-6 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-slate-400">
                            <UserIcon className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">CLIENTE:</span>
                          </div>
                          <Link href={`/profile/${isVenta ? order.customerId : order.storeOwnerId}`} className="text-lg font-black text-slate-800 hover:text-primary transition-colors block leading-tight">
                            {isVenta ? order.customerName : order.storeName}
                          </Link>
                        </div>
                        <div className="space-y-1 relative group/addr">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-black uppercase tracking-[0.2em]">UBICACIÓN:</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenAddressEditor(order)}
                              className="h-8 w-8 rounded-full bg-white shadow-sm border opacity-0 group-hover/addr:opacity-100 transition-opacity"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-primary" />
                            </Button>
                          </div>
                          <p 
                            className={cn(
                              "text-lg font-black italic leading-tight transition-colors cursor-pointer", 
                              !order.customerAddress ? "text-red-500 animate-pulse" : "text-slate-800 hover:text-primary"
                            )}
                            onClick={() => handleOpenAddressEditor(order)}
                          >
                            {addressToDisplay}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice)}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-0.5 w-4 bg-slate-200" />
                          <span className="text-sm font-black text-slate-400 italic uppercase tracking-widest">
                            X{order.quantity} UNIDADES SOLICITADAS
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        {isVenta && (
                          <>
                            {order.status === 'pending' && (
                              <Button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="w-full h-16 rounded-[24px] bg-primary text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                                <Package className="w-6 h-6" /> INICIAR PREPARACIÓN
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')} className="w-full h-16 rounded-[24px] bg-indigo-600 text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-all">
                                <CheckCircle2 className="w-6 h-6" /> MARCAR COMO LISTO
                              </Button>
                            )}
                          </>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                          <Button 
                            onClick={() => handleWhatsAppChat(isVenta ? order.customerPhone : '', order.productName)} 
                            className="w-full h-16 rounded-[24px] bg-[#22c55e] text-white font-black text-lg uppercase tracking-widest gap-3 shadow-xl shadow-green-500/20 border-none hover:bg-[#1eb34b] transition-all"
                          >
                            <MessageCircle className="w-7 h-7" /> CHAT CLIENTE
                          </Button>
                          
                          <Button 
                            onClick={() => setSelectedOrderForChat(order)} 
                            className="w-full h-12 rounded-[20px] bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.3em] gap-2 shadow-2xl hover:bg-slate-800 transition-all border-none"
                          >
                            <ShieldCheck className="w-4 h-4 text-primary" /> CHAT INTERNO DE SOPORTE
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest italic bg-white rounded-[48px] border-2 border-dashed">
                Sin pedidos en este historial
              </div>
            )}
          </div>
        </main>
        
        {/* DIÁLOGO DE PARCHE DE DIRECCIÓN (Resolución Inteligente) */}
        <Dialog open={!!addressUpdateOrder} onOpenChange={(v) => !v && setAddressUpdateOrder(null)}>
          <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-slate-900">
                <MapIcon className="w-7 h-7 text-primary" /> Resolver Ubicación
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-medium">
                ¿Hubo un error? Corrige la dirección aquí. Esto actualizará el pedido y el perfil del cliente automáticamente.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
              {/* SUGERENCIAS INTELIGENTES */}
              {customerSuggestions.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Sugerencias del Perfil
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {customerSuggestions.map((addr, i) => (
                      <button 
                        key={i}
                        onClick={() => setNewAddressValue(addr)}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-[11px] font-bold border transition-all text-left",
                          newAddressValue === addr 
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" 
                            : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                        )}
                      >
                        {addr}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Dirección de Entrega</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input 
                    value={newAddressValue} 
                    onChange={(e) => setNewAddressValue(e.target.value)}
                    placeholder="Ej: Calle 5 # 10-20, Barrio El Centro"
                    className="h-14 rounded-2xl bg-slate-50 border-none pl-12 font-bold focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 py-2 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                <RefreshCw className={cn("w-3 h-3 text-blue-500", isSavingAddress && "animate-spin")} />
                <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest italic">
                  Sincronización Bidireccional Activa
                </p>
              </div>
            </div>

            <DialogFooter className="sm:justify-center">
              <Button 
                onClick={handleSaveAddressPatch} 
                disabled={isSavingAddress || !newAddressValue.trim()}
                className="w-full h-14 rounded-full bg-primary text-white font-black text-lg gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isSavingAddress ? <Loader2 className="animate-spin" /> : <><Save className="w-5 h-5" /> Guardar y Sincronizar</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedOrderForChat} onOpenChange={(v) => !v && setSelectedOrderForChat(null)}>
          <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[450px]">
            <DialogHeader className="sr-only">
              <DialogTitle>Chat Interno</DialogTitle>
              <DialogDescription>Soporte directo de Vitriniando</DialogDescription>
            </DialogHeader>
            {selectedOrderForChat && <OrderChat orderId={selectedOrderForChat.id} orderData={selectedOrderForChat} onClose={() => setSelectedOrderForChat(null)} />}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-primary/20">
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
