
"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Star, Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRef } from 'react';

interface DashboardHeaderProps {
  profile: any;
  level: any;
  stats: { rating: number; deliveredCount: number };
  isOnline: boolean;
  onToggleOnline: () => void;
  isAdmin?: boolean;
  welcomeConfig?: any;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
}

export function DashboardHeader({ 
  profile, level, stats, isOnline, onToggleOnline,
  isAdmin, welcomeConfig, onImageUpload, isUploading 
}: DashboardHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative overflow-hidden border-b bg-slate-900 group/header">
      {/* Fondo de Identidad Global */}
      <div className="absolute inset-0 z-0">
        {welcomeConfig?.backgroundImage ? (
          <Image 
            src={welcomeConfig.backgroundImage} 
            alt="Dashboard Background" 
            fill 
            className="object-cover opacity-40 group-hover/header:scale-105 transition-transform duration-[5000ms]" 
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
      </div>

      {/* Control Maestro de Fondo (Solo Admin) */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-30">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={onImageUpload} 
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
            className="rounded-full h-10 w-10 bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 shadow-2xl transition-all active:scale-90"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4 text-primary" />}
          </Button>
        </div>
      )}

      <div className="relative z-10 px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse blur-xl" />
              <Avatar className="w-24 h-24 border-[4px] border-white/10 shadow-2xl relative z-10">
                <AvatarImage src={profile?.photoURL} className="object-cover" />
                <AvatarFallback className="bg-primary text-white font-black text-2xl">R</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-white">{profile?.displayName || 'Repartidor'}</h1>
                <Badge className={cn("h-6 border-none font-black italic text-[9px]", level.bg, level.color)}>{level.name}</Badge>
              </div>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-primary" /> Verificado • {stats.rating} <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl p-4 rounded-[32px] border border-white/10 shadow-2xl">
            <Button 
              onClick={onToggleOnline} 
              className={cn(
                "rounded-full h-14 px-10 font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95", 
                isOnline ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" : "bg-green-500 text-white shadow-green-500/20 hover:bg-green-600"
              )}
            >
              {isOnline ? "Cerrar Turno" : "Iniciar Turno"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
