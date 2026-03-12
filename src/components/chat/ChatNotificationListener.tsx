'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, or } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

/**
 * ChatNotificationListener
 * 
 * Un componente invisible que monitorea nuevos mensajes en todos los pedidos del usuario.
 * Proporciona alertas visuales (toasts) y auditivas (sonidos) que se repiten
 * hasta que el usuario abre el chat correspondiente.
 */
export function ChatNotificationListener() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [unreadOrders, setUnreadOrders] = useState<Map<string, string>>(new Map());
  const notifiedMessageIds = useRef<Set<string>>(new Set());
  const lastAlarmTime = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar el audio de la alarma
  useEffect(() => {
    // Usamos un sonido de campana de notificación estándar
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.volume = 0.6;
  }, []);

  // Consultar pedidos donde el usuario es participante (Cliente o Vendedor)
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

  // Suscribirse a los mensajes de cada pedido relevante
  useEffect(() => {
    if (!orders || !user || !firestore) return;

    const unsubscribers: (() => void)[] = [];

    orders.forEach(order => {
      const messagesRef = collection(firestore, 'orders', order.id, 'messages');
      // Solo nos interesa el último mensaje para detectar novedades
      const latestMessageQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));

      const unsub = onSnapshot(latestMessageQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const msg = change.doc.data();
            const msgId = change.doc.id;
            
            // Reglas de exclusión:
            // 1. Ignorar si el mensaje es mío
            // 2. Ignorar si ya procesamos este ID
            if (msg.senderId === user.uid) return;
            if (notifiedMessageIds.current.has(msgId)) return;

            // Evitar disparar mensajes muy antiguos al cargar la app
            const now = Date.now();
            const msgTime = msg.createdAt?.toMillis?.() || now;
            if (now - msgTime > 300000) { // 5 minutos de margen
                notifiedMessageIds.current.add(msgId);
                return;
            }

            // ¡Nuevo Mensaje Detectado!
            notifiedMessageIds.current.add(msgId);
            
            // Añadir a la lista de pedidos con mensajes pendientes
            setUnreadOrders(prev => {
              const next = new Map(prev);
              next.set(order.id, order.productName || 'Producto');
              return next;
            });
            
            // Disparar alarma inmediata
            triggerAlarm(order.productName || 'Nuevo Mensaje');
          }
        });
      });
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [orders, user, firestore]);

  const triggerAlarm = (title: string) => {
    // 1. Sonido
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reiniciar para permitir repeticiones rápidas
      audioRef.current.play().catch(() => {
        console.warn("Audio play blocked by browser. User interaction needed.");
      });
    }

    // 2. Notificación Visual (Toast)
    toast({
      title: "🚨 ¡MENSAJE PENDIENTE!",
      description: `Tienes una comunicación importante en el pedido de "${title}".`,
      variant: "default",
      className: "bg-primary text-white border-none shadow-2xl animate-bounce",
    });

    lastAlarmTime.current = Date.now();
  };

  // Lógica de Repetición: Si hay pedidos sin leer, re-notificar cada 15 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (unreadOrders.size > 0) {
        const now = Date.now();
        // Solo repetir si han pasado al menos 15 segundos desde la última alarma
        if (now - lastAlarmTime.current > 15000) {
            const firstOrderName = Array.from(unreadOrders.values())[0];
            const extraCount = unreadOrders.size - 1;
            const message = extraCount > 0 
                ? `${firstOrderName} (+${extraCount} más)` 
                : firstOrderName;
            
            triggerAlarm(message);
        }
      }
    }, 5000); // Revisar cada 5 segundos

    return () => clearInterval(interval);
  }, [unreadOrders]);

  // Escuchar evento personalizado de "chat-abierto" para limpiar el estado de pendiente
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
