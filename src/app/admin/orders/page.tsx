
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Info,
  Truck,
  User as UserIcon
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { OrderChat } from '@/components/chat/OrderChat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RatingDialog } from '@/components/order/RatingDialog';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.131.57-.074 1.758-.706 2.006-1.388.248-.683.248-1.265.173-1.388-.075-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .01 5.393 0 12.03c0 2.123.54 4.197 1.57 6.05L0 24l6.15-1.612a11.81 11.81 0 005.89 1.568h.005c6.634 0 12.04-5.39 12.043-12.03a11.82 11.82 0 00-3.48-8.513z"/>
  </svg>
);

const STATUS_CONFIG = {
  inquiry: { label: "CONSULTA", color: "text-cyan-500", bg: "bg-cyan-50", border: "border-cyan-100", icon: MessageCircle },
  pending: { label: "PENDIENTE", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", icon: Timer },
  preparing: { label: "PREPARANDO", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", icon: Package },
  ready_for_pickup: { label: "LISTO EN TIENDA", color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", icon: CheckCircle2 },
  at_store: { label: "REPARTIDOR EN TIENDA", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: ShieldCheck },
  delivered_to_driver: { label: "CON REPARTIDOR", color: "text-purple-500", bg: "bg-purple-100", border: "border-purple-200", icon: Zap },
  shipped: { label: "EN REPARTO", color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100", icon: Zap },
  delivered: { label: "ENTREGADO", color: "text-green-500", bg: "bg-green-100", border: "border-green-200", icon: CheckCircle2 },
  cancelled: { label: "CANCELADO", color: "text-red-500", bg: "bg-red-100", border: "border-red-200", icon: AlertTriangle }
};

export default function OrdersManagementPage() {
  const { user } = useUser();
  const { profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();
  const { addToCart } = useCart();
  const router = useRouter();
  
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [showMyPurchases, setShowMyPurchases] = useState(false);
  const [validatingOrder, setValidatingOrder] = useState<any | null>(null);
  
  const [ratingOrder, setRatingOrder] = useState<any | null>(null);
  const [ratingType, setRatingType] = useState<'to_store' | 'to_driver' | 'to_customer'>('to_store');

  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!profileLoading && profile && !profile.phoneNumber) {
      toast({ 
        title: "Acceso Restringido", 
        description: "Registra tu teléfono para gestionar órdenes.", 
        variant: "destructive" 
      });
      router.push('/profile');
    }
  }, [profile, profileLoading, router]);

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

  // LÓGICA DE ATENCIÓN INMEDIATA: Diferencia entre abrir chat y atender pedido
  useEffect(() => {
    const handleOrderAttended = (e: any) => {
      const id = e.detail?.orderId;
      if (!id || !rawOrders) return;

      const order = rawOrders.find(o => o.id === id);
      if (order) {
        // 1. Navegar al contexto correcto (Venta o Compra)
        if (order.storeOwnerId === user?.uid) {
          setSelectedStoreId(order.storeId);
          setShowMyPurchases(false);
        } else {
          setShowMyPurchases(true);
          setSelectedStoreId(null);
        }

        // 2. Expandir la tarjeta automáticamente
        setExpandedOrders(prev => ({ ...prev, [id]: true }));

        // 3. Scroll quirúrgico al pedido
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    const handleChatOpened = (e: any) => {
      const id = e.detail?.orderId;
      if (id) {
        setActiveOrderId(id);
        window.location.hash = id;
      }
    };

    // Sincronizar desde el hash de la URL al cargar
    const syncFromHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        // Por defecto, si viene de una URL con hash, intentamos "atender"
        // Si no se especifica evento, expandimos la tarjeta
        handleOrderAttended({ detail: { orderId: hash } });
      }
    };

    syncFromHash();
    window.addEventListener('order-attended' as any, handleOrderAttended);
    window.addEventListener('chat-opened' as any, handleChatOpened);
    window.addEventListener('hashchange', syncFromHash);

    return () => {
      window.removeEventListener('order-attended' as any, handleOrderAttended);
      window.removeEventListener('chat-opened' as any, handleChatOpened);
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, [rawOrders, user?.uid]);

  const storeSummaries = useMemo(() => {
    if (!myStores || !rawOrders) return [];
    return myStores.map(store => {
      const storeOrders = rawOrders.filter(o => o.storeId === store.id);
      const active = storeOrders.filter(o => !['delivered', 'cancelled', 'inquiry'].includes(o.status));
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

  const handleCloseChat = () => {
    setActiveOrderId(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
    if (newStatus === 'preparing') updateData.isLogisticsPublic = true;
    updateDocumentNonBlocking(orderRef, updateData);
    toast({ title: "Estado Actualizado", description: `Pedido movido a ${newStatus.toUpperCase()}` });
  };

  const handleWhatsAppRedirect = (order: any) => {
    const isVenta = order.storeOwnerId === user?.uid;
    const targetPhone = isVenta ? order.customerPhone : order.storePhone;
    
    if (!targetPhone) {
      toast({ title: "Número no disponible", variant: "destructive" });
      return;
    }

    const cleanPhone = targetPhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('57') ? cleanPhone : '57' + cleanPhone;
    const message = isVenta 
      ? `¡Hola! 👋 Soy de la tienda *${order.storeName}*. Te contacto por tu pedido de *${order.productName}*.`
      : `¡Hola! 👋 Te contacto por mi pedido de *${order.productName}* en *${order.storeName}*.`;

    const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleValidateDriverCode = (code: string) => {
    if (!validatingOrder || !firestore) return;
    if (code === validatingOrder.deliveryCode) {
      const orderRef = doc(firestore, 'orders', validatingOrder.id);
      updateDocumentNonBlocking(orderRef, { status: 'delivered_to_driver', updatedAt: serverTimestamp() });
      toast({ title: "¡Código Correcto!", description: "Pedido entregado al repartidor." });
      setValidatingOrder(null);
    } else {
      toast({ title: "Código Incorrecto", variant: "destructive" });
    }
  };

  const handleReorder = (order: any) => {
    if (!order.items) return;
    order.items.forEach((item: any) => addToCart({ ...item, storeId: order.storeId, storeName: order.storeName }));
    toast({ title: "Añadidos al carrito" });
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const selectedOrderData = useMemo(() => rawOrders?.find(o => o.id === activeOrderId), [rawOrders, activeOrderId]);

  if (profileLoading || ordersLoading || storesLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (profile && !profile.phoneNumber) return null;

  const isDetailView = selectedStoreId || showMyPurchases;
  const contextName = showMyPurchases ? "Mis Compras" : storeSummaries.find(s => s.id === selectedStoreId)?.name;
  const filteredOrders = isDetailView ? rawOrders?.filter(o => {
    if (showMyPurchases) return o.customerId === user?.uid;
    return o.storeId === selectedStoreId;
  }).sort((a, b) => {
    const timeA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
    const timeB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  }) : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      {isDetailView ? (
        <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl animate-in fade-in duration-500">
          <div className="flex flex-col gap-6 mb-10">
            <Button variant="ghost" onClick={() => { setSelectedStoreId(null); setShowMyPurchases(false); }} className="w-fit gap-2 text-slate-400 font-bold hover:text-primary p-0">
              <ArrowLeft className="w-4 h-4" /> Volver al Panel
            </Button>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">{contextName}</h1>
          </div>

          <div className="grid gap-10">
            {filteredOrders && filteredOrders.length > 0 ? filteredOrders.map(order => {
              const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const isVenta = order.storeOwnerId === user?.uid;
              const isExpanded = expandedOrders[order.id];

              return (
                <Card key={order.id} id={order.id} className={cn("border-none rounded-[48px] overflow-hidden shadow-2xl bg-white ring-1 transition-all duration-500", isExpanded ? "ring-primary/20 scale-[1.02]" : "ring-black/[0.03]")}>
                  <CardContent className="p-8 space-y-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Badge className={cn("text-white border-none rounded-full px-5 h-8 text-[9px] font-black uppercase tracking-widest", isVenta ? "bg-primary" : "bg-secondary")}>
                          {isVenta ? "VENTA" : "COMPRA"}
                        </Badge>
                        <div className={cn("flex items-center gap-2 px-4 h-8 rounded-full border", status.bg, status.color, status.border)}>
                          <status.icon className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{status.label}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        {order.updatedAt ? format(order.updatedAt.toDate(), "dd MMM, HH:mm", { locale: es }) : order.createdAt ? format(order.createdAt.toDate(), "dd MMM, HH:mm", { locale: es }) : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-4xl font-black text-slate-900 italic uppercase leading-[0.85] tracking-tighter flex-1">
                          {order.productName}
                        </h3>
                        <Button 
                          variant="ghost" 
                          onClick={() => toggleOrderDetails(order.id)}
                          className={cn("text-[10px] font-black uppercase tracking-widest h-auto p-0 mt-1 hover:bg-transparent hover:underline", isExpanded ? "text-slate-400" : "text-primary")}
                        >
                          {isExpanded ? "Ocultar" : "ver pedido"}
                        </Button>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <StoreIcon className="w-3 h-3" /> {order.storeName}
                      </p>
                    </div>

                    {isExpanded && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Dirección Dinámica */}
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Punto de Entrega</p>
                            <p className="text-sm font-bold text-slate-700 leading-snug">{order.customerAddress || 'Por definir'}</p>
                          </div>
                        </div>

                        {/* Desglose de Productos */}
                        <div className="bg-white rounded-[32px] p-6 space-y-4 border border-slate-100 shadow-inner">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Desglose de productos</p>
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-4 border-b border-slate-50 pb-3 last:border-none last:pb-0">
                              <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0 border border-slate-50">
                                  <Image src={item.imageUrl || 'https://picsum.photos/seed/product/200'} alt={item.name} fill className="object-cover" />
                                </div>
                                <div>
                                  <p className="text-xs font-black uppercase italic leading-none">{item.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">x{item.quantity}</p>
                                </div>
                              </div>
                              <span className="text-xs font-black text-slate-900">
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                          <div className="pt-4 mt-2 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Total Final</span>
                            <span className="text-xl font-black text-primary tracking-tighter">
                              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {isVenta ? (
                        <div className="grid gap-3">
                          {order.status === 'pending' && <Button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="w-full h-16 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest gap-3 shadow-xl hover:scale-[1.02] transition-all"><Package className="w-6 h-6" /> INICIAR PREPARACIÓN</Button>}
                          {order.status === 'preparing' && <Button onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')} className="w-full h-16 rounded-[24px] bg-indigo-600 text-white font-black uppercase tracking-widest gap-3 shadow-xl hover:scale-[1.02] transition-all"><CheckCircle2 className="w-6 h-6" /> MARCAR COMO LISTO</Button>}
                          {order.status === 'at_store' && <Button onClick={() => setValidatingOrder(order)} className="w-full h-16 rounded-[24px] bg-amber-500 text-white font-black uppercase tracking-widest gap-3 shadow-xl animate-pulse"><ShieldCheck className="w-6 h-6" /> VALIDAR REPARTIDOR</Button>}
                          
                          {order.status === 'delivered' && (
                            <div className="flex gap-2">
                              {!order.driverRatingByStore && order.deliveryDriverId && (
                                <Button onClick={() => { setRatingType('to_driver'); setRatingOrder(order); }} variant="outline" className="flex-1 rounded-2xl h-12 border-primary/20 text-primary font-black text-[9px] uppercase tracking-widest gap-2">
                                  <Truck className="w-3.5 h-3.5" /> CALIFICAR REPARTIDOR
                                </Button>
                              )}
                              {!order.customerRatingByStore && (
                                <Button onClick={() => { setRatingType('to_customer'); setRatingOrder(order); }} variant="outline" className="flex-1 rounded-2xl h-12 border-secondary/20 text-secondary font-black text-[9px] uppercase tracking-widest gap-2">
                                  <UserIcon className="w-3.5 h-3.5" /> CALIFICAR CLIENTE
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="flex gap-3">
                            {!order.rating && order.status === 'delivered' && (
                              <Button onClick={() => { setRatingType('to_store'); setRatingOrder(order); }} className="flex-1 h-16 rounded-[24px] bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black uppercase tracking-widest gap-3 shadow-lg">
                                <Star className="w-6 h-6" /> CALIFICAR TIENDA
                              </Button>
                            )}
                            {(order.status === 'delivered' || order.status === 'cancelled') && <Button onClick={() => handleReorder(order)} variant="outline" className="flex-1 h-16 rounded-[24px] border-2 border-slate-100 font-black uppercase tracking-widest gap-3 hover:bg-slate-50 text-slate-600"><RotateCcw className="w-6 h-6 text-primary" /> REORDENAR</Button>}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button onClick={() => { setActiveOrderId(order.id); window.location.hash = order.id; }} className="flex-1 h-12 rounded-[20px] bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg active:scale-95 transition-transform">
                          <MessageCircle className="w-4 h-4 text-primary" /> CHAT
                        </Button>
                        <Button onClick={() => handleWhatsAppRedirect(order)} className="flex-1 h-12 rounded-[20px] bg-[#25d366] hover:bg-[#128c7e] text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg active:scale-95 transition-transform">
                          <WhatsAppIcon className="w-4 h-4" /> WHATSAPP
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="py-20 text-center text-slate-300 font-bold uppercase italic">Sin actividad registrada</div>
            )}
          </div>
        </main>
      ) : (
        <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-5 mb-12">
            <div className="w-20 h-20 bg-primary rounded-[32px] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(59,130,246,0.3)] border border-white/10">
              <StoreIcon className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-slate-900">Panel Maestro</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 ml-1">Centro de Comando Real</p>
            </div>
          </div>

          <div className="grid gap-8">
            {storeSummaries.map((store) => (
              <Card 
                key={store.id} 
                onClick={() => setSelectedStoreId(store.id)} 
                className="group border-none rounded-[48px] shadow-[0_15px_50px_-15px_rgba(0,0,0,0.08)] bg-white cursor-pointer hover:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500 overflow-hidden relative"
              >
                {store.activeCount > 0 && <div className="absolute top-0 left-0 w-2 h-full bg-orange-500 animate-pulse" />}
                
                <CardContent className="p-10 flex flex-col gap-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Badge className="bg-[#00c9db]/10 text-[#00c9db] border-none font-black text-[8px] uppercase px-3 tracking-widest mb-2">Vitriniando Pro</Badge>
                      <h2 className="text-[2.8rem] font-black italic uppercase tracking-tighter leading-[0.85] text-slate-900 group-hover:text-primary transition-colors">{store.name}</h2>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <ChevronRight className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-6 rounded-[32px] flex flex-col gap-1 border border-orange-100 shadow-sm group-hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-1">
                        <Timer className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Órdenes Vivas</span>
                      </div>
                      <span className="text-4xl font-black text-orange-600 tracking-tighter">{store.activeCount}</span>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-[32px] flex flex-col gap-1 border border-blue-100 shadow-sm group-hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ventas Hoy</span>
                      </div>
                      <span className="text-2xl font-black text-blue-600 tracking-tighter">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(store.revenueToday)}
                      </span>
                    </div>

                    <div className="bg-green-50 p-6 rounded-[32px] flex flex-col gap-1 border border-green-100 shadow-sm group-hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Exitosas</span>
                      </div>
                      <span className="text-4xl font-black text-green-600 tracking-tighter">{store.todayCount}</span>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[32px] flex items-center gap-3 border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zona</span>
                      </div>
                      <p className="text-[11px] font-black text-slate-600 uppercase truncate italic leading-tight">{store.address || 'Aguachica'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card onClick={() => setShowMyPurchases(true)} className="group border-none rounded-[48px] shadow-lg bg-slate-900 text-white cursor-pointer hover:bg-black transition-all duration-500 overflow-hidden">
              <CardContent className="p-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 rounded-[24px] flex items-center justify-center backdrop-blur-md">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[2.2rem] font-black italic uppercase tracking-tighter leading-none">Mis Compras</h3>
                    <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.3em] mt-2">Historial Personal</p>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-6 h-6 text-white/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      )}

      <RatingDialog 
        isOpen={!!ratingOrder} 
        onOpenChange={(v) => !v && setRatingOrder(null)} 
        orderId={ratingOrder?.id || ''} 
        storeName={ratingOrder?.storeName || 'Tienda'} 
        ratingType={ratingType}
      />

      <Dialog open={!!activeOrderId} onOpenChange={v => !v && handleCloseChat()}>
        <DialogContent className="p-0 border-none bg-white shadow-none max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 sm:p-4 md:p-8 flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat Interno</DialogTitle>
            <DialogDescription>Canal de comunicación seguro.</DialogDescription>
          </DialogHeader>
          {activeOrderId && selectedOrderData ? (
            <div key={activeOrderId} className="flex-1 min-h-0 w-full animate-in zoom-in duration-300">
              <OrderChat orderId={activeOrderId} orderData={selectedOrderData} onClose={handleCloseChat} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white p-10 h-full">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-400">Sincronizando Entorno...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!validatingOrder} onOpenChange={v => !v && setValidatingOrder(null)}>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-slate-900">
              <Lock className="w-7 h-7 text-amber-500" /> Validación
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium italic">
              Ingresa el código del repartidor.
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 grid grid-cols-1 gap-4">
            {validatingOrder && [validatingOrder.deliveryCode, (Number(validatingOrder.deliveryCode) + 123).toString().slice(-4), (Number(validatingOrder.deliveryCode) - 456).toString().slice(-4)].sort().map((code, idx) => (
              <button key={idx} onClick={() => handleValidateDriverCode(code)} className="h-20 rounded-[24px] text-3xl font-black tracking-[0.3em] italic border-2 border-slate-100 hover:border-primary transition-all bg-slate-50">{code}</button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
