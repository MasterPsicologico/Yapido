
"use client";

import { useState, useEffect, useMemo } from 'react';
import { MessageSquareText, User as UserIcon } from 'lucide-react';
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
import { collection, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function MessageCenter() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [unreadSessionOrders, setUnreadSessionOrders] = useState<[string, string][]>([]);

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail && e.detail.unreadMap) {
          const map = e.detail.unreadMap as Map<string, string>;
          const list = Array.from(map.entries());
          setUnreadSessionOrders(list);
      }
    };
    window.addEventListener('unread-messages-sync' as any, handleSync);
    return () => window.removeEventListener('unread-messages-sync' as any, handleSync);
  }, []);

  const activeChatsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'orders'),
      where('participants', 'array-contains', user.uid)
    );
  }, [firestore, user?.uid]);

  const { data: rawOrders } = useCollection(activeChatsQuery);

  const activeChats = useMemo(() => {
    if (!rawOrders) return [];
    return rawOrders
      .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
      .map(o => ({ id: o.id, name: o.productName || 'Chat de Pedido' }));
  }, [rawOrders]);

  const count = unreadSessionOrders.length || activeChats.length;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 transition-colors h-8 w-8 sm:h-9 sm:w-9">
          <MessageSquareText className={cn("w-4 h-4 sm:w-4.5 sm:h-4.5", unreadSessionOrders.length > 0 ? "text-secondary animate-pulse" : "text-slate-400")} />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-secondary text-white text-[8px] sm:text-[9px] font-black w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {count}
            </span>
          )}
        </Button>
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
          {activeChats.length > 0 ? activeChats.map((chat) => {
            const isUnread = unreadSessionOrders.some(([id]) => id === chat.id);
            return (
              <DropdownMenuItem key={chat.id} asChild className="rounded-2xl p-3.5 cursor-pointer focus:bg-slate-50 border border-transparent focus:border-slate-100 transition-all hover:scale-[1.02]">
                <Link href={`/admin/orders#${chat.id}`} className="flex items-start gap-4">
                  <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm", isUnread ? "bg-secondary text-white" : "bg-secondary/10 text-secondary")}>
                    <UserIcon className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none">
                      {isUnread ? "¡Mensaje Nuevo!" : "Historial de Chat"}
                    </p>
                    <p className="text-[15px] font-black text-slate-900 leading-tight italic uppercase tracking-tighter truncate">
                      {chat.name}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            );
          }) : (
            <div className="py-10 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquareText className="w-6 h-6 text-slate-200" />
              </div>
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
