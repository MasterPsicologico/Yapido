'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, or } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ToastAction } from '@/components/ui/toast';

/**
 * ChatNotificationListener
 * 
 * Un componente invisible que monitorea nuevos mensajes en todos los pedidos del usuario.
 * Proporciona alertas visuales (vibración) y auditivas que se repiten.
 */
export function ChatNotificationListener() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [unreadOrders, setUnreadOrders] = useState<Map<string, string>>(new Map());
  const notifiedMessageIds = useRef<Set<string>>(new Set());
  const lastAlarmTime = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.6;
  }, []);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'orders'),
      or(
        where('customerId', '==', user.uid),
        where('storeOwnerId', '==', user.uid)
      )
    );
  }, [firestore, user?.uid]);

  const { data: orders } = useCollection(ordersQuery);

  useEffect(() => {
    if (!orders || !user || !firestore) return;

    const unsubscribers: (() => void)[] = [];

    orders.forEach(order => {
      const messagesRef = collection(firestore, 'orders', order.id, 'messages');
      const latestMessageQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));

      const unsub = onSnapshot(latestMessageQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const msg = change.doc.data();
            const msgId = change.doc.id;
            
            if (msg.senderId === user.uid) return;
            if (notifiedMessageIds.current.has(msgId)) return;

            const now = Date.now();
            const msgTime = msg.createdAt?.toMillis?.() || now;
            if (now - msgTime > 60000) { // Reducido a 1 minuto para mayor frescura
                notifiedMessageIds.current.add(msgId);
                return;
            }

            notifiedMessageIds.current.add(msgId);
            
            setUnreadOrders(prev => {
              const next = new Map(prev);
              next.set(order.id, order.productName || 'Producto');
              return next;
            });
            
            triggerAlarm(order.id, order.productName || 'Nuevo Mensaje');
          }
        });
      });
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [orders, user, firestore]);

  const triggerAlarm = (orderId: string, title: string) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    toast({
      title: "🚨 ¡MENSAJE PENDIENTE!",
      description: `Tienes una comunicación importante en el pedido de "${title}".`,
      variant: "default",
      className: "bg-primary text-white border-none shadow-2xl animate-vibrate cursor-pointer",
      action: (
        <ToastAction 
          altText="Ir al chat" 
          onClick={() => router.push(`/admin/orders?chat=${orderId}`)}
          className="bg-white text-primary hover:bg-white/90 font-black border-none rounded-full h-8 px-4"
        >
          ATENDER
        </ToastAction>
      ),
    });

    lastAlarmTime.current = Date.now();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (unreadOrders.size > 0) {
        const now = Date.now();
        if (now - lastAlarmTime.current > 15000) {
            const [orderId, orderName] = Array.from(unreadOrders.entries())[0];
            triggerAlarm(orderId, orderName);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [unreadOrders]);

  useEffect(() => {
    const handleChatOpened = (e: any) => {
      const { orderId } = e.detail;
      if (orderId) {
        setUnreadOrders(prev => {
          const next = new Map(prev);
          if (next.has(orderId)) {
            next.delete(orderId);
            return next;
          }
          return prev;
        });
      }
    };

    window.addEventListener('chat-opened' as any, handleChatOpened);
    return () => window.removeEventListener('chat-opened' as any, handleChatOpened);
  }, []);

  return null;
}