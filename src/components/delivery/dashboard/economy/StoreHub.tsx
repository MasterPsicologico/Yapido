"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { Store, ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface StoreHubProps {
  orders: any[];
}

export function StoreHub({ orders }: StoreHubProps) {
  const pathname = usePathname();
  
  const uniqueStores = useMemo(() => {
    const storesMap = new Map();
    orders.forEach(o => {
      if (o.storeId && o.storeName && !storesMap.has(o.storeId)) {
        storesMap.set(o.storeId, {
          id: o.storeId,
          name: o.storeName,
          orderCount: 1,
          lastInteraction: o.createdAt?.toMillis?.() || (o.createdAt?.seconds * 1000) || 0
        });
      } else if (o.storeId && storesMap.has(o.storeId)) {
        const store = storesMap.get(o.storeId);
        store.orderCount += 1;
        const ts = o.createdAt?.toMillis?.() || (o.createdAt?.seconds * 1000) || 0;
        if (ts > store.lastInteraction) store.lastInteraction = ts;
      }
    });
    return Array.from(storesMap.values()).sort((a, b) => b.lastInteraction - a.lastInteraction).slice(0, 5); // Top 5 recent stores
  }, [orders]);

  if (uniqueStores.length === 0) return null;

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 p-6 mt-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
          <Store className="w-5 h-5 text-indigo-400" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-white italic">Store Hub</h3>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
        {uniqueStores.map(store => (
          <Link 
            key={store.id} 
            href={`/stores/${store.id}?from=${pathname}&expandEconomy=true`}
            className="flex-shrink-0 bg-white/5 hover:bg-white/10 transition-all border border-white/10 rounded-[24px] p-5 w-[160px] active:scale-95 group flex flex-col"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Store className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-white truncate w-full">{store.name}</p>
            <p className="text-[10px] text-indigo-300 uppercase tracking-widest mt-1 flex-1">{store.orderCount} órdenes</p>
            <div className="flex items-center justify-end mt-4">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors">
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
