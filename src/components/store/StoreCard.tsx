
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { 
  Store as StoreIcon, 
  MapPin, 
  ChevronRight, 
  Zap, 
  Award, 
  Star, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  ChevronDown, 
  Crown, 
  Leaf, 
  Heart, 
  Medal, 
  PlusCircle, 
  Trash2, 
  Check,
  Plus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { useProfile } from '@/firebase/auth/use-profile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_MAP = {
  verified: { label: "Vitrina Verificada", icon: ShieldCheck, color: "text-primary", bg: "bg-primary/5", border: "border-primary/10" },
  new: { label: "Tienda Nueva", icon: Sparkles, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
  rising: { label: "En Tendencia", icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
  pro: { label: "Negocio Pro", icon: Award, color: "text-secondary", bg: "bg-secondary/5", border: "border-secondary/10" },
  top_seller: { label: "Vendedor Estrella", icon: Medal, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
  fast_delivery: { label: "Entrega Flash", icon: Zap, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  eco_friendly: { label: "Eco Amigable", icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  exclusive: { label: "Selección Exclusive", icon: Crown, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  local_hero: { label: "Orgullo Local", icon: Heart, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
};

const VALUE_BADGES_CONFIG = {
  express: { label: "Envío Express", icon: Zap, color: "text-primary", bg: "bg-primary/5", border: "border-primary/10", animate: true },
  eco: { label: "Eco Amigable", icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", animate: false },
  top: { label: "Top Choice", icon: Medal, color: "text-secondary", bg: "bg-secondary/5", border: "border-secondary/10", animate: false },
  stock: { label: "Stock Vivo", icon: Sparkles, color: "text-green-600", bg: "bg-green-50", border: "border-green-100", animate: true },
  flash: { label: "Entrega Flash", icon: Zap, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", animate: true },
  exclusive: { label: "Exclusivo", icon: Crown, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", animate: false },
  hero: { label: "Orgullo Local", icon: Heart, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", animate: false },
};

type StatusKey = keyof typeof STATUS_MAP;
type BadgeKey = keyof typeof VALUE_BADGES_CONFIG;

export function StoreCard({ store }: { store: any }) {
  const firestore = useFirestore();
  const { isAdmin } = useProfile();
  
  const currentStatusKey = (store.verificationStatus as StatusKey) || 'verified';
  const statusInfo = STATUS_MAP[currentStatusKey] || STATUS_MAP.verified;
  const StatusIcon = statusInfo.icon;

  const activeBadgeIds: BadgeKey[] = store.activeBadgeIds || [];
  
  const handleAddBadge = (badgeKey: BadgeKey) => {
    if (!firestore || !store.id || activeBadgeIds.length >= 4) return;
    const newBadges = [...activeBadgeIds, badgeKey];
    const storeRef = doc(firestore, 'stores', store.id);
    updateDocumentNonBlocking(storeRef, { activeBadgeIds: newBadges });
  };

  const handleRemoveBadge = (badgeKey: BadgeKey) => {
    if (!firestore || !store.id) return;
    const newBadges = activeBadgeIds.filter(id => id !== badgeKey);
    const storeRef = doc(firestore, 'stores', store.id);
    updateDocumentNonBlocking(storeRef, { activeBadgeIds: newBadges });
  };

  const handleStatusChange = (newStatus: StatusKey) => {
    if (!firestore || !store.id) return;
    const storeRef = doc(firestore, 'stores', store.id);
    updateDocumentNonBlocking(storeRef, { verificationStatus: newStatus });
  };

  const StatusContent = (
    <div className={cn(
      "flex items-center justify-between w-full py-4 px-6 rounded-[32px] border transition-all duration-500 shadow-sm bg-white",
      statusInfo.bg,
      statusInfo.border,
      isAdmin && "hover:bg-slate-50 hover:shadow-xl cursor-pointer group/status active:scale-[0.98]"
    )}>
      <div className="flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-md border border-slate-100 transition-transform group-hover/status:rotate-[10deg]", statusInfo.color)}>
            <StatusIcon className="w-5.5 h-5.5" />
          </div>
          <div className="flex flex-col">
            <span className={cn("text-[12px] font-black uppercase tracking-[0.15em] italic leading-none", statusInfo.color)}>
              {statusInfo.label}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Estatus Oficial</span>
          </div>
      </div>
      {isAdmin ? (
        <ChevronDown className="w-4 h-4 text-slate-300 group-hover/status:text-primary transition-colors" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-white/50 flex items-center justify-center shadow-inner">
          <ChevronRight className="w-4.5 h-4.5 text-slate-300 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );

  return (
    <Card className="group flex flex-col h-full border-none rounded-[48px] shadow-[0_15px_50px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.12)] transition-all duration-700 bg-white overflow-hidden">
      {/* Mitad Superior: Identidad Visual (Se mantiene intacta) */}
      <Link href={`/stores/${store.id}`} className="block relative aspect-[16/11] w-full overflow-hidden bg-slate-50">
        <Image
          src={store.imageUrl || 'https://picsum.photos/seed/store/800/600'}
          alt={store.name}
          fill
          className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
          data-ai-hint="store image"
        />
        
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-xl">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-[11px] font-black text-slate-900">4.9</span>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/30 to-transparent z-10" />

        <div className="absolute bottom-8 left-8 right-8 z-20 text-white space-y-4">
          <h3 className="text-4xl sm:text-5xl font-black text-white italic leading-[0.8] tracking-tighter uppercase drop-shadow-2xl break-words">
            {store.name}
          </h3>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 opacity-90 max-w-[70%]">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg">
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[12px] font-black uppercase tracking-[0.1em] truncate">{store.address || 'Aguachica'}</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-inner">
              <Clock className="w-4 h-4 text-secondary animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-tighter">15 MIN</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Mitad Inferior: REESTRUCTURADA PREMIUM */}
      <CardContent className="p-10 flex flex-col flex-1 space-y-10 bg-white">
        
        {/* Sección de Mensaje de Marca Personalizado */}
        {store.description && (
          <div className="relative group/desc">
            <div className="absolute -left-5 top-0 w-1.5 h-full bg-primary/10 rounded-full group-hover/desc:bg-primary/30 transition-colors" />
            <p className="text-[15px] text-slate-600 leading-[1.7] font-medium italic pl-3 pr-2 break-words">
              "{store.description}"
            </p>
          </div>
        )}

        {/* Sistema de Atributos Jewel-Case */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Atributos de Valor</h4>
            {isAdmin && activeBadgeIds.length < 4 && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="icon" 
                    className="h-8 w-8 rounded-full bg-slate-900 text-white hover:bg-primary transition-all active:scale-90 border-none shadow-xl"
                  >
                    <Plus className="w-4.5 h-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-[32px] p-3 shadow-2xl border-none bg-white ring-1 ring-black/5 z-[100]">
                  <div className="px-4 py-2 mb-2 border-b">
                    <h5 className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Distintivos VIP</h5>
                  </div>
                  {(Object.keys(VALUE_BADGES_CONFIG) as BadgeKey[])
                    .filter(key => !activeBadgeIds.includes(key))
                    .map((key) => {
                      const item = VALUE_BADGES_CONFIG[key];
                      return (
                        <DropdownMenuItem 
                          key={key} 
                          onClick={() => handleAddBadge(key)}
                          className="flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all mb-1"
                        >
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-50", item.color)}>
                            <item.icon className="w-5.5 h-5.5" />
                          </div>
                          <span className="text-[12px] font-black uppercase tracking-widest text-slate-600">{item.label}</span>
                        </DropdownMenuItem>
                      );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {activeBadgeIds.length > 0 ? activeBadgeIds.map((id) => {
              const badge = VALUE_BADGES_CONFIG[id];
              if (!badge) return null;
              return (
                <div 
                  key={id} 
                  className={cn(
                    "flex items-center justify-between pl-4 pr-3 h-14 rounded-[22px] border transition-all duration-500 bg-white group/badge hover:shadow-lg hover:scale-[1.02]",
                    badge.bg,
                    badge.border
                  )}
                >
                   <div className="flex items-center gap-4">
                     <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <badge.icon className={cn("w-5 h-5", badge.color, badge.animate && "animate-pulse")} />
                     </div>
                     <span className={cn("text-[11px] font-black uppercase tracking-[0.2em] italic", badge.color)}>
                      {badge.label}
                     </span>
                   </div>
                   {isAdmin && (
                     <button 
                       onClick={(e) => { e.preventDefault(); handleRemoveBadge(id); }}
                       className="w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white rounded-full transition-all text-red-300 shadow-sm"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   )}
                </div>
              );
            }) : (
              <div className="py-10 flex flex-col items-center justify-center bg-slate-50/40 rounded-[32px] border-2 border-dashed border-slate-100">
                <Sparkles className="w-8 h-8 text-slate-200 mb-3" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.3em] italic">Catálogo en proceso</span>
              </div>
            )}
          </div>
        </div>

        {/* Estatus Maestro - La Bóveda de Cierre */}
        <div className="mt-auto pt-6 relative border-t border-slate-50">
          {isAdmin ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                {StatusContent}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-80 rounded-[40px] p-4 shadow-2xl border-none bg-white ring-1 ring-black/5 z-[100] mt-4">
                <div className="px-5 py-3 mb-3">
                  <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Jerarquía de Vitrina</h5>
                </div>
                {(Object.keys(STATUS_MAP) as StatusKey[]).map((key) => {
                  const item = STATUS_MAP[key];
                  const ItemIcon = item.icon;
                  return (
                    <DropdownMenuItem 
                      key={key} 
                      onClick={() => handleStatusChange(key)}
                      className={cn(
                        "flex items-center gap-5 p-4 rounded-[28px] cursor-pointer transition-all mb-2",
                        currentStatusKey === key ? "bg-slate-50 border-primary/10 border shadow-inner" : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn("w-11 h-11 rounded-full flex items-center justify-center bg-white shadow-md border border-slate-100", item.color)}>
                        <ItemIcon className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className={cn("text-[12px] font-black uppercase tracking-widest", currentStatusKey === key ? item.color : "text-slate-600")}>
                          {item.label}
                        </span>
                        {currentStatusKey === key && <span className="text-[9px] text-primary font-black uppercase mt-1 tracking-tighter italic">ACTIVO</span>}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href={`/stores/${store.id}`}>
              {StatusContent}
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
