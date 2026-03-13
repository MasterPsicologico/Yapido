
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
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
  Calendar, 
  Zap,
  User as UserIcon,
  ShoppingBag,
  Sparkles,
  ShoppingBasket,
  Tags,
  ShieldCheck,
  Timer,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { OrderChat } from '@/components/chat/OrderChat';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_CONFIG = {
  pending: { label: "Por Confirmar", color: "bg-orange-500", icon: Timer },
  preparing: { label: "Preparando", color: "bg-blue-500", icon: Package },
  ready_for_pickup: { label: "Listo / Esperando", color: "bg-indigo-500", icon: Zap },
  shipped: { label: "En Reparto", color: "bg-purple-500", icon: Truck },
  delivered: { label: "Entregado", color: "bg-green-500", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: AlertTriangle }
};

function OrderTimer({ createdAt, status, orderId, firestore }: { createdAt: any, status: string, orderId: string, firestore: any }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (status !== 'pending' || !createdAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const created = createdAt.toDate();
      const diff = 20 - differenceInMinutes(now, created);
      
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        // Aquí podríamos disparar el auto-cancelado
      } else {
        setTimeLeft(diff);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [createdAt, status]);

  if (status !== 'pending' || timeLeft === null) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
      timeLeft <= 5 ? "bg-red-100 text-red-600 animate-pulse" : "bg-orange-100 text-orange-600"
    )}>
      <Clock className="w-3 h-3" />
      {timeLeft > 0 ? `${timeLeft}m para expirar` : "EXPIRADO"}
    </div>
  );
}

export default function OrdersManagementPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { profile, isAdmin, isLoading: loadingProfile } = useProfile();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const chatParam = searchParams.get('chat');
  const manuallyClosedId = useRef<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<any | null>(null);

  const purchasesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'orders'), where('customerId', '==', user.uid));
  }, [firestore, user?.uid]);

  const salesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !profile) return null;
    const ordersRef = collection(firestore, 'orders');
    if (profile.role === 'admin' || profile.role === 'moderador') {
      return query(ordersRef, orderBy('createdAt', 'desc'));
    }
    if (profile.role === 'dueño') {
      return query(ordersRef, where('storeOwnerId', '==', user.uid));
    }
    return null;
  }, [firestore, user?.uid, profile]);

  const { data: purchasesData, isLoading: loadingPurchases } = useCollection(purchasesQuery);
  const { data: salesData, isLoading: loadingSales } = useCollection(salesQuery);

  const orders = useMemo(() => {
    const all = [];
    if (purchasesData) all.push(...purchasesData.map(o => ({ ...o, type: 'compra' })));
    if (salesData) {
      const purchaseIds = new Set(all.map(o => o.id));
      all.push(...salesData.filter(o => !purchaseIds.has(o.id)).map(o => ({ ...o, type: 'venta' })));
    }
    return all.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [purchasesData, salesData]);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { status: newStatus, updatedAt: serverTimestamp() });
    
    if (newStatus === 'ready_for_pickup') {
      toast({ title: "¡Alerta enviada!", description: "Los repartidores han sido notificados." });
    } else {
      toast({ title: "Estado actualizado" });
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { status: 'cancelled', updatedAt: serverTimestamp() });
    toast({ title: "Pedido Cancelado", variant: "destructive" });
  };

  const handleWhatsAppChat = (order: any) => {
    const phone = order.type === 'compra' ? (order.storePhone || '') : (order.customerPhone || '');
    if (!phone) {
        toast({ title: "Sin número", variant: "destructive" });
        return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/57${cleanPhone}`, '_blank');
  };

  const filteredOrders = orders?.filter(o => 
    o.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isGlobalLoading = isAuthLoading || loadingProfile || loadingPurchases || (salesQuery !== null && loadingSales);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-primary/20">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Gestión de Pedidos</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Órdenes en tiempo real</p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar pedido..." className="pl-10 h-12 rounded-2xl border-none bg-white shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {isGlobalLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Sincronizando órdenes...</p>
          </div>
        ) : filteredOrders && filteredOrders.length > 0 ? (
          <div className="grid gap-6">
            {filteredOrders.map((order) => {
              const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const formattedDate = order.createdAt ? format(order.createdAt.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : 'Recién pedido';
              const isVenta = order.type === 'venta';
              
              return (
                <Card key={order.id} id={order.id} className="border-none rounded-[32px] overflow-hidden shadow-md bg-white hover:shadow-xl transition-all duration-500">
                  <div className="flex flex-col lg:flex-row">
                    <div className={cn("w-full lg:w-2", isVenta ? "bg-secondary" : "bg-primary")} />
                    
                    <CardContent className="flex-1 p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className={cn("text-white border-none rounded-full px-4 h-7 text-[10px] font-black uppercase tracking-widest", isVenta ? "bg-secondary" : "bg-primary")}>
                            {isVenta ? "Venta Recibida" : "Mi Compra"}
                          </Badge>
                          <Badge className={`${status.color} text-white border-none rounded-full px-4 h-7 text-[10px] font-black uppercase tracking-widest`}>
                            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                            {status.label}
                          </Badge>
                          <OrderTimer createdAt={order.createdAt} status={order.status} orderId={order.id} firestore={firestore} />
                        </div>

                        <div>
                          <h3 className="text-2xl font-black text-slate-900 italic uppercase">{order.productName}</h3>
                          <div className="flex flex-col gap-1 mt-2">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-primary" />
                              <span className="text-sm font-black text-slate-700">{isVenta ? order.customerName : order.storeName}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formattedDate}</div>
                          </div>
                        </div>

                        <div className="text-3xl font-black text-slate-900 tracking-tighter">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice)}
                          <span className="text-xs font-bold text-slate-300 ml-2">x{order.quantity} un.</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <Button onClick={() => setSelectedOrderForChat(order)} className="rounded-full h-12 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-widest gap-2 w-full lg:w-auto">
                          <MessageCircle className="w-4 h-4 text-primary" /> Chat
                        </Button>
                        
                        {isVenta && order.status === 'pending' && (
                          <div className="flex gap-2 w-full lg:w-auto">
                            <Button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="flex-1 rounded-full h-12 px-6 bg-primary text-white font-black text-xs uppercase tracking-widest gap-2">
                              <Package className="w-4 h-4" /> Preparar
                            </Button>
                            <Button onClick={() => handleCancelOrder(order.id)} variant="destructive" className="rounded-full h-12 px-4">
                              <AlertTriangle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        {isVenta && order.status === 'preparing' && (
                          <Button onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')} className="rounded-full h-12 px-8 bg-green-500 hover:bg-green-600 text-white font-black text-xs uppercase tracking-widest gap-2 w-full lg:w-auto">
                            <CheckCircle2 className="w-4 h-4" /> Finalizar Pedido
                          </Button>
                        )}

                        {order.status === 'ready_for_pickup' && (
                          <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                            <Truck className="w-4 h-4 text-indigo-600 animate-bounce" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Esperando Repartidor</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-none rounded-[40px] py-20 text-center px-6 shadow-sm flex flex-col items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-primary/30 mb-4" />
            <h3 className="text-2xl font-black text-slate-900 italic uppercase">Sin historial de órdenes</h3>
            <Link href="/" className="mt-6">
              <Button className="rounded-full h-12 px-10 font-black">Empezar a Vitrinear</Button>
            </Link>
          </div>
        )}
      </main>

      <Dialog open={!!selectedOrderForChat} onOpenChange={(val) => !val && setSelectedOrderForChat(null)}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[450px]">
          {selectedOrderForChat && <OrderChat orderId={selectedOrderForChat.id} orderData={selectedOrderForChat} onClose={() => setSelectedOrderForChat(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
