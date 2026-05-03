
"use client";

import { useState, useMemo } from 'react';
import { OrderFeedItem } from './OrderFeedItem';
import { cn } from '@/lib/utils';

interface OrderFeedProps {
  orders: any[] | null;
  isLoading: boolean;
}

type FilterType = 'all' | 'active' | 'completed';

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'completed', label: 'Finalizados' },
];

const ACTIVE_STATUSES = ['pending', 'ready_for_pickup', 'at_store', 'delivered_to_driver', 'shipped', 'at_destination', 'delivered'];

export function OrderFeed({ orders, isLoading }: OrderFeedProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = orders;
    if (filter === 'active') {
      filtered = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
    } else if (filter === 'completed') {
      filtered = orders.filter(o => o.status === 'completed');
    }

    return filtered.sort((a, b) => {
      const aTime = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const bTime = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  }, [orders, filter]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Filtros */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-3 shrink-0">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={cn(
              "text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all",
              filter === opt.key
                ? "bg-slate-900 text-white shadow-lg"
                : "bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 ring-1 ring-slate-100"
            )}
          >
            {opt.label}
            {opt.key !== 'all' && orders && (
              <span className="ml-1.5 text-[8px] opacity-60">
                ({opt.key === 'active' 
                  ? orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length
                  : orders.filter(o => o.status === 'completed').length
                })
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feed scrollable */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-4 no-scrollbar">
        {filteredOrders.map(order => (
          <OrderFeedItem key={order.id} order={order} />
        ))}

        {filteredOrders.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <p className="text-slate-300 font-black uppercase tracking-widest text-sm italic">
              Sin órdenes en este filtro
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
