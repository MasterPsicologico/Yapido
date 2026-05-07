
"use client";

import { useMemo, useState, useEffect } from 'react';
import { Bell, Clock, Package, Truck, Zap, CheckCircle2, Navigation, Timer } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ActivityTrigger } from './ActivityTrigger';
import { ActivityItem } from './ActivityItem';
import { getServiceType, getServiceLabel } from './components/useServiceType';

const SEEN_ORDERS_KEY = 'vitriniando_seen_activity_v1';

export function ActivityCenter() {
  const { user } = useUser();
  const { profile, isRepartidor, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(SEEN_ORDERS_KEY);
    if (saved) setSeenIds(JSON.parse(saved));

    const handleGlobalUpdate = (e: any) => {
      const orderId = e.detail?.orderId;
      if (orderId) {
        setSeenIds(prev => {
          if (prev.includes(orderId)) return prev;
          const next = [...prev, orderId];
          localStorage.setItem(SEEN_ORDERS_KEY, JSON.stringify(next));
          return next;
        });
      }
    };

    window.addEventListener('order-attended' as any, handleGlobalUpdate);
    window.addEventListener('chat-opened' as any, handleGlobalUpdate);
    return () => {
      window.removeEventListener('order-attended' as any, handleGlobalUpdate);
      window.removeEventListener('chat-opened' as any, handleGlobalUpdate);
    };
  }, []);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || profileLoading) return null;
    return query(
      collection(firestore, 'orders'), 
      where('participants', 'array-contains', user.uid)
    );
  }, [firestore, user?.uid, profileLoading]);

  const { data: rawOrders } = useCollection(ordersQuery);

  const activities = useMemo(() => {
    if (!rawOrders || !user) return [];
    
    return rawOrders
      .filter(order => order.status !== 'delivered' && order.status !== 'cancelled')
      .sort((a, b) => {
        // Orden cronológico: los más recientes arriba (orden de llegada)
        const timeA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      })
      .map(order => {
        let task = null;
        const timestamp = order.updatedAt || order.createdAt;
        const serviceType = getServiceType(order);
        const isStoreOwner = order.storeOwnerId === user.uid;

        if (order.storeOwnerId === user.uid) {
          const { label } = getServiceLabel(serviceType, true, order.status);
          if (order.status === 'pending') task = { label, desc: order.productName, icon: Zap, color: "text-orange-500", bg: "bg-orange-50" };
          else if (order.status === 'preparing') task = { label, desc: order.productName, icon: Clock, color: "text-blue-500", bg: "bg-blue-50" };
          else if (order.status === 'ready_for_pickup') task = { label, desc: order.productName, icon: CheckCircle2, color: "text-indigo-500", bg: "bg-indigo-50" };
          else if (order.status === 'shipped') task = { label, desc: order.productName, icon: Truck, color: "text-purple-500", bg: "bg-purple-50" };
        } 
        else if (order.deliveryDriverId === user.uid && (order.status === 'shipped' || order.status === 'at_store' || order.status === 'delivered_to_driver')) {
          task = { label: "Ruta: Entrega en Curso", desc: order.productName, icon: Navigation, color: "text-secondary", bg: "bg-secondary/10" };
        }
        else if (order.customerId === user.uid) {
          const { label } = getServiceLabel(serviceType, false, order.status);
          if (order.status === 'shipped' || order.status === 'delivered_to_driver') task = { label, desc: order.productName, icon: Package, color: "text-blue-500", bg: "bg-blue-50" };
          else task = { label, desc: order.productName, icon: Clock, color: "text-slate-500", bg: "bg-slate-50" };
        }

        if (!task && profile?.role === 'repartidor' && order.status === 'ready_for_pickup' && !order.deliveryDriverId) {
          task = { label: "Ruta: Disponible ahora", desc: order.productName, icon: Truck, color: "text-green-500", bg: "bg-green-50" };
        }

        return task ? { ...task, orderId: order.id, timestamp, serviceType } : null;
      }).filter(Boolean);
  }, [rawOrders, user, profile]);

  const unreadCount = useMemo(() => {
    return activities.filter(a => !seenIds.includes(a!.orderId)).length;
  }, [activities, seenIds]);

  const handleItemClick = (orderId: string) => {
    setOpen(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('order-attended', { detail: { orderId } }));
      window.dispatchEvent(new CustomEvent('chat-opened', { detail: { orderId } }));
    }, 150);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ActivityTrigger count={unreadCount} />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2 rounded-[28px] shadow-2xl border-none bg-white mt-2 z-[1000]" align="center">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-tighter text-slate-900">Notificaciones</span>
            <Badge variant="secondary" className="rounded-full text-[8px] sm:text-[9px] h-4 min-w-[16px] px-1 font-black bg-primary/10 text-primary border-none flex items-center justify-center">{unreadCount}</Badge>
          </div>
        </div>
        <div className="h-px bg-slate-50 mx-2" />
        <div className="max-h-[350px] overflow-y-auto p-1 space-y-2 no-scrollbar">
          {activities.length > 0 ? activities.map((act) => (
            <div key={act!.orderId} className="flex flex-col" onClick={() => handleItemClick(act!.orderId)}>
              <ActivityItem 
                orderId={act!.orderId} 
                label={act!.label}
                desc={act!.desc}
                icon={act!.icon}
                color={act!.color}
                bg={act!.bg}
                timestamp={act!.timestamp}
                isUnread={!seenIds.includes(act!.orderId)}
                serviceType={act!.serviceType}
              />
            </div>
          )) : (
            <div className="py-10 text-center">
              <Bell className="w-12 h-12 bg-slate-50 rounded-full p-3 mx-auto mb-3 text-slate-200" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sin actividad reciente</p>
            </div>
          )}
        </div>
        <div className="h-px bg-slate-50 mx-2 mt-2" />
        <div className="p-1">
          <Link href="/admin/orders" className="flex items-center justify-center h-10 rounded-xl hover:bg-primary/5 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ver historial completo</Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
