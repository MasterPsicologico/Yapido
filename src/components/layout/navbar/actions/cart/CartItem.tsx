
"use client";

import Image from 'next/image';
import { Trash2, Plus, Minus } from 'lucide-react';

interface CartItemProps {
  item: any;
  onUpdateQuantity: (id: string, q: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="group relative flex gap-4 p-2 rounded-2xl transition-all hover:bg-slate-50">
      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-100">
        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h4 className="font-black text-sm italic uppercase text-slate-900 leading-tight line-clamp-1">{item.name}</h4>
          <p className="text-primary font-black text-xs mt-1">
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.price)}
          </p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-full h-8 px-1 gap-3">
            <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"><Minus className="w-3 h-3" /></button>
            <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
            <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"><Plus className="w-3 h-3" /></button>
          </div>
          <button onClick={() => onRemove(item.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
