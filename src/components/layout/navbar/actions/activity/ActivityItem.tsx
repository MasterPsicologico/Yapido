
"use client";

import Link from 'next/link';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ActivityItemProps {
  orderId: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  onClick?: () => void;
}

export function ActivityItem({ orderId, label, desc, icon: Icon, color, bg, onClick }: ActivityItemProps) {
  return (
    <DropdownMenuItem asChild className="rounded-2xl p-3.5 cursor-pointer focus:bg-slate-50 border border-transparent focus:border-slate-100 transition-all hover:scale-[1.02]" onClick={onClick}>
      <Link href={`/admin/orders#${orderId}`} className="flex items-start gap-4">
        <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm", bg, color)}>
          <Icon className="w-5.5 h-5.5" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none">{label}</p>
          <p className="text-[15px] font-black text-slate-900 leading-tight italic uppercase tracking-tighter truncate">
            {desc}
          </p>
        </div>
      </Link>
    </DropdownMenuItem>
  );
}
