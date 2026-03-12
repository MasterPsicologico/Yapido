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
 * Proporciona alertas visuales (vibración), auditivas y físicas (vibración del hardware).
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
    // Inicializar el sonido de notificación
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.8;
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
            
            // Ignorar mensajes enviados por mí
            if (msg.senderId === user.uid) return;
            
            // Evitar duplicados
            if (notifiedMessageIds.current.has(msgId)) return;

            // Solo notificar mensajes nuevos (último minuto)
            const now = Date.now();
            const msgTime = msg.createdAt?.toMillis?.() || now;
            if (now - msgTime > 60000) {
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

  /**
   * Dispara la alarma triple: Sonido, Vibración Física y Aviso Visual.
   */
  const triggerAlarm = (orderId: string, title: string) => {
    // 1. Alarma Auditiva
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Fallback si el navegador bloquea el audio sin interacción previa
      });
    }

    // 2. Alarma Física (Vibración del Hardware del teléfono)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      // Patrón de vibración: 500ms vibra, 200ms pausa, 500ms vibra
      navigator.vibrate([500, 200, 500]);
    }

    // 3. Alarma Visual con efecto de vibración CSS
    toast({
      title: "🚨 ¡MENSAJE CRÍTICO!",
      description: `Tienes una comunicación importante en "${title}".`,
      variant: "default",
      className: "bg-primary text-white border-none shadow-2xl animate-vibrate cursor-pointer h-24",
      action: (
        <ToastAction 
          altText="Atender" 
          onClick={() => {
            // Al atender, redirigimos y limpiamos el ID de la lista de no leídos
            setUnreadOrders(prev => {
              const next = new Map(prev);
              next.delete(orderId);
              return next;
            });
            router.push(`/admin/orders?chat=${orderId}`);
          }}
          className="bg-white text-primary hover:bg-white/90 font-black border-none rounded-full h-10 px-6"
        >
          ATENDER
        </ToastAction>
      ),
    });

    lastAlarmTime.current = Date.now();
  };

  /**
   * Sistema de repetición persistente.
   * Si hay mensajes no leídos, la alarma vuelve a sonar cada 10 segundos.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (unreadOrders.size > 0) {
        const now = Date.now();
        // Repetir alarma cada 10 segundos si el usuario no ha respondido
        if (now - lastAlarmTime.current > 10000) {
            const [orderId, orderName] = Array.from(unreadOrders.entries())[0];
            triggerAlarm(orderId, orderName);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [unreadOrders]);

  /**
   * Escuchar cuando el chat se abre físicamente para detener la alarma de ese pedido.
   */
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
