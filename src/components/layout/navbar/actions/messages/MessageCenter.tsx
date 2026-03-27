
"use client";

import { useState, useEffect, useMemo } from 'react';
import { MessageSquareText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    return rawOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
      .map(o => ({ id: o.id, name: o.productName || 'Chat de Pedido' }));
  }, [rawOrders]);

  const unreadCount = useMemo(() => {
    // El contador de mensajes debe priorizar lo que el listener detecta como nuevo
    // pero también filtrar por lo que el usuario ya ha abierto en esta sesión
    const dynamicUnread = unreadSessionOrders.length;
    const historyUnseen = activeChats.filter(c => !seenIds.includes(c.id)).length;
    return Math.max(dynamicUnread, historyUnseen);
  }, [unreadSessionOrders, activeChats, seenIds]);

  const handleItemClick = (orderId: string) => {
    window.dispatchEvent(new CustomEvent('chat-opened', { detail: { orderId } }));
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <MessageTrigger count={unreadCount} hasUnread={unreadSessionOrders.length > 0} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-2 rounded-[28px] shadow-2xl border-none bg-white mt-2" align="center">
        <DropdownMenuLabel className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black italic uppercase tracking-tighter text-slate-900">Chats Activos</span>
            <Badge className="bg-secondary text-white rounded-full text-[10px] font-black border-none">{unreadCount}</Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-50" />
        <div className="max-h-[350px] overflow-y-auto p-1 space-y-2 no-scrollbar">
          {activeChats.length > 0 ? activeChats.map((chat) => (
            <MessageItem 
              key={chat.id} 
              chatId={chat.id} 
              name={chat.name} 
              isUnread={unreadSessionOrders.some(([id]) => id === chat.id) || !seenIds.includes(chat.id)} 
              onClick={() => handleItemClick(chat.id)}
            />
          )) : (
            <div className="py-10 text-center">
              <MessageSquareText className="w-12 h-12 bg-slate-50 rounded-full p-3 mx-auto mb-3 text-slate-200" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Bandeja vacía</p>
            </div>
          )}
        </div>
        <DropdownMenuSeparator className="bg-slate-50" />
        <DropdownMenuItem asChild className="rounded-xl justify-center h-10 focus:bg-secondary/5">
          <Link href="/admin/orders" className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Ir a todos los chats</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
