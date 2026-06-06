
"use client";

import { Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { LogisticsHeader } from './header/LogisticsHeader';
import { LogisticsStats } from './stats/LogisticsStats';
import { OrderFeed } from './feed/OrderFeed';
import { LogisticsEmpty } from './empty/LogisticsEmpty';

export function LogisticsPanel() {
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'orders'),
      orderBy('updatedAt', 'desc'),
      limit(100)
    );
  }, [firestore]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

  return (
    <div className="fixed inset-0 z-[400] bg-[#f8fafc] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
      <LogisticsHeader />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary/30" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
              Sincronizando Operaciones...
            </span>
          </div>
        </div>
      ) : !orders || orders.length === 0 ? (
        <LogisticsEmpty />
      ) : (
        <div className="flex-1 flex flex-col min-h-0 pt-4 gap-4">
          <LogisticsStats orders={orders} />
          <OrderFeed orders={orders} isLoading={isLoading} />
        </div>
      )}

      {/* Footer */}
      <div className="h-10 bg-white border-t flex items-center justify-center px-8 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Yapido AI • Orquestador v2.0
          </span>
        </div>
      </div>
    </div>
  );
}
