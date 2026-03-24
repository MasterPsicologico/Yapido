
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

export function MessageCenter() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [unreadSessionOrders, setUnreadSessionOrders] = useState<[string, string][]>([]);

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail?.unreadMap) {
        setUnreadSessionOrders(Array.from((e.detail.unreadMap as Map<string, string>).entries()));
      }
    };
    window.addEventListener('unread-messages-sync' as any, handleSync);
    return () => window.removeEventListener('unread-messages-sync' as any, handleSync);
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

  const count = unreadSessionOrders.length || activeChats.length;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <MessageTrigger count={count} hasUnread={unreadSessionOrders.length > 0} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-2 rounded-[28px] shadow-2xl border-none bg-white mt-2" align="center">
        <DropdownMenuLabel className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black italic uppercase tracking-tighter text-slate-900">Chats Activos</span>
            <Badge className="bg-secondary text-white rounded-full text-[10px] font-black border-none">{count}</Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-50" />
        <div className="max-h-[350px] overflow-y-auto p-1 space-y-2 no-scrollbar">
          {activeChats.length > 0 ? activeChats.map((chat) => (
            <MessageItem key={chat.id} chatId={chat.id} name={chat.name} isUnread={unreadSessionOrders.some(([id]) => id === chat.id)} />
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
