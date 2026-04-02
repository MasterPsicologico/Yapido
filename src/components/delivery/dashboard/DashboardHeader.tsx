
"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Star, Camera, Loader2, Zap, Moon } from 'lucide-react';
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
  dashboardConfig?: any;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>, target: 'active' | 'inactive') => void;
  isUploading?: 'active' | 'inactive' | null;
}

export function DashboardHeader({ 
  profile, level, stats, isOnline, onToggleOnline,
  isAdmin, dashboardConfig, onImageUpload, isUploading 
}: DashboardHeaderProps) {
  const activeInputRef = useRef<HTMLInputElement>(null);
  const inactiveInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative overflow-hidden border-b group/header min-h-[340px] flex flex-col justify-end">
      {/* CAPA DE FONDO DUAL CON NITIDEZ TOTAL (100% OPACIDAD) */}
      <div className="absolute inset-0 z-0">
        {/* FONDO ESTADO: DESCANSO (INACTIVO) */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-1000 ease-in-out",
          isOnline ? "opacity-0" : "opacity-100"
        )}>
          {dashboardConfig?.bgInactive ? (
            <Image 
              src={dashboardConfig.bgInactive} 
              alt="Dashboard Descanso" 
              fill 
              className="object-cover object-top" 
              priority 
            />
          ) : (
            <div className="absolute inset-0 bg-slate-900" />
          )}
        </div>

        {/* FONDO ESTADO: TURNO (ACTIVO) */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-1000 ease-in-out",
          isOnline ? "opacity-100" : "opacity-0"
        )}>
          {dashboardConfig?.bgActive ? (
            <Image 
              src={dashboardConfig.bgActive} 
              alt="Dashboard Activo" 
              fill 
              className="object-cover object-top" 
              priority 
            />
          ) : (
            <div className="absolute inset-0 bg-primary" />
          )}
        </div>
      </div>

      {/* CONTROLES ADMINISTRATIVOS DE FONDO DUAL (SÓLO PARA ADMIN) */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={activeInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => onImageUpload?.(e, 'active')} 
            />
            <Button 
              onClick={() => activeInputRef.current?.click()}
              disabled={!!isUploading}
              variant="outline"
              className={cn(
                "rounded-full h-10 px-4 bg-primary/20 backdrop-blur-md border-primary/30 text-white hover:bg-primary/40 shadow-2xl transition-all active:scale-90 flex items-center gap-2",
                isOnline && "ring-2 ring-primary ring-offset-2 ring-offset-slate-900"
              )}
            >
              {isUploading === 'active' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-primary" />}
              <span className="text-[8px] font-black uppercase tracking-widest">Fondo Activo</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={inactiveInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => onImageUpload?.(e, 'inactive')} 
            />
            <Button 
              onClick={() => inactiveInputRef.current?.click()}
              disabled={!!isUploading}
              variant="outline"
              className={cn(
                "rounded-full h-10 px-4 bg-slate-800/40 backdrop-blur-md border-white/10 text-white hover:bg-slate-800/60 shadow-2xl transition-all active:scale-90 flex items-center gap-2",
                !isOnline && "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
              )}
            >
              {isUploading === 'inactive' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Moon className="w-4 h-4 text-slate-400" />}
              <span className="text-[8px] font-black uppercase tracking-widest">Fondo Descanso</span>
            </Button>
          </div>
        </div>
      )}

      {/* AVATAR COMPACTO EN LA ESQUINA INFERIOR DERECHA */}
      <div className="absolute bottom-3 right-3 z-20 animate-in fade-in slide-in-from-right duration-700">
        <div className="relative">
          <div className={cn(
            "absolute inset-0 rounded-full animate-pulse blur-lg transition-colors duration-1000",
            isOnline ? "bg-primary/30" : "bg-white/10"
          )} />
          <Avatar className="w-[75px] h-[75px] border-[4px] border-white/10 shadow-2xl relative z-10">
            <AvatarImage src={profile?.photoURL} className="object-cover" />
            <AvatarFallback className="bg-primary text-white font-black text-xl">R</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* CONTENIDO DEL PERFIL */}
      <div className="relative z-10 px-6 pb-12 pt-4">
        <div className="flex flex-col items-center text-center gap-6 max-w-4xl mx-auto">
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-lg sm:text-3xl font-black italic uppercase tracking-tighter leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                {profile?.displayName || 'Repartidor'}
              </h1>
              <Badge className={cn("h-6 border-none font-black italic text-[10px] px-4 shadow-lg", level.bg, level.color)}>
                {level.name}
              </Badge>
            </div>
            <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center justify-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <ShieldCheck className="w-3 h-3 text-primary" /> Verificado • {stats.rating} <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            </p>
          </div>
          
          <div className="w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Button 
              onClick={onToggleOnline} 
              className={cn(
                "w-full h-[60px] rounded-[32px] font-black text-base uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 border-b-[6px]",
                isOnline 
                  ? "bg-red-500 text-white border-red-800 hover:bg-red-600 shadow-red-500/20" 
                  : "bg-green-500 text-white border-green-800 hover:bg-green-600 shadow-green-500/20"
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
