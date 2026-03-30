
"use client";

import Link from 'next/link';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActivityItemProps {
  orderId: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  timestamp?: any;
  isUnread?: boolean;
  onClick?: () => void;
}

export function ActivityItem({ orderId, label, desc, icon: Icon, color, bg, timestamp, isUnread, onClick }: ActivityItemProps) {
  const dateObj = timestamp?.toDate?.() || new Date();
  const timeStr = format(dateObj, "HH:mm");
  const dateStr = format(dateObj, "eee", { locale: es }).toUpperCase();

  return (
    <DropdownMenuItem asChild className="rounded-2xl p-3.5 cursor-pointer focus:bg-slate-50 border border-transparent focus:border-slate-100 transition-all hover:scale-[1.02] relative group" onClick={onClick}>
      <Link href={`/admin/orders#${orderId}`} className="flex items-start gap-4">
        {/* ICON CONTAINER CON PULSO OPCIONAL */}
        <div className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all duration-500",
          bg, color,
          isUnread && "animate-pulse ring-4 ring-offset-0 ring-primary/5"
        )}>
          <Icon className="w-5.5 h-5.5" />
        </div>

        {/* CONTENT CONTAINER */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              "text-[9px] font-black uppercase tracking-[0.15em] leading-none transition-colors",
              isUnread ? color : "text-slate-400"
            )}>
              {label}
            </p>
            
            {/* CYBER BADGE DE TIEMPO PROFESIONAL */}
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
            {desc}
          </p>
        </div>

        {/* INDICADOR DE NO LEÍDO */}
        {isUnread && (
          <div className={cn("absolute top-3 right-3 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm bg-primary", color.replace('text-', 'bg-'))} />
        )}
      </Link>
    </DropdownMenuItem>
  );
}
