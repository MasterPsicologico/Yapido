
"use client";

import { useState, useEffect } from 'react';
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
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function MessageCenter() {
  const [unreadOrders, setUnreadOrders] = useState<[string, string][]>([]);
  const [count, setCount] = useState(0);

  // Escuchamos el evento personalizado emitido por ChatNotificationListener
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail && e.detail.unreadMap) {
          const map = e.detail.unreadMap as Map<string, string>;
          const list = Array.from(map.entries());
          setUnreadOrders(list);
          setCount(list.length);
      }
    };
    
    window.addEventListener('unread-messages-sync' as any, handleSync);
    return () => window.removeEventListener('unread-messages-sync' as any, handleSync);
  }, []);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 transition-colors h-9 w-9">
          <MessageSquareText className={cn("w-4.5 h-4.5", count > 0 ? "text-secondary animate-pulse" : "text-slate-400")} />
          {count > 0 && (
            <span className="absolute top-0 right-0 bg-secondary text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
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
        <div className="max-h-[350px] overflow-y-auto p-1 space-y-1 no-scrollbar">
          {unreadOrders.length > 0 ? unreadOrders.map(([id, name]) => (
            <DropdownMenuItem key={id} asChild className="rounded-2xl p-3 cursor-pointer focus:bg-slate-50 border border-transparent focus:border-slate-100 transition-all">
              <Link href={`/admin/orders#${id}`} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0 shadow-sm">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 truncate leading-none mb-1">{name}</p>
                  <p className="text-[9px] font-bold text-secondary uppercase tracking-widest italic animate-pulse">Nuevo mensaje...</p>
                </div>
              </Link>
            </DropdownMenuItem>
          )) : (
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
