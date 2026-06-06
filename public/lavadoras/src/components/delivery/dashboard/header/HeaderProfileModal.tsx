
"use client";

import { X, Zap, Moon, Phone, Mail, MapPin, MessageCircle, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

interface HeaderProfileModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  level: any;
  isOnline: boolean;
}

export function HeaderProfileModal({ isOpen, onOpenChange, profile, level, isOnline }: HeaderProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[40px] border-none shadow-2xl p-0 bg-white overflow-hidden sm:max-w-[450px] z-[600] animate-in zoom-in duration-300 [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Perfil del Repartidor</DialogTitle>
          <DialogDescription>Información detallada y de contacto.</DialogDescription>
        </DialogHeader>
        
        <div className="h-44 bg-slate-900 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <Avatar className="w-20 h-20 border-[5px] border-white shadow-2xl">
              <AvatarImage src={profile?.photoURL} className="object-cover !opacity-100 !grayscale-0" />
              <AvatarFallback className="bg-slate-100 text-primary font-black text-2xl">R</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <Badge className={cn("text-[8px] font-black px-2 h-4 border-none shadow-lg", level.bg, level.color)}>
                {level.name}
              </Badge>
            </div>
          </div>
        </div>

        <div className="pt-14 px-8 pb-10 space-y-6 relative">
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-2 right-4 z-[700] text-red-600 hover:bg-red-50 rounded-full w-12 h-12 flex items-center justify-center transition-all active:scale-90"
          >
            <X className="w-10 h-10 stroke-[3]" />
          </button>

          <div className="space-y-1 text-center">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              {profile?.displayName}
            </h3>
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-100">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[8px] font-black text-green-600 uppercase">Verificado</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="bg-slate-50 p-5 rounded-[28px] border border-slate-100 flex items-center justify-between">
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
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 px-2">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-slate-600">{profile?.phoneNumber || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-4 px-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-slate-600">{profile?.email || 'repartidor@yapido.click.com'}</span>
              </div>
              <div className="flex items-center gap-4 px-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-slate-600">{profile?.cityName || profile?.address || 'Colombia'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed">
            <Button className="w-full h-16 rounded-[24px] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-sm tracking-widest gap-3 shadow-xl group">
              <MessageCircle className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              CHAT DE SOPORTE ÉLITE
            </Button>
            <div className="flex items-center justify-center gap-2 mt-6 text-slate-300">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em]">yapido.click AI Central</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
