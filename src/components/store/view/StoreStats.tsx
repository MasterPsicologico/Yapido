
"use client";

import { Tag, Zap, Clock } from 'lucide-react';

export function StoreStats() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="flex flex-col items-center gap-2">
          <div className="w-11 h-11 rounded-full bg-[#fef3c7] flex items-center justify-center">
              <Tag className="w-5 h-5 text-[#d97706]" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 text-center leading-[1.1]">Promociones<br/>diarias</span>
      </div>
      <div className="flex flex-col items-center gap-2">
          <div className="w-11 h-11 rounded-full bg-[#ffedd5] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#ea580c]" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 text-center leading-[1.1]">Productos<br/>frescos</span>
      </div>
      <div className="flex flex-col items-center gap-2">
          <div className="w-11 h-11 rounded-full bg-[#ecfdf5] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#059669]" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 text-center leading-[1.1]">Domicilios<br/>rápidos</span>
      </div>
    </div>
  );
}
