
"use client";

import { Waves, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WasherHeaderProps {
  storeName?: string;
  activeTab: 'stats' | 'drivers' | 'orders';
  setActiveTab: (tab: 'stats' | 'drivers' | 'orders') => void;
}

export function WasherHeader({ storeName, activeTab, setActiveTab }: WasherHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-slate-950 rounded-[32px] flex items-center justify-center text-white shadow-2xl relative border border-white/10">
          <Waves className="w-10 h-10 text-primary animate-pulse" />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-4 border-[#f8fafc]">
            <Settings className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">{storeName}</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Panel de Control de Flota</p>
        </div>
      </div>
      <div className="flex gap-2 bg-white p-1.5 rounded-full shadow-sm border border-slate-100">
        <Button onClick={() => setActiveTab('stats')} variant={activeTab === 'stats' ? 'default' : 'ghost'} className="rounded-full h-11 text-[10px] font-black uppercase px-6">Dashboard</Button>
        <Button onClick={() => setActiveTab('drivers')} variant={activeTab === 'drivers' ? 'default' : 'ghost'} className="rounded-full h-11 text-[10px] font-black uppercase px-6">Repartidores</Button>
        <Button onClick={() => setActiveTab('orders')} variant={activeTab === 'orders' ? 'default' : 'ghost'} className="rounded-full h-11 text-[10px] font-black uppercase px-6">Log</Button>
      </div>
    </div>
  );
}
