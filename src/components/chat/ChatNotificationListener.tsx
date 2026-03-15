
'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ToastAction } from '@/components/ui/toast';

export function ChatNotificationListener() {
  const { user } = useUser();
  const { isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  
  // Estado unificado para pedidos y mensajes sin atender
  const [unreadItems, setUnreadItems] = useState<Map<string, { title: string, type: 'order' | 'message' }>>(new Map());
  
  // Refs para control de duplicados y audio
  const notifiedIds = useRef<Set<string>>(new Set());
  const lastAlarmTime = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Alarma sonora de alta fidelidad
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.8;
  }, []);

  // Sincronización con MessageCenter (solo para el badge de chats)
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

    // 1. ESCUCHA MAESTRA DE ÓRDENES (Para detectar Nuevos Pedidos y activar chats)
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
          const isRecentlyCreated = now - createdAt < 90000; // Margen de 1.5 min para evitar ráfaga inicial

          // CASO A: NUEVO PEDIDO (Solo si soy el dueño de la tienda y está pendiente)
          if (isRecentlyCreated && orderData.storeOwnerId === user.uid && orderData.status === 'pending' && !notifiedIds.current.has(orderId)) {
            notifiedIds.current.add(orderId);
            setUnreadItems(prev => {
              const next = new Map(prev);
              next.set(orderId, { title: orderData.productName || 'Nuevo Pedido', type: 'order' });
              return next;
            });
            triggerAlarm(orderId, orderData.productName || 'Nuevo Pedido', '¡NUEVO PEDIDO RECIBIDO!');
          }

          // Registrar ID para evitar notificaciones repetidas
          notifiedIds.current.add(orderId);

          // CASO B: ACTIVAR ESCUCHA DE MENSAJES PARA ESTA ORDEN ESPECÍFICA
          if (!messageUnsubs.has(orderId)) {
            const messagesRef = collection(firestore, 'orders', orderId, 'messages');
            // Nota: No usamos orderBy aquí para evitar errores de índices ausentes durante la creación del pedido
            const unsubMsg = onSnapshot(messagesRef, (msgSnap) => {
              msgSnap.docChanges().forEach((msgChange) => {
                if (msgChange.type === 'added') {
                  const msg = msgChange.doc.data();
                  const msgId = msgChange.doc.id;

                  if (msg.senderId === user.uid) return;
                  if (notifiedIds.current.has(msgId)) return;

                  const msgTime = msg.createdAt?.toMillis?.() || Date.now();
                  // Margen de 60 seg para considerar el mensaje como "nuevo" y no cargar el historial entero como notificaciones
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
            }, (error) => {
              // Gestión silenciosa de errores para evitar que un fallo en un chat rompa toda la escucha
              if (error.code !== 'permission-denied') {
                console.warn("Error en escucha de chat:", orderId, error.code);
              }
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
    }, (error) => {
      // Si hay un error de permisos global, solo registramos, no bloqueamos la UI con un error fatal
      if (error.code !== 'permission-denied') {
        console.error("Error maestro de órdenes:", error.code);
      }
    });

    unsubscribers.push(unsubOrders);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      messageUnsubs.forEach(unsub => unsub());
    };
  }, [user?.uid, firestore, profileLoading]);

  const triggerAlarm = (orderId: string, title: string, toastTitle: string) => {
    // Alarma Sonora
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // Vibración (Android/Chrome)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([500, 200, 500]);
    }

    // Toast persistente con acción directa
    toast({
      title: `🚨 ${toastTitle}`,
      description: `Tienes actividad en "${title}".`,
      variant: "default",
      className: "bg-primary text-white border-none shadow-2xl animate-vibrate cursor-pointer h-24",
      action: (
        <ToastAction 
          altText="Atender" 
          onClick={() => {
            setUnreadItems(prev => {
              const next = new Map(prev);
              next.delete(orderId);
              return next;
            });
            // Redirección directa al ancla del pedido
            router.push(`/admin/orders#${orderId}`);
          }}
          className="bg-white text-primary hover:bg-white/90 font-black border-none rounded-full h-10 px-6"
        >
          ATENDER
        </ToastAction>
      ),
    });

    lastAlarmTime.current = Date.now();
  };

  // Recordatorio cada 10 segundos si hay algo sin atender
  useEffect(() => {
    const interval = setInterval(() => {
      if (unreadItems.size > 0) {
        const now = Date.now();
        // Recordar solo si han pasado más de 10 seg desde la última alarma
        if (now - lastAlarmTime.current > 10000) {
            const entry = Array.from(unreadItems.entries())[0];
            if (entry) triggerAlarm(entry[0], entry[1].title, entry[1].type === 'order' ? 'PEDIDO PENDIENTE' : 'MENSAJE PENDIENTE');
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [unreadItems]);

  // Limpieza cuando el usuario abre el chat manualmente
  useEffect(() => {
    const handleChatOpened = (e: any) => {
      const { orderId } = e.detail;
      if (orderId) {
        setUnreadItems(prev => {
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
