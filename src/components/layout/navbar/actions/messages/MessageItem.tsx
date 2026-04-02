
"use client";

import Link from 'next/link';
import { User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MessageItemProps {
  chatId: string;
  name: string;
  isUnread: boolean;
  timestamp?: any;
  onClick?: () => void;
}

export function MessageItem({ chatId, name, isUnread, timestamp, onClick }: MessageItemProps) {
  const dateObj = timestamp?.toDate?.() || new Date();
  const timeStr = format(dateObj, "HH:mm");
  const dateStr = format(dateObj, "eee", { locale: es }).toUpperCase();

  return (
    <div 
      className="rounded-2xl p-3 cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all hover:scale-[1.02] relative group outline-none" 
      onClick={onClick}
    >
      <Link href={`/admin/orders#${chatId}`} className="flex items-center gap-4">
        {/* Avatar Container */}
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all duration-500",
          isUnread ? "bg-secondary text-white animate-pulse scale-105" : "bg-slate-100 text-slate-400 group-hover:bg-secondary/10 group-hover:text-secondary"
        )}>
          <UserIcon className="w-6 h-6" />
        </div>

        {/* Content Container */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              "text-[9px] font-black uppercase tracking-[0.15em] leading-none transition-colors",
              isUnread ? "text-secondary" : "text-slate-400"
            )}>
              {isUnread ? "¡Mensaje Nuevo!" : "Historial de Chat"}
            </p>
            
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/50 border border-slate-200/50 group-hover:bg-white group-hover:shadow-sm transition-all">
              <span className="text-[8px] font-black text-slate-400 tracking-tighter">{dateStr}</span>
              <div className="w-[1px] h-2 bg-slate-300" />
              <span className="text-[9px] font-black text-slate-600 font-mono">{timeStr}</span>
            </div>
          </div>

          <p className={cn(
            "text-[15px] font-black leading-tight italic uppercase tracking-tighter truncate transition-all",
            isUnread ? "text-slate-900" : "text-slate-500"
          )}>
            {name}
          </p>
        </div>

        {/* Unread dot */}
        {isUnread && (
          <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-white shadow-sm" />
        )}
      </Link>
    </div>
  );
}
