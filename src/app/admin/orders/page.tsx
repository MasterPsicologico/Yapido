"use client";

import { useState, useMemo, useEffect } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  pending: { label: "Pendiente", color: "bg-yellow-500", icon: Clock },
  preparing: { label: "Preparando", color: "bg-blue-500", icon: Package },
  ready_for_pickup: { label: "Listo para Reparto", color: "bg-orange-500", icon: Zap },
  shipped: { label: "En Camino", color: "bg-purple-500", icon: Truck },
  delivered: { label: "Entregado", color: "bg-green-50", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: CheckCircle2 }
};

export default function OrdersManagementPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { profile, isAdmin, isLoading: loadingProfile } = useProfile();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const chatParam = searchParams.get('chat');
  
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

  // Efecto para abrir el chat automáticamente si viene por URL
  useEffect(() => {
    if (chatParam && orders.length > 0 && !selectedOrderForChat) {
      const targetOrder = orders.find(o => o.id === chatParam);
      if (targetOrder) {
        setSelectedOrderForChat(targetOrder);
        // Desplazarse al pedido si es necesario
      }
    }
  }, [chatParam, orders, selectedOrderForChat]);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { status: newStatus });
    toast({ title: "Estado actualizado" });
  };

  const handleWhatsAppChat = (order: any) => {
    const phone = order.type === 'compra' ? (order.storePhone || '') : (order.customerPhone || '');
    if (!phone) {
        toast({ title: "Sin número", description: "No hay contacto registrado.", variant: "destructive" });
        return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`¡Hola! Te contacto de Vitriniando sobre el pedido de "${order.productName}". ¿Podrías confirmarme la orden para proceder con la entrega? 🚀`);
    window.open(`https://wa.me/57${cleanPhone}?text=${message}`, '_blank');
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
              <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
                Gestión de Pedidos
              </h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                {isAdmin ? 'Panel de Control Maestro' : 'Historial y Seguimiento'}
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar pedido o cliente..." 
              className="pl-10 h-12 rounded-2xl border-none bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isGlobalLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Sincronizando Vitrina...</p>
          </div>
        ) : filteredOrders && filteredOrders.length > 0 ? (
          <div className="grid gap-6">
            {filteredOrders.map((order) => {
              const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const formattedDate = order.createdAt ? format(order.createdAt.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : 'Recién pedido';
              const isVenta = order.type === 'venta';
              
              return (
                <Card key={order.id} id={order.id} className={cn(
                  "border-none rounded-[32px] overflow-hidden shadow-md bg-white group hover:shadow-xl transition-all duration-500",
                  chatParam === order.id && "ring-2 ring-primary ring-offset-4"
                )}>
                  <div className="flex flex-col lg:flex-row">
                    <div className={cn("w-full lg:w-2", isVenta ? "bg-secondary" : "bg-primary")} />
                    
                    <CardContent className="flex-1 p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className={cn("text-white border-none rounded-full px-4 h-7 text-[10px] font-black uppercase tracking-widest", isVenta ? "bg-secondary" : "bg-primary")}>
                            {isVenta ? <Tags className="w-3.5 h-3.5 mr-1.5" /> : <ShoppingBasket className="w-3.5 h-3.5 mr-1.5" />}
                            {isVenta ? "Venta Recibida" : "Mi Compra"}
                          </Badge>
                          <Badge className={`${status.color} text-white border-none rounded-full px-4 h-7 text-[10px] font-black uppercase tracking-widest`}>
                            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                            {status.label}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full">
                            <Calendar className="w-3.5 h-3.5" />
                            {formattedDate}
                          </div>
                          {isAdmin && (
                            <Badge className="bg-slate-900 text-white border-none rounded-full px-4 h-7 text-[10px] font-black uppercase tracking-widest">
                               <ShieldCheck className="w-3 h-3 mr-1.5 text-primary" /> Moderador
                            </Badge>
                          )}
                        </div>

                        <div>
                          <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tighter italic uppercase">
                            {order.productName}
                          </h3>
                          <div className="flex flex-col gap-1 mt-2">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-primary" />
                              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                {isVenta ? "Cliente:" : "Vendedor:"}
                              </span>
                              <span className="text-sm font-black text-slate-700">
                                {isVenta ? order.customerName : order.storeName}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-3xl font-black text-slate-900 tracking-tighter">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice)}
                          <span className="text-xs font-bold text-slate-300 ml-2">x{order.quantity} un.</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <Button 
                          onClick={() => setSelectedOrderForChat(order)}
                          className="rounded-full h-12 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-widest gap-2 w-full lg:w-auto border-none shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4 text-primary" /> Chat Interno
                        </Button>
                        
                        <Button 
                          onClick={() => handleWhatsAppChat(order)}
                          className="rounded-full h-12 px-6 bg-[#25d366] hover:bg-[#128c7e] text-white font-black text-xs uppercase tracking-widest gap-2 w-full lg:w-auto shadow-lg shadow-green-100 border-none"
                        >
                          <MessageCircle className="w-4 h-4 fill-white" /> WhatsApp
                        </Button>

                        {isVenta && order.status === 'pending' && (
                          <Button 
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className="rounded-full h-12 px-6 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest gap-2 w-full lg:w-auto"
                          >
                            <Package className="w-4 h-4" /> Preparar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-none rounded-[40px] py-20 text-center px-6 shadow-sm flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping duration-[3000ms]" />
              <div className="relative w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-primary/30" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter leading-none mb-4">
              ¿Listo para tu primer pedido?
            </h3>
            <p className="text-slate-400 text-sm font-bold max-w-sm mx-auto uppercase tracking-widest leading-relaxed mb-10">
              Tu historial está vacío. ¡Es el momento perfecto para descubrir productos increíbles en las mejores vitrinas de tu ciudad!
            </p>
            <Link href="/">
              <Button className="h-16 px-12 rounded-full bg-primary hover:bg-primary/90 text-white font-black text-lg gap-3 shadow-2xl shadow-primary/30 transition-all hover:scale-105">
                <Sparkles className="w-6 h-6 text-yellow-300" /> Empezar a Vitrinear
              </Button>
            </Link>
          </div>
        )}
      </main>

      <Dialog open={!!selectedOrderForChat} onOpenChange={(val) => !val && setSelectedOrderForChat(null)}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[450px]">
          <DialogHeader className="sr-only">
             <DialogTitle>Chat Interno del Pedido</DialogTitle>
          </DialogHeader>
          {selectedOrderForChat && (
            <OrderChat 
              orderId={selectedOrderForChat.id} 
              orderData={selectedOrderForChat} 
              onClose={() => setSelectedOrderForChat(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}