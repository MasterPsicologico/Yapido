
"use client";

import Link from 'next/link';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  chatId: string;
  name: string;
  isUnread: boolean;
}

export function MessageItem({ chatId, name, isUnread }: MessageItemProps) {
  return (
    <DropdownMenuItem asChild className="rounded-2xl p-3.5 cursor-pointer focus:bg-slate-50 border border-transparent focus:border-slate-100 transition-all hover:scale-[1.02]">
      <Link href={`/admin/orders#${chatId}`} className="flex items-start gap-4">
        <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm", isUnread ? "bg-secondary text-white" : "bg-secondary/10 text-secondary")}>
          <UserIcon className="w-5.5 h-5.5" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none">
            {isUnread ? "¡Mensaje Nuevo!" : "Historial de Chat"}
          </p>
          <p className="text-[15px] font-black text-slate-900 leading-tight italic uppercase tracking-tighter truncate">
            {name}
          </p>
        </div>
      </Link>
    </DropdownMenuItem>
  );
}
