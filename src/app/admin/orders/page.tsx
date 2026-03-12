
"use client";

import { useState, useMemo } from 'react';
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
  Store as StoreIcon,
  ShoppingBag,
  Sparkles,
  ArrowRightLeft,
  ShoppingBasket,
  Tags
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "bg-yellow-500", icon: Clock },
  preparing: { label: "Preparando", color: "bg-blue-500", icon: Package },
  ready_for_pickup: { label: "Listo para Reparto", color: "bg-orange-500", icon: Zap },
  shipped: { label: "En Camino", color: "bg-purple-500", icon: Truck },
  delivered: { label: "Entregado", color: "bg-green-500", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: CheckCircle2 }
};

export default function OrdersManagementPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { profile, isLoading: loadingProfile } = useProfile();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  // Consulta para COMPRAS (Donde soy el cliente)
  const purchasesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'orders'), where('customerId', '==', user.uid));
  }, [firestore, user?.uid]);

  // Consulta para VENTAS (Donde soy el dueño de la tienda)
  const salesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !profile || (profile.role !== 'dueño' && profile.role !== 'admin')) return null;
    
    const ordersRef = collection(firestore, 'orders');
    if (profile.role === 'admin') return query(ordersRef, orderBy('createdAt', 'desc'));
    
    return query(ordersRef, where('storeOwnerId', '==', user.uid));
  }, [firestore, user?.uid, profile]);

  const { data: purchasesData, isLoading: loadingPurchases } = useCollection(purchasesQuery);
  const { data: salesData, isLoading: loadingSales } = useCollection(salesQuery);

  const orders = useMemo(() => {
    const all = [];
    if (purchasesData) all.push(...purchasesData.map(o => ({ ...o, type: 'compra' })));
    if (salesData) {
      // Evitar duplicados si soy admin y cliente al mismo tiempo
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
    updateDocumentNonBlocking(orderRef, { status: newStatus });
  };

  const handleWhatsAppChat = (order: any) => {
    // Si soy el cliente (compra), chateo con el vendedor
    // Si soy el vendedor (venta), chateo con el cliente
    const phone = order.type === 'compra' ? (order.storePhone || '') : (order.customerPhone || '');
    if (!phone) {
        toast({ title: "Sin número", description: "No hay un número de contacto registrado para este chat.", variant: "destructive" });
        return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`¡Hola! Te contacto de Vitriniando sobre el pedido de "${order.productName}" (ID: ${order.id.slice(-6)}).`);
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
                {profile?.role === 'admin' ? 'Control Maestro Global' : 'Historial de Compras y Ventas'}
              </p>
            </div>
          </div>

          {(profile?.role === 'admin' || (orders && orders.length > 0)) && (
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Buscar pedido..." 
                className="pl-10 h-12 rounded-2xl border-none bg-white shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        {isGlobalLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Sincronizando Pedidos...</p>
          </div>
        ) : filteredOrders && filteredOrders.length > 0 ? (
          <div className="grid gap-6">
            {filteredOrders.map((order) => {
              const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const formattedDate = order.createdAt ? format(order.createdAt.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : 'Recién pedido';
              const isVenta = order.type === 'venta';
              
              return (
                <Card key={order.id} className="border-none rounded-[32px] overflow-hidden shadow-md bg-white group hover:shadow-xl transition-all duration-500">
                  <div className="flex flex-col lg:flex-row">
                    <div className={cn("w-full lg:w-2", isVenta ? "bg-secondary" : "bg-primary")} />
                    
                    <CardContent className="flex-1 p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className={cn("text-white border-none rounded-full px-4 h-7 text-[10px] font-black uppercase tracking-widest", isVenta ? "bg-secondary" : "bg-primary")}>
                            {isVenta ? <Tags className="w-3 h-3 mr-1.5" /> : <ShoppingBasket className="w-3 h-3 mr-1.5" />}
                            {isVenta ? "Venta Recibida" : "Mi Compra"}
                          </Badge>
                          <Badge className={`${status.color} text-white border-none rounded-full px-4 h-7 text-[10px] font-black uppercase tracking-widest`}>
                            <StatusIcon className="w-3 h-3 mr-1.5" />
                            {status.label}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full">
                            <Calendar className="w-3 h-3" />
                            {formattedDate}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tighter italic">
                            {order.productName}
                          </h3>
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-3.5 h-3.5 text-primary" />
                              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                {isVenta ? "Cliente:" : "Vendedor:"}
                              </span>
                              <span className="text-sm font-black text-slate-700">
                                {isVenta ? order.customerName : order.storeName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <StoreIcon className="w-3.5 h-3.5 text-secondary" />
                              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Ubicación:</span>
                              <span className="text-sm font-black text-slate-700">
                                {isVenta ? "WhatsApp Cliente" : "Tienda Local"}
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
                        {isVenta && (
                          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                            {order.status === 'pending' && (
                              <Button 
                                onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                className="rounded-full h-12 px-6 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest gap-2"
                              >
                                <Package className="w-4 h-4" /> Preparar
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button 
                                onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')}
                                className="rounded-full h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-orange-200"
                              >
                                <Zap className="w-4 h-4" /> Listo para Delivery
                              </Button>
                            )}
                          </div>
                        )}
                        
                        <Button 
                          onClick={() => handleWhatsAppChat(order)}
                          className="rounded-full h-12 px-6 bg-[#25d366] hover:bg-[#128c7e] text-white font-black text-xs uppercase tracking-widest gap-2 w-full lg:w-auto shadow-lg shadow-green-100 border-none"
                        >
                          <MessageCircle className="w-4 h-4" /> {isVenta ? "Chat Cliente" : "Chat Vendedor"}
                        </Button>
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
    </div>
  );
}
