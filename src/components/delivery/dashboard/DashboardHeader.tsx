
"use client";

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Camera, 
  Loader2, 
  Zap, 
  Moon, 
  User, 
  Phone, 
  Mail, 
  MessageCircle, 
  X,
  MapPin,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <div className="relative overflow-hidden border-b group/header min-h-[380px] flex flex-col justify-center">
      {/* CAPA DE FONDO DUAL CON NITIDEZ TOTAL */}
      <div className="absolute inset-0 z-0">
        <div className={cn(
          "absolute inset-0 transition-opacity duration-1000 ease-in-out",
          isOnline ? "opacity-0" : "opacity-100"
        )}>
          {dashboardConfig?.bgInactive ? (
            <Image src={dashboardConfig.bgInactive} alt="Descanso" fill className="object-cover object-top" priority />
          ) : (
            <div className="absolute inset-0 bg-slate-900" />
          )}
        </div>

        <div className={cn(
          "absolute inset-0 transition-opacity duration-1000 ease-in-out",
          isOnline ? "opacity-100" : "opacity-0"
        )}>
          {dashboardConfig?.bgActive ? (
            <Image src={dashboardConfig.bgActive} alt="Activo" fill className="object-cover object-top" priority />
          ) : (
            <div className="absolute inset-0 bg-primary" />
          )}
        </div>
      </div>

      {/* CONTROLES ADMINISTRATIVOS */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input type="file" ref={activeInputRef} className="hidden" accept="image/*" onChange={(e) => onImageUpload?.(e, 'active')} />
            <button 
              onClick={() => activeInputRef.current?.click()}
              disabled={!!isUploading}
              className={cn(
                "rounded-full h-10 px-4 bg-primary/20 backdrop-blur-md border border-primary/30 text-white hover:bg-primary/40 shadow-2xl transition-all active:scale-90 flex items-center gap-2 outline-none",
                isOnline && "ring-2 ring-primary ring-offset-2 ring-offset-slate-900"
              )}
            >
              {isUploading === 'active' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-primary" />}
              <span className="text-[8px] font-black uppercase tracking-widest">FONDO ACTIVO</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input type="file" ref={inactiveInputRef} className="hidden" accept="image/*" onChange={(e) => onImageUpload?.(e, 'inactive')} />
            <button 
              onClick={() => inactiveInputRef.current?.click()}
              disabled={!!isUploading}
              className={cn(
                "rounded-full h-10 px-4 bg-slate-800/40 backdrop-blur-md border border-white/10 text-white hover:bg-slate-800/60 shadow-2xl transition-all active:scale-90 flex items-center gap-2 outline-none",
                !isOnline && "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
              )}
            >
              {isUploading === 'inactive' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Moon className="w-4 h-4 text-slate-400" />}
              <span className="text-[8px] font-black uppercase tracking-widest">FONDO DESCANSO</span>
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO CENTRAL: IDENTIDAD INTERACTIVA */}
      <div className="relative z-10 px-6 flex flex-col items-center text-center gap-8 pt-12">
        {/* BLOQUE DE NOMBRE Y AVATAR (CLICKABLE) */}
        <div 
          onClick={() => setIsInfoOpen(true)}
          className="cursor-pointer group/info flex flex-col items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          {/* NOMBRE Y NIVEL: VISIBILIDAD CONDICIONAL */}
          {isOnline && (
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter leading-none text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] group-hover/info:scale-105 transition-transform">
                {profile?.displayName || 'Repartidor'}
              </h1>
              <div className="flex justify-center">
                <Badge className={cn("h-5 border-none font-black italic text-[9px] px-3 shadow-xl", level.bg, level.color)}>
                  {level.name}
                </Badge>
              </div>
            </div>
          )}

          <div className="relative">
            <div className={cn(
              "absolute inset-0 rounded-full animate-pulse blur-xl transition-colors duration-1000",
              isOnline ? "bg-primary/40" : "bg-white/20"
            )} />
            <Avatar className="w-[64px] h-[64px] border-[4px] border-white shadow-2xl relative z-10 group-hover/info:border-primary transition-all">
              <AvatarImage src={profile?.photoURL} className="object-cover" />
              <AvatarFallback className="bg-primary text-white font-black text-xl uppercase italic">
                {profile?.displayName?.charAt(0) || 'R'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-lg z-20">
              <ShieldCheck className="w-4 h-4 text-green-500" />
            </div>
          </div>
        </div>
        
        {/* BOTÓN DE ESTADO */}
        <div className="w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
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

      {/* VENTANA DE INFORMACIÓN DETALLADA (MODAL ÉLITE) */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-0 bg-white overflow-hidden sm:max-w-[450px] z-[600] animate-in zoom-in duration-300 [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Perfil del Repartidor</DialogTitle>
            <DialogDescription>Información detallada y de contacto del repartidor.</DialogDescription>
          </DialogHeader>
          
          <div className="h-32 bg-slate-900 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
            
            <div className="absolute -bottom-12 left-8">
              <Avatar className="w-24 h-24 border-[6px] border-white shadow-2xl">
                <AvatarImage src={profile?.photoURL} className="object-cover" />
                <AvatarFallback className="bg-slate-100 text-primary font-black text-3xl">R</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="pt-16 px-8 pb-10 space-y-8 relative">
            {/* BOTÓN DE CIERRE ROJO EN EL CONTENEDOR BLANCO */}
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="absolute top-2 right-4 z-[700] text-red-600 hover:bg-red-50 rounded-full w-12 h-12 flex items-center justify-center transition-all active:scale-90"
            >
              <X className="w-10 h-10 stroke-[3]" />
            </button>

            <div className="space-y-1">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                {profile?.displayName}
              </h3>
              <div className="flex items-center gap-2">
                <Badge className={cn("text-[9px] font-black px-3 h-5 border-none", level.bg, level.color)}>
                  {level.name}
                </Badge>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[8px] font-black text-green-600 uppercase">Verificado</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="bg-slate-50 p-5 rounded-[28px] border border-slate-100 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner transition-colors",
                    isOnline ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  )}>
                    {isOnline ? <Zap className="w-5 h-5 fill-current" /> : <Moon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estatus Actual</p>
                    <p className={cn("text-sm font-black uppercase italic", isOnline ? "text-green-600" : "text-red-600")}>
                      {isOnline ? "En Turno Activo" : "Fuera de Servicio"}
                    </p>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-slate-200 animate-pulse" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4 px-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-slate-600">{profile?.phoneNumber || 'Sin teléfono registrado'}</span>
                </div>
                <div className="flex items-center gap-4 px-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-slate-600">{profile?.email || 'repartidor@vitriniando.com'}</span>
                </div>
                <div className="flex items-center gap-4 px-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-slate-600">{profile?.address || 'Aguachica, Cesar'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed">
              <Button 
                className="w-full h-16 rounded-[24px] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-sm tracking-widest gap-3 shadow-xl shadow-slate-200 group"
              >
                <MessageCircle className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                CHAT DE SOPORTE ÉLITE
              </Button>
              <div className="flex items-center justify-center gap-2 mt-6 text-slate-300">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em]">Vitriniando AI Central</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
