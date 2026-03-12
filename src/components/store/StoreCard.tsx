
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
      "flex items-center justify-between w-full py-2.5 px-4 rounded-2xl border transition-all duration-500 shadow-sm bg-white",
      statusInfo.bg,
      statusInfo.border,
      isAdmin && "hover:bg-slate-50 hover:shadow-lg cursor-pointer group/status active:scale-95"
    )}>
      <div className="flex items-center gap-3">
          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-100", statusInfo.color)}>
            <StatusIcon className="w-4 h-4" />
          </div>
          <span className={cn("text-[10px] font-black uppercase tracking-[0.1em] italic", statusInfo.color)}>
            {statusInfo.label}
          </span>
      </div>
      {isAdmin ? (
        <ChevronDown className="w-3.5 h-3.5 text-slate-300 group-hover/status:text-primary transition-colors" />
      ) : (
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-1 transition-transform" />
      )}
    </div>
  );

  return (
    <Card className="group flex flex-col h-full border-none rounded-[32px] shadow-sm hover:shadow-2xl transition-all duration-500 bg-white overflow-hidden border-b sm:border">
      <Link href={`/stores/${store.id}`} className="block relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
        <Image
          src={store.imageUrl || 'https://picsum.photos/seed/store/800/600'}
          alt={store.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
          data-ai-hint="store image"
        />
        
        {/* Overlay Superior de Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-20">
          {store.isPro && (
            <Badge className="bg-secondary text-white border-none text-[8px] h-5 px-2.5 rounded-full uppercase font-black tracking-widest shadow-lg">
              PRO
            </Badge>
          )}
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 shadow-sm">
            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
            <span className="text-[9px] font-black text-slate-900">4.9</span>
          </div>
        </div>

        {/* Gradiente de Contraste Inferior */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

        {/* Información Dinámica sobre la Imagen */}
        <div className="absolute bottom-5 left-5 right-5 z-20 text-white space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black text-white italic leading-[0.9] tracking-tighter uppercase drop-shadow-md break-words">
            {store.name}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 opacity-90 max-w-[70%]">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest truncate">{store.address || 'Aguachica'}</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-90 shrink-0 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg">
              <Clock className="w-3 h-3 text-secondary" />
              <span className="text-[10px] font-black uppercase tracking-tighter">15-30 MIN</span>
            </div>
          </div>
        </div>
      </Link>

      <CardContent className="p-6 flex flex-col flex-1 space-y-5">
        
        {/* Descripción Estratégica */}
        <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed font-medium italic">
          {store.description || 'Explora lo mejor de nuestra vitrina digital.'}
        </p>

        {/* Sistema de Badges Verticales Dinámicos */}
        <div className="flex flex-col gap-1.5 min-h-[28px]">
          {activeBadgeIds.map((id) => {
            const badge = VALUE_BADGES_CONFIG[id];
            if (!badge) return null;
            return (
              <div 
                key={id} 
                className={cn(
                  "flex items-center justify-between px-3 h-9 rounded-xl border transition-all shadow-sm",
                  badge.bg,
                  badge.border
                )}
              >
                 <div className="flex items-center gap-2.5">
                   <badge.icon className={cn("w-4 h-4", badge.color, badge.animate && "animate-pulse")} />
                   <span className={cn("text-[9px] font-black uppercase tracking-wider", badge.color)}>
                    {badge.label}
                   </span>
                 </div>
                 {isAdmin && (
                   <button 
                     onClick={(e) => { e.preventDefault(); handleRemoveBadge(id); }}
                     className="p-1 hover:bg-red-100 rounded-full transition-colors text-red-500"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                 )}
              </div>
            );
          })}

          {/* Botón de Administrador para añadir Badges */}
          {isAdmin && activeBadgeIds.length < 4 && (
            <div className="flex justify-center pt-2">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="icon" 
                    className="h-9 w-9 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200 border-none transition-transform active:scale-90"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 rounded-[32px] p-2 shadow-2xl border-slate-100 bg-white ring-1 ring-black/5 z-[100]">
                  {(Object.keys(VALUE_BADGES_CONFIG) as BadgeKey[])
                    .filter(key => !activeBadgeIds.includes(key))
                    .map((key) => {
                      const item = VALUE_BADGES_CONFIG[key];
                      return (
                        <DropdownMenuItem 
                          key={key} 
                          onClick={() => handleAddBadge(key)}
                          className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-all mb-1"
                        >
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-50", item.color)}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{item.label}</span>
                        </DropdownMenuItem>
                      );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Estatus Maestro al final */}
        <div className="mt-auto pt-2">
          {isAdmin ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                {StatusContent}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-[32px] p-2 shadow-2xl border-slate-100 bg-white ring-1 ring-black/5 z-[100]">
                {(Object.keys(STATUS_MAP) as StatusKey[]).map((key) => {
                  const item = STATUS_MAP[key];
                  const ItemIcon = item.icon;
                  return (
                    <DropdownMenuItem 
                      key={key} 
                      onClick={() => handleStatusChange(key)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all mb-1.5",
                        currentStatusKey === key ? "bg-slate-50 font-black shadow-inner" : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-100", item.color)}>
                        <ItemIcon className="w-5 h-5" />
                      </div>
                      <span className={cn("text-[11px] font-black uppercase tracking-widest", currentStatusKey === key ? item.color : "text-slate-600")}>
                        {item.label}
                      </span>
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
