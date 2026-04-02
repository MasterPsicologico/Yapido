
"use client";

import { Waves, Settings, Users, Activity, ShieldCheck, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WasherHeaderProps {
  storeName?: string;
  activeTab: 'stats' | 'drivers' | 'orders';
  setActiveTab: (tab: 'stats' | 'drivers' | 'orders') => void;
  driverCount?: number;
  orderCount?: number;
}

export function WasherHeader({ storeName, activeTab, setActiveTab, driverCount = 0, orderCount = 0 }: WasherHeaderProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-950 rounded-[24px] flex items-center justify-center text-white shadow-2xl relative border border-white/10 shrink-0">
            <Waves className="w-8 h-8 text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-4 border-[#f8fafc]">
              <Settings className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black tracking-tight leading-none text-slate-900 uppercase">
              {storeName || 'Cargando...'}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Panel de Control de Flota</p>
              <div className="h-1 w-1 rounded-full bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest leading-none">Sincronizado</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 bg-white p-1.5 rounded-full shadow-sm border border-slate-100 w-fit">
          <Button 
            onClick={() => setActiveTab('stats')} 
            variant={activeTab === 'stats' ? 'default' : 'ghost'} 
            className="rounded-full h-10 text-[9px] font-black uppercase px-5 tracking-widest"
          >
            Dashboard
          </Button>
          <Button 
            onClick={() => setActiveTab('drivers')} 
            variant={activeTab === 'drivers' ? 'default' : 'ghost'} 
            className="rounded-full h-10 text-[9px] font-black uppercase px-5 tracking-widest"
          >
            Repartidores
          </Button>
          <Button 
            onClick={() => setActiveTab('orders')} 
            variant={activeTab === 'orders' ? 'default' : 'ghost'} 
            className="rounded-full h-10 text-[9px] font-black uppercase px-5 tracking-widest"
          >
            Log
          </Button>
        </div>
      </div>

      {/* BLOQUE DE METADATOS ESTRATÉGICOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-colors">
          <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Flota Personal</p>
            <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">{driverCount} Vinculados</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-orange-500/20 transition-colors">
          <div className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-inner">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Operaciones</p>
            <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">{orderCount} Totales</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-green-500/20 transition-colors">
          <div className="w-11 h-11 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors shadow-inner">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Estado</p>
            <p className="text-sm font-black text-green-600 uppercase italic tracking-tighter">Tiempo Real</p>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-[28px] shadow-lg flex items-center gap-4 border border-white/5">
          <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
            <Settings className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Sistema</p>
            <p className="text-sm font-black text-white uppercase italic tracking-tighter">Kernel v1.0.4</p>
          </div>
        </div>
      </div>
    </div>
  );
}
