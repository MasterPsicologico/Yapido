
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
  Check
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
    <Card className="group flex flex-col h-full border-none rounded-[28px] shadow-sm hover:shadow-xl transition-all duration-500 bg-white overflow-hidden border-b sm:border">
      <Link href={`/stores/${store.id}`} className="block relative aspect-[5/4] w-full overflow-hidden bg-slate-50">
        <Image
          src={store.imageUrl || 'https://picsum.photos/seed/store/800/600'}
          alt={store.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
          data-ai-hint="store image"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {store.isPro && (
            <Badge className="bg-secondary text-white border-none text-[8px] h-5 px-2.5 rounded-full uppercase font-black tracking-widest shadow-lg">
              PRO
            </Badge>
          )}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 shadow-sm">
          <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
          <span className="text-[9px] font-black text-slate-900">4.9</span>
        </div>
      </Link>

      <CardContent className="p-4 sm:p-6 flex flex-col flex-1 space-y-4">
        <Link href={`/stores/${store.id}`} className="space-y-1 block overflow-hidden">
          <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 group-hover:text-primary transition-colors leading-[1.1] tracking-tighter italic break-words hyphens-auto">
            {store.name}
          </h3>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 max-w-[60%]">
              <MapPin className="w-3 h-3 text-primary/60 shrink-0" />
              <span className="text-[10px] font-bold text-slate-400 line-clamp-1 truncate">{store.address || 'Aguachica'}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <Clock className="w-2.5 h-2.5" />
              <span className="text-[9px] font-black uppercase tracking-tighter">15-30 min</span>
            </div>
          </div>
        </Link>

        {/* Sistema de Badges Verticales Dinámicos */}
        <div className="flex flex-col gap-1.5 min-h-[28px]">
          {activeBadgeIds.map((id) => {
            const badge = VALUE_BADGES_CONFIG[id];
            if (!badge) return null;
            return (
              <div 
                key={id} 
                className={cn(
                  "flex items-center justify-between px-3 h-8 rounded-xl border transition-all",
                  badge.bg,
                  badge.border
                )}
              >
                 <div className="flex items-center gap-2">
                   <badge.icon className={cn("w-3.5 h-3.5", badge.color, badge.animate && "animate-pulse")} />
                   <span className={cn("text-[9px] font-black uppercase tracking-wider", badge.color)}>
                    {badge.label}
                   </span>
                 </div>
                 {isAdmin && (
                   <button 
                     onClick={(e) => { e.preventDefault(); handleRemoveBadge(id); }}
                     className="p-1 hover:bg-red-100 rounded-full transition-colors text-red-500"
                   >
                     <Trash2 className="w-3 h-3" />
                   </button>
                 )}
              </div>
            );
          })}

          {/* Botón de Añadir para Administrador */}
          {isAdmin && activeBadgeIds.length < 4 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 h-8 rounded-xl border border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 transition-all group/add">
                  <PlusCircle className="w-3.5 h-3.5 text-slate-300 group-hover/add:text-primary" />
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest group-hover/add:text-primary">Asignar Ítem</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 rounded-[20px] p-1.5 shadow-2xl border-slate-100 bg-white/98 backdrop-blur-md">
                {(Object.keys(VALUE_BADGES_CONFIG) as BadgeKey[])
                  .filter(key => !activeBadgeIds.includes(key))
                  .map((key) => {
                    const item = VALUE_BADGES_CONFIG[key];
                    return (
                      <DropdownMenuItem 
                        key={key} 
                        onClick={() => handleAddBadge(key)}
                        className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-all"
                      >
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-50", item.color)}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{item.label}</span>
                      </DropdownMenuItem>
                    );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-medium italic">
          {store.description || 'Explora lo mejor de nuestra vitrina digital.'}
        </p>

        <div className="mt-auto pt-2">
          {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {StatusContent}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-[20px] p-1.5 shadow-2xl border-slate-100 bg-white/98 backdrop-blur-md">
                {(Object.keys(STATUS_MAP) as StatusKey[]).map((key) => {
                  const item = STATUS_MAP[key];
                  const ItemIcon = item.icon;
                  return (
                    <DropdownMenuItem 
                      key={key} 
                      onClick={() => handleStatusChange(key)}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all mb-0.5",
                        currentStatusKey === key ? "bg-slate-50 font-black" : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-50", item.color)}>
                        <ItemIcon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{item.label}</span>
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
