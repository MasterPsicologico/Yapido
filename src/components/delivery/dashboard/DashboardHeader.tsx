
"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  profile: any;
  level: any;
  stats: { rating: number; deliveredCount: number };
  isOnline: boolean;
  onToggleOnline: () => void;
}

export function DashboardHeader({ profile, level, stats, isOnline, onToggleOnline }: DashboardHeaderProps) {
  return (
    <div className="bg-white border-b relative overflow-hidden px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-6">
          <Avatar className="w-24 h-24 border-[4px] border-white shadow-2xl ring-1 ring-slate-100">
            <AvatarImage src={profile?.photoURL} className="object-cover" />
            <AvatarFallback className="bg-primary text-white font-black text-2xl">R</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{profile?.displayName || 'Repartidor'}</h1>
              <Badge className={cn("h-6 border-none font-black italic text-[9px]", level.bg, level.color)}>{level.name}</Badge>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-primary" /> Verificado • {stats.rating} <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-[32px] border border-slate-100 shadow-inner">
          <Button 
            onClick={onToggleOnline} 
            className={cn(
              "rounded-full h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95", 
              isOnline ? "bg-red-50 text-red-500 shadow-red-100 hover:bg-red-100" : "bg-green-500 text-white shadow-green-200 hover:bg-green-600"
            )}
          >
            {isOnline ? "Cerrar Turno" : "Iniciar Turno"}
          </Button>
        </div>
      </div>
    </div>
  );
}
