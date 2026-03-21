
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
  RefreshCw,
  Lock,
  Star,
  RotateCcw
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
import { RatingDialog } from '@/components/order/RatingDialog';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.131.57-.074 1.758-.706 2.006-1.388.248-.683.248-1.265.173-1.388-.075-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .01 5.393 0 12.03c0 2.123.54 4.197 1.57 6.05L0 24l6.15-1.612a11.81 11.81 0 005.89 1.568h.005c6.634 0 12.04-5.39 12.043-12.03a11.82 11.82 0 00-3.48-8.513z"/>
  </svg>
);

const STATUS_CONFIG = {
  pending: { label: "PENDIENTE", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", icon: Timer },
  preparing: { label: "PREPARANDO", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", icon: Package },
  ready_for_pickup: { label: "LISTO EN TIENDA", color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", icon: CheckCircle2 },
  at_store: { label: "REPARTIDOR EN TIENDA", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: ShieldCheck },
  delivered_to_driver: { label: "CON REPARTIDOR", color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100", icon: Truck },
  shipped: { label: "EN REPARTO", color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100", icon: Truck },
  delivered: { label: "ENTREGADO", color: "text-green-500", bg: "bg-green-50", border: "border-green-100", icon: CheckCircle2 },
  cancelled: { label: "CANCELADO", color: "text-red-500", bg: "bg-red-50", border: "border-red-100", icon: AlertTriangle }
};

export default function OrdersManagementPage() {
  const { user } = useUser();
  const { profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();
  const { addToCart } = useCart();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [showMyPurchases, setShowMyPurchases] = useState(false);
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<any | null>(null);
  const [validatingOrder, setValidatingOrder] = useState<any | null>(null);
  const [ratingOrder, setRatingOrder] = useState<any | null>(null);

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

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
    if (newStatus === 'preparing') updateData.isLogisticsPublic = true;
    updateDocumentNonBlocking(orderRef, updateData);
    toast({ title: "Estado Actualizado" });
  };

  const handleValidateDriverCode = (code: string) => {
    if (!validatingOrder || !firestore) return;
    if (code === validatingOrder.deliveryCode) {
      const orderRef = doc(firestore, 'orders', validatingOrder.id);
      updateDocumentNonBlocking(orderRef, { 
        status: 'delivered_to_driver', 
        updatedAt: serverTimestamp() 
      });
      toast({ title: "¡Código Correcto!", description: "Pedido entregado físicamente al repartidor." });
      setValidatingOrder(null);
    } else {
      toast({ title: "Código Incorrecto", variant: "destructive", description: "Verifica con el repartidor." });
    }
  };

  const handleReorder = (order: any) => {
    if (!order.items || order.items.length === 0) {
      toast({ title: "No hay items para reordenar", variant: "destructive" });
      return;
    }

    order.items.forEach((item: any) => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        storeId: order.storeId,
        storeName: order.storeName
      });
    });
    
    toast({ 
      title: "Items añadidos", 
      description: `Se agregaron ${order.items.length} productos al carrito.`,
      className: "bg-primary text-white"
    });
  };

  const openWhatsApp = (order: any, isVenta: boolean) => {
    const phone = isVenta ? order.customerPhone : order.storePhone;
    if (!phone) {
      toast({ title: "Teléfono no disponible", description: "La otra parte no ha registrado su WhatsApp.", variant: "destructive" });
      return;
    }

    const message = isVenta 
      ? `¡Hola! 👋 Soy de la tienda *${order.storeName}* en Vitriniando. Te contacto por tu pedido de *${order.productName}*. ¿Me confirmas tu disponibilidad para la entrega?`
      : `¡Hola! 👋 Te contacto desde Vitriniando por mi pedido de *${order.productName}*. ¿Me podrías confirmar el envío?`;

    const cleanPhone = phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone.startsWith('57') ? cleanPhone : '57' + cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  if (profileLoading || ordersLoading || storesLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
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
              onClick={() => { setSelectedStoreId(null); setShowMyPurchases(false); }}
              className="w-fit gap-2 text-slate-400 font-bold hover:text-primary p-0 h-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </Button>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">{contextName}</h1>
          </div>

          <div className="grid gap-10">
            {filteredOrders && filteredOrders.length > 0 ? filteredOrders.map(order => {
              const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const isVenta = order.storeOwnerId === user?.uid;
              const hasRated = !!order.rating;
              
              return (
                <Card key={order.id} id={order.id} className="border-none rounded-[48px] overflow-hidden shadow-2xl bg-white ring-1 ring-black/[0.03]">
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
                        {order.createdAt ? format(order.createdAt.toDate(), "dd MMM, HH:mm", { locale: es }) : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-4xl font-black text-slate-900 italic uppercase leading-[0.85] tracking-tighter">
                        {order.productName}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <StoreIcon className="w-3 h-3" /> {order.storeName}
                      </p>
                    </div>

                    {/* Visualización de Calificación si existe */}
                    {hasRated && (
                      <div className="flex items-center gap-4 bg-yellow-50 p-4 rounded-3xl border border-yellow-100">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={cn("w-3.5 h-3.5", s <= order.rating ? "fill-yellow-400 text-yellow-400" : "text-yellow-200")} />
                          ))}
                        </div>
                        <p className="text-[11px] font-medium text-yellow-800 italic line-clamp-1">"{order.review || 'Sin comentario'}"</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 bg-slate-50 p-6 rounded-[32px]">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubicación de Entrega</span>
                        <p className="text-lg font-black text-slate-800 italic">{order.customerAddress || 'No detectada'}</p>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor de Orden</span>
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice)}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase italic">X{order.quantity || 1} Unidades</span>
                          {order.items && <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-bold border-slate-200 text-slate-400">{order.items.length} productos</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {isVenta ? (
                        <>
                          {order.status === 'pending' && (
                            <Button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="w-full h-16 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest gap-3 shadow-xl">
                              <Package className="w-6 h-6" /> INICIAR PREPARACIÓN
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')} className="w-full h-16 rounded-[24px] bg-indigo-600 text-white font-black uppercase tracking-widest gap-3 shadow-xl">
                              <CheckCircle2 className="w-6 h-6" /> MARCAR COMO LISTO
                            </Button>
                          )}
                          {order.status === 'at_store' && (
                            <Button onClick={() => setValidatingOrder(order)} className="w-full h-16 rounded-[24px] bg-amber-500 text-white font-black uppercase tracking-widest gap-3 shadow-xl animate-pulse">
                              <ShieldCheck className="w-6 h-6" /> VALIDAR CÓDIGO REPARTIDOR
                            </Button>
                          )}
                        </>
                      ) : (
                        <div className="flex gap-3">
                          {!hasRated && order.status === 'delivered' && (
                            <Button 
                              onClick={() => setRatingOrder(order)} 
                              className="flex-1 h-16 rounded-[24px] bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black uppercase tracking-widest gap-3 shadow-lg"
                            >
                              <Star className="w-6 h-6" /> CALIFICAR
                            </Button>
                          )}
                          {(order.status === 'delivered' || order.status === 'cancelled') && (
                            <Button 
                              onClick={() => handleReorder(order)}
                              variant="outline" 
                              className="flex-1 h-16 rounded-[24px] border-2 border-slate-100 font-black uppercase tracking-widest gap-3 hover:bg-slate-50 text-slate-600"
                            >
                              <RotateCcw className="w-6 h-6 text-primary" /> REORDENAR
                            </Button>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-3">
                        <Button onClick={() => setSelectedOrderForChat(order)} className="w-full h-12 rounded-[20px] bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest gap-2">
                          <MessageCircle className="w-4 h-4 text-primary" /> CHAT DE SOPORTE
                        </Button>
                        <Button 
                          onClick={() => openWhatsApp(order, isVenta)} 
                          className="w-full h-12 rounded-[20px] bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg transition-all active:scale-95"
                        >
                          <WhatsAppIcon className="w-5 h-5" /> CONFIRMAR POR WHATSAPP
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="py-20 text-center text-slate-300 font-bold uppercase italic">Sin pedidos registrados</div>
            )}
          </div>
        </main>

        <RatingDialog 
          isOpen={!!ratingOrder} 
          onOpenChange={(v) => !v && setRatingOrder(null)}
          orderId={ratingOrder?.id || ''}
          storeName={ratingOrder?.storeName || 'Tienda'}
        />

        <Dialog open={!!validatingOrder} onOpenChange={(v) => !v && setValidatingOrder(null)}>
          <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-slate-900">
                <Lock className="w-7 h-7 text-amber-500" /> Validación de Entrega
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-medium">
                Pide al repartidor su código de 4 dígitos y selecciona la opción correcta para transferir la responsabilidad del pedido.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-8 grid grid-cols-1 gap-4">
              {validatingOrder && (
                <>
                  {[
                    validatingOrder.deliveryCode,
                    (Number(validatingOrder.deliveryCode) + 123).toString().slice(-4),
                    (Number(validatingOrder.deliveryCode) - 456).toString().slice(-4)
                  ].sort().map((code, idx) => (
                    <Button 
                      key={idx} 
                      onClick={() => handleValidateDriverCode(code)}
                      variant="outline" 
                      className="h-20 rounded-[24px] text-3xl font-black tracking-[0.3em] italic border-2 hover:bg-slate-50 hover:border-primary transition-all"
                    >
                      {code}
                    </Button>
                  ))}
                </>
              )}
            </div>
            <p className="text-[9px] text-slate-300 font-black uppercase text-center tracking-widest">Este paso garantiza la entrega física del producto</p>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedOrderForChat} onOpenChange={(v) => !v && setSelectedOrderForChat(null)}>
          <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[450px]">
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
          <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center text-white shadow-2xl">
            <StoreIcon className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Panel Maestro</h1>
        </div>

        <div className="grid gap-6">
          {storeSummaries.map((store) => (
            <Card key={store.id} onClick={() => setSelectedStoreId(store.id)} className="border-none rounded-[40px] shadow-xl bg-white cursor-pointer hover:scale-[1.02] transition-all">
              <CardContent className="p-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">{store.name}</h2>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{store.activeCount} Órdenes vivas</p>
                </div>
                <Button size="icon" className="rounded-full bg-primary"><ChevronRight /></Button>
              </CardContent>
            </Card>
          ))}
          <Card onClick={() => setShowMyPurchases(true)} className="border-none rounded-[40px] shadow-md bg-slate-900 text-white cursor-pointer">
            <CardContent className="p-8 flex items-center justify-between">
              <h3 className="text-xl font-black italic uppercase">Mis Compras</h3>
              <ArrowRight className="w-6 h-6 text-white/20" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
