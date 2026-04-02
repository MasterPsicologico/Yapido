
"use client";

import { useState, useEffect, useMemo } from 'react';
import { MessageSquareText, Clock } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { MessageTrigger } from './MessageTrigger';
import { MessageItem } from './MessageItem';

const SEEN_ORDERS_KEY = 'vitriniando_seen_orders_v1';

export function MessageCenter() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [unreadSessionOrders, setUnreadSessionOrders] = useState<[string, string][]>([]);
  const [seenIds, setSeenIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(SEEN_ORDERS_KEY);
    if (saved) setSeenIds(JSON.parse(saved));

    const handleSync = (e: any) => {
      if (e.detail?.unreadMap) {
        setUnreadSessionOrders(Array.from((e.detail.unreadMap as Map<string, string>).entries()));
      }
    };

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

    window.addEventListener('unread-messages-sync' as any, handleSync);
    window.addEventListener('order-attended' as any, handleGlobalUpdate);
    window.addEventListener('chat-opened' as any, handleGlobalUpdate);
    
    return () => {
      window.removeEventListener('unread-messages-sync' as any, handleSync);
      window.removeEventListener('order-attended' as any, handleGlobalUpdate);
      window.removeEventListener('chat-opened' as any, handleGlobalUpdate);
    };
  }, []);

  const activeChatsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'orders'), where('participants', 'array-contains', user.uid));
  }, [firestore, user?.uid]);

  const { data: rawOrders } = useCollection(activeChatsQuery);

  const activeChats = useMemo(() => {
    if (!rawOrders) return [];
    
    return rawOrders
      .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
      .sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      })
      .map(o => ({ 
        id: o.id, 
        name: o.productName || 'Chat de Pedido',
        timestamp: o.updatedAt || o.createdAt 
      }));
  }, [rawOrders]);

  const unreadCount = useMemo(() => {
    const dynamicUnread = unreadSessionOrders.length;
    const historyUnseen = activeChats.filter(c => !seenIds.includes(c.id)).length;
    return Math.max(dynamicUnread, historyUnseen);
  }, [unreadSessionOrders, activeChats, seenIds]);

  const handleItemClick = (orderId: string) => {
    window.dispatchEvent(new CustomEvent('chat-opened', { detail: { orderId } }));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <MessageTrigger count={unreadCount} hasUnread={unreadSessionOrders.length > 0} />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2 rounded-[28px] shadow-2xl border-none bg-white mt-2 z-[1000]" align="center">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black italic uppercase tracking-tighter text-slate-900">Chats Activos</span>
            <Badge className="bg-secondary text-white rounded-full text-[10px] font-black border-none">{unreadCount}</Badge>
          </div>
        </div>
        <div className="h-px bg-slate-50 mx-2" />
        <div className="max-h-[350px] overflow-y-auto p-1 space-y-2 no-scrollbar">
          {activeChats.length > 0 ? activeChats.map((chat) => (
            <div key={chat.id} onClick={() => handleItemClick(chat.id)}>
              <MessageItem 
                chatId={chat.id} 
                name={chat.name} 
                timestamp={chat.timestamp}
                isUnread={unreadSessionOrders.some(([id]) => id === chat.id) || !seenIds.includes(chat.id)} 
              />
            </div>
          )) : (
            <div className="py-10 text-center">
              <MessageSquareText className="w-12 h-12 bg-slate-50 rounded-full p-3 mx-auto mb-3 text-slate-200" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Bandeja vacía</p>
            </div>
          )}
        </div>
        <div className="h-px bg-slate-50 mx-2 mt-2" />
        <div className="p-1">
          <Link href="/admin/orders" className="flex items-center justify-center h-10 rounded-xl hover:bg-secondary/5 text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Ir a todos los chats</Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
