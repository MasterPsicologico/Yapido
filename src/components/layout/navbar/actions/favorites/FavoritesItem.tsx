"use client";

import Image from 'next/image';
import { Eye, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavoritesItemProps {
  id: string;
  name: string;
  subLabel: string;
  imageUrl: string;
  price?: number;
  onClick?: () => void;
}

export function FavoritesItem({ name, subLabel, imageUrl, price, onClick }: FavoritesItemProps) {
  return (
    <div 
      onClick={onClick}
      className="group relative rounded-2xl p-2 cursor-pointer bg-white border border-slate-100 hover:border-rose-200 hover:shadow-[0_8px_30px_rgb(225,29,72,0.12)] hover:-translate-y-1 transition-all duration-500 outline-none overflow-hidden flex flex-col gap-2"
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-500 mb-1">
        <Image src={imageUrl} alt={name} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Floating action button effect */}
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md shadow-sm opacity-0 group-hover:opacity-100 flex items-center justify-center shrink-0 transition-all duration-500 translate-y-2 group-hover:translate-y-0 z-10">
          <Eye className="w-3.5 h-3.5 text-rose-500" />
        </div>

        {/* Small badge overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 z-10">
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
        </div>
      </div>
      
      <div className="flex flex-col flex-1 min-w-0 px-0.5">
        <p className="text-[11px] font-black text-slate-800 leading-snug break-words whitespace-normal group-hover:text-rose-600 transition-colors duration-300">
          {name}
        </p>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className={cn(
            "inline-flex items-center rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider border",
            price ? "bg-emerald-50/50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"
          )}>
            {price ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price) : subLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
