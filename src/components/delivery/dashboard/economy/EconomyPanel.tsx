
"use client";

import { useState, useEffect } from 'react';
import { Activity, Wallet, TrendingUp } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { EconomyExpandedView } from './EconomyExpandedView';
import { useSearchParams } from 'next/navigation';

interface EconomyPanelProps {
  activeCount: number;
  revenueToday: number;
  orders: any[];
  commissionRate?: number;
  isAdmin?: boolean;
}

export function EconomyPanel({ activeCount, revenueToday, orders, commissionRate = 0.20, isAdmin = false }: EconomyPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const searchParams = useSearchParams();
  const driverEarnings = Math.round(revenueToday * commissionRate);

  useEffect(() => {
    if (searchParams.get('expandEconomy') === 'true') {
      setIsExpanded(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('expandEconomy');
      url.searchParams.delete('from');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  return (
    <>
      <div className="flex gap-4 px-6 mt-6 mb-2 relative z-10">
        {/* Órdenes Activas Container */}
        <div className="flex-1 bg-white px-5 py-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-orange-500" /> Órdenes Activas
          </p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{activeCount}</p>
        </div>

        {/* Tu Comisión Hoy Container (Clickeable) */}
        <div 
          onClick={() => setIsExpanded(true)}
          className="flex-1 bg-slate-900 px-5 py-4 rounded-3xl shadow-xl shadow-slate-900/20 flex flex-col justify-center cursor-pointer active:scale-95 transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 group"
        >
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> Ganancias de hoy
          </p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tighter group-hover:text-emerald-300 transition-colors">
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(driverEarnings)}
          </p>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
            {Math.round(commissionRate * 100)}% de {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(revenueToday)}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <EconomyExpandedView 
            onClose={() => setIsExpanded(false)} 
            orders={orders}
            revenueToday={revenueToday}
            commissionRate={commissionRate}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>
    </>
  );
}
