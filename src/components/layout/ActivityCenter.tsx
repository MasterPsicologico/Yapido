
"use client";

import { useMemo } from 'react';
import { Bell, Clock, Package, Truck, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, or } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ActivityCenter() {
  const { user } = useUser();
  const { profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();

  // Consulta Maestra: Filtrada quirúrgicamente por 'viewers' para evitar errores de permisos
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || profileLoading) return null;
    return query(
      collection(firestore, 'orders'),
      where('viewers', 'array-contains', user.uid)
    );
  }, [firestore, user?.uid, profileLoading]);

  const { data: orders } = useCollection(ordersQuery);

  const activities = useMemo(() => {
    if (!orders || !user) return [];

    return orders.map(order => {
      let task = null;

      // Lógica de tareas por Rol
      if (order.customerId === user.uid && order.status === 'shipped') {
        task = { label: "Confirmar entrega", desc: order.productName, icon: Package, color: "text-blue-500", bg: "bg-blue-50" };
      } 
      else if (order.storeOwnerId === user.uid && order.status === 'pending') {
        task = { label: "Nuevo pedido por preparar", desc: order.productName, icon: Zap, color: "text-orange-500", bg: "bg-orange-50" };
      }
      else if (order.storeOwnerId === user.uid && order.status === 'preparing') {
        task = { label: "Listo para despacho", desc: order.productName, icon: Clock, color: "text-purple-500", bg: "bg-purple-50" };
      }
      else if (profile?.role === 'repartidor' && order.status === 'ready_for_pickup' && !order.deliveryDriverId) {
        task = { label: "Nueva ruta disponible", desc: order.productName, icon: Truck, color: "text-green-500", bg: "bg-green-50" };
      }

      if (task) {
        return { ...task, orderId: order.id };
      }
      return null;
    }).filter(Boolean);
  }, [orders, user, profile]);

  const count = activities.length;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 transition-colors">
          <Bell className={cn("w-5 h-5", count > 0 ? "text-primary animate-vibrate" : "text-slate-400")} />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-2 rounded-[32px] shadow-2xl border-none bg-white" align="center">
        <DropdownMenuLabel className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black italic uppercase tracking-tighter">Actividades Pendientes</span>
            <Badge variant="secondary" className="rounded-full text-[10px] font-black">{count}</Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-50" />
        <div className="max-h-[400px] overflow-y-auto p-1 space-y-1">
          {activities.length > 0 ? activities.map((act, i) => {
            const Icon = act.icon;
            return (
              <DropdownMenuItem key={i} asChild className="rounded-2xl p-3 cursor-pointer focus:bg-slate-50 border border-transparent focus:border-slate-100 transition-all">
                <Link href={`/admin/orders#${act.orderId}`} className="flex items-start gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm", act.bg, act.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 leading-none mb-1">{act.label}</p>
                    <p className="text-[10px] font-bold text-slate-400 truncate">{act.desc}</p>
                  </div>
                </Link>
              </DropdownMenuItem>
            );
          }) : (
            <div className="py-10 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-slate-200" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Todo al día, morrocoy</p>
            </div>
          )}
        </div>
        <DropdownMenuSeparator className="bg-slate-50" />
        <DropdownMenuItem asChild className="rounded-xl justify-center h-10 focus:bg-primary/5">
          <Link href="/admin/orders" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ver todos los pedidos</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
