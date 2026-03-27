
'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ToastAction } from '@/components/ui/toast';

export function ChatNotificationListener() {
  const { user } = useUser();
  const { isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [unreadItems, setUnreadItems] = useState<Map<string, { title: string, type: 'order' | 'message' }>>(new Map());
  const notifiedIds = useRef<Set<string>>(new Set());
  const lastAlarmTime = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.8;
  }, []);

  useEffect(() => {
    const unreadMessages = new Map(
      Array.from(unreadItems.entries())
        .filter(([_, v]) => v.type === 'message')
        .map(([k, v]) => [k, v.title])
    );
    window.dispatchEvent(new CustomEvent('unread-messages-sync', { detail: { unreadMap: unreadMessages } }));
  }, [unreadItems]);

  useEffect(() => {
    if (!firestore || !user?.uid || profileLoading) return;

    const unsubscribers: (() => void)[] = [];
    const messageUnsubs = new Map<string, () => void>();

    const ordersQuery = query(
      collection(firestore, 'orders'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const orderData = change.doc.data();
        const orderId = change.doc.id;

        if (change.type === 'added') {
          const now = Date.now();
          const createdAt = orderData.createdAt?.toMillis?.() || now;
          const isRecentlyCreated = now - createdAt < 90000;

          if (isRecentlyCreated && orderData.storeOwnerId === user.uid && orderData.status === 'pending' && !notifiedIds.current.has(orderId)) {
            notifiedIds.current.add(orderId);
            setUnreadItems(prev => {
              const next = new Map(prev);
              next.set(orderId, { title: orderData.productName || 'Nuevo Pedido', type: 'order' });
              return next;
            });
            triggerAlarm(orderId, orderData.productName || 'Nuevo Pedido', '¡NUEVO PEDIDO RECIBIDO!');
          }

          notifiedIds.current.add(orderId);

          if (!messageUnsubs.has(orderId)) {
            const messagesRef = collection(firestore, 'orders', orderId, 'messages');
            const unsubMsg = onSnapshot(messagesRef, (msgSnap) => {
              msgSnap.docChanges().forEach((msgChange) => {
                if (msgChange.type === 'added') {
                  const msg = msgChange.doc.data();
                  const msgId = msgChange.doc.id;

                  if (msg.senderId === user.uid) return;
                  if (notifiedIds.current.has(msgId)) return;

                  const msgTime = msg.createdAt?.toMillis?.() || Date.now();
                  if (Date.now() - msgTime < 60000) {
                    notifiedIds.current.add(msgId);
                    setUnreadItems(prev => {
                      const next = new Map(prev);
                      next.set(orderId, { title: orderData.productName || 'Chat', type: 'message' });
                      return next;
                    });
                    triggerAlarm(orderId, orderData.productName || 'Chat', '¡MENSAJE EN VIVO!');
                  }
                  notifiedIds.current.add(msgId);
                }
              });
            });
            messageUnsubs.set(orderId, unsubMsg);
            unsubscribers.push(unsubMsg);
          }
        }

        if (change.type === 'removed') {
          const unsub = messageUnsubs.get(orderId);
          if (unsub) unsub();
          messageUnsubs.delete(orderId);
        }
      });
    });

    unsubscribers.push(unsubOrders);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      messageUnsubs.forEach(unsub => unsub());
    };
  }, [user?.uid, firestore, profileLoading]);

  const triggerAlarm = (orderId: string, title: string, toastTitle: string) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([500, 200, 500]);
    }

    toast({
      title: `🚨 ${toastTitle}`,
      description: `Tienes actividad en "${title}".`,
      action: (
        <ToastAction 
          altText="Atender" 
          onClick={() => {
            window.dispatchEvent(new CustomEvent('chat-opened', { detail: { orderId } }));
            router.push(`/admin/orders#${orderId}`);
          }}
          className="bg-primary text-white hover:bg-primary/90 font-black rounded-full h-10 px-6 border-none"
        >
          ATENDER
        </ToastAction>
      ),
    });

    lastAlarmTime.current = Date.now();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (unreadItems.size > 0) {
        const now = Date.now();
        if (now - lastAlarmTime.current > 10000) {
            const entry = Array.from(unreadItems.entries())[0];
            if (entry) triggerAlarm(entry[0], entry[1].title, entry[1].type === 'order' ? 'PEDIDO PENDIENTE' : 'MENSAJE PENDIENTE');
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [unreadItems]);

  useEffect(() => {
    const handleAttended = (e: any) => {
      const orderId = e.detail?.orderId;
      if (orderId) {
        setUnreadItems(prev => {
          if (!prev.has(orderId)) return prev;
          const next = new Map(prev);
          next.delete(orderId);
          return next;
        });
      }
    };
    window.addEventListener('chat-opened' as any, handleAttended);
    window.addEventListener('order-attended' as any, handleAttended);
    return () => {
      window.removeEventListener('chat-opened' as any, handleAttended);
      window.removeEventListener('order-attended' as any, handleAttended);
    };
  }, []);

  return null;
}
