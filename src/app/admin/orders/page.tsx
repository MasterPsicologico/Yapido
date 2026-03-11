
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Truck, 
  MessageCircle, 
  ChevronRight,
  Package,
  Search,
  Loader2,
  Calendar,
  Zap
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "bg-yellow-500", icon: Clock },
  preparing: { label: "Preparando", color: "bg-blue-500", icon: Package },
  ready_for_pickup: { label: "Listo para Reparto", color: "bg-orange-500", icon: Zap },
  shipped: { label: "En Camino", color: "bg-purple-500", icon: Truck },
  delivered: { label: "Entregado", color: "bg-green-500", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: CheckCircle2 }
};

export default function OrdersManagementPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  // Consulta optimizada para reglas de seguridad: consulta por storeOwnerId directamente
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'orders'), 
      where('storeOwnerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user?.uid]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { status: newStatus });
  };

  const filteredOrders = orders?.filter(o => 
    o.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Control de ventas en tiempo real</p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por cliente o producto..." 
              className="pl-10 h-12 rounded-2xl border-none bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
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
              
              return (
                <Card key={order.id} className="border-none rounded-[32px] overflow-hidden shadow-md bg-white group hover:shadow-xl transition-all duration-500">
                  <div className="flex flex-col lg:flex-row">
                    <div className={`w-full lg:w-2 ${status.color}`} />
                    
                    <CardContent className="flex-1 p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className={`${status.color} text-white border-none rounded-full px-4 h-7 text-[10px] font-black uppercase tracking-widest`}>
                            <StatusIcon className="w-3 h-3 mr-1.5" />
                            {status.label}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full">
                            <Calendar className="w-3 h-3" />
                            {formattedDate}
                          </div>
                          {order.deliveryDriverName && (
                            <div className="flex items-center gap-1.5 text-secondary font-bold text-[10px] uppercase tracking-wider bg-secondary/10 px-3 py-1 rounded-full">
                              <Truck className="w-3 h-3" />
                              Repartidor: {order.deliveryDriverName}
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tighter italic">
                            {order.productName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cliente:</span>
                            <span className="text-sm font-black text-primary">{order.customerName}</span>
                            <span className="text-xs font-bold text-slate-300">x{order.quantity} unidades</span>
                          </div>
                        </div>

                        <div className="text-3xl font-black text-slate-900 tracking-tighter">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
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
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <Button 
                              variant="outline"
                              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              className="rounded-full h-12 px-6 border-slate-100 text-slate-400 hover:text-red-500 font-black text-xs uppercase tracking-widest"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                        
                        <Button className="rounded-full h-12 px-6 bg-[#25d366] hover:bg-[#128c7e] text-white font-black text-xs uppercase tracking-widest gap-2 w-full lg:w-auto">
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] py-24 text-center px-6">
            <ClipboardList className="w-20 h-20 mx-auto text-slate-100 mb-6" />
            <h3 className="text-2xl font-black text-slate-300 italic uppercase tracking-tighter">Sin pedidos aún</h3>
            <p className="text-slate-400 text-sm font-medium mt-2 max-w-xs mx-auto">Cuando los clientes soliciten tus productos, aparecerán aquí con todo el detalle de venta.</p>
          </div>
        )}
      </main>
    </div>
  );
}
