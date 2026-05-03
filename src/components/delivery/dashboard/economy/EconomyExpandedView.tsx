
"use client";

import { motion } from 'framer-motion';
import { X, Wallet, TrendingUp, Building2 } from 'lucide-react';
import { WeeklyChallenge } from '@/components/delivery/weekly-challenge';
import { StoreHub } from './StoreHub';
import { useEffect } from 'react';

interface EconomyExpandedViewProps {
  onClose: () => void;
  orders: any[];
  revenueToday: number;
  commissionRate?: number;
  isAdmin?: boolean;
}

export function EconomyExpandedView({ onClose, orders, revenueToday, commissionRate = 0.20, isAdmin = false }: EconomyExpandedViewProps) {
  const driverEarnings = Math.round(revenueToday * commissionRate);
  const businessNet = revenueToday - driverEarnings;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-slate-950 overflow-y-auto no-scrollbar flex flex-col"
    >
      {/* Botón Flotante para Cerrar */}
      <button 
        onClick={onClose}
        className="fixed top-6 right-6 z-[110] w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white shadow-2xl active:scale-90 transition-transform"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Cabecera Financiera - Tu Comisión */}
      <div className="pt-20 px-6 pb-8 bg-gradient-to-b from-emerald-900/40 to-slate-950">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-emerald-400 font-black tracking-[0.3em] uppercase text-xs">Ganancias de hoy</h2>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white">
          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(driverEarnings)}
        </h1>
        <p className="text-slate-400 font-medium mt-1 text-sm">
          {Math.round(commissionRate * 100)}% del ingreso total del negocio
        </p>

        {/* Desglose visual */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ingreso Negocio</span>
            </div>
            <p className="text-xl font-black tracking-tighter text-white">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(revenueToday)}
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[9px] font-black text-emerald-400/80 uppercase tracking-widest">Tu Parte</span>
            </div>
            <p className="text-xl font-black tracking-tighter text-emerald-400">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(driverEarnings)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-24 space-y-6 flex-1">
        {/* Rendimiento Semanal */}
        <div className="ring-4 ring-white/10 rounded-[40px] overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)]">
          <WeeklyChallenge orders={orders} commissionRate={commissionRate} isAdmin={isAdmin} />
        </div>

        {/* Store Hub */}
        <StoreHub orders={orders} />
      </div>
    </motion.div>
  );
}
