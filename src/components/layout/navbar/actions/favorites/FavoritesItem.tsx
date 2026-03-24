
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface FavoritesItemProps {
  id: string;
  name: string;
  subLabel: string;
  imageUrl: string;
  href: string;
  price?: number;
}

export function FavoritesItem({ name, subLabel, imageUrl, href, price }: FavoritesItemProps) {
  return (
    <DropdownMenuItem asChild className="rounded-2xl p-2 cursor-pointer focus:bg-slate-50 border border-transparent transition-all">
      <Link href={href} className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0">
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-slate-900 leading-tight truncate uppercase italic">{name}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">
            {price ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price) : subLabel}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-200" />
      </Link>
    </DropdownMenuItem>
  );
}
