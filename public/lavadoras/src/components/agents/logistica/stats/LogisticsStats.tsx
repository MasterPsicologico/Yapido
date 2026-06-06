
"use client";

import { useMemo } from 'react';
import { Activity, Truck, CheckCircle2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogisticsStatsProps {
  orders: any[] | null;
}

interface StatItem {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  bgColor: string;
}

export function LogisticsStats({ orders }: LogisticsStatsProps) {
  const stats = useMemo<StatItem[]>(() => {
    if (!orders) return [];

    const activeStatuses = ['pending', 'ready_for_pickup', 'at_store', 'delivered_to_driver', 'shipped', 'at_destination', 'delivered'];
    const transitStatuses = ['shipped', 'at_destination'];

    const active = orders.filter(o => activeStatuses.includes(o.status)).length;
    const inTransit = orders.filter(o => transitStatuses.includes(o.status)).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = orders.filter(o => {
      if (o.status !== 'completed') return false;
      const completedAt = o.completedAt?.toDate?.() || (o.completedAt?.seconds ? new Date(o.completedAt.seconds * 1000) : null);
      return completedAt && completedAt >= today;
    }).length;

    const rated = orders.filter(o => typeof o.rating === 'number');
    const avgRating = rated.length > 0
      ? (rated.reduce((sum, o) => sum + o.rating, 0) / rated.length).toFixed(1)
      : '—';

    return [
      { label: 'Activas', value: active, icon: Activity, color: 'text-blue-500', bgColor: 'bg-blue-50' },
      { label: 'En Tránsito', value: inTransit, icon: Truck, color: 'text-purple-500', bgColor: 'bg-purple-50' },
      { label: 'Hoy', value: completedToday, icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
      { label: 'Rating', value: avgRating, icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
    ];
  }, [orders]);

  return (
    <div className="grid grid-cols-4 gap-3 px-4 sm:px-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col items-center justify-center py-4 rounded-2xl border border-slate-100 bg-white shadow-sm",
            )}
          >
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-2", stat.bgColor)}>
              <Icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <span className="text-xl font-black italic tracking-tighter text-slate-900 leading-none">
              {stat.value}
            </span>
            <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 mt-1">
              {stat.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
