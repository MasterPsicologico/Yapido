
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
  Plus,
  Package,
  Target
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, where, limit, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useProfile } from '@/firebase/auth/use-profile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

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
  express: { label: "Envío Express", icon: Zap, color: "text-blue-600", category: 'logistics' },
  flash: { label: "Entrega Flash", icon: Target, color: "text-blue-600", category: 'logistics' },
  top: { label: "Top Choice", icon: Medal, color: "text-amber-600", category: 'trust' },
  exclusive: { label: "Exclusivo", icon: Crown, color: "text-purple-600", category: 'community' },
  stock: { label: "Stock Vivo", icon: Package, color: "text-emerald-600", category: 'product' },
  eco: { label: "Eco Friendly", icon: Leaf, color: "text-emerald-600", category: 'product' },
  hero: { label: "Orgullo Local", icon: Heart, color: "text-rose-600", category: 'community' },
};

type StatusKey = keyof typeof STATUS_MAP;
type BadgeKey = keyof typeof VALUE_BADGES_CONFIG;

export function StoreCard({ store }: { store: any }) {
  const firestore = useFirestore();
  const { isAdmin, profile } = useProfile();
  const { user } = useUser();
  
  const isFavorite = profile?.favoriteStores?.includes(store.id);

  const currentStatusKey = (store.verificationStatus as StatusKey) || 'verified';
  const statusInfo = STATUS_MAP[currentStatusKey] || STATUS_MAP.verified;
  const StatusIcon = statusInfo.icon;

  const activeBadgeIds: BadgeKey[] = store.activeBadgeIds || [];
  
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !firestore) {
      toast({ title: "Inicia sesión", description: "Debes ingresar para guardar favoritos.", variant: "destructive" });
      return;
    }

    const userRef = doc(firestore, 'users', user.uid);
    if (isFavorite) {
      updateDocumentNonBlocking(userRef, { favoriteStores: arrayRemove(store.id) });
      toast({ title: "Removido de favoritos" });
    } else {
      updateDocumentNonBlocking(userRef, { favoriteStores: arrayUnion(store.id) });
      toast({ title: "Añadido a favoritos", className: "bg-rose-500 text-white border-none" });
    }
  };

  const handleAddBadge = (badgeKey: BadgeKey) => {
    if (!firestore || !store.id) return;
    const newBadges = [...activeBadgeIds, badgeKey].slice(-4);
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

  // CORE: Reducción a 2 cuadrantes clave para mayor impacto visual
  const QUADRANTS = [
    { id: 'product', label: 'ESTADO', color: 'bg-emerald-50/60', border: 'border-emerald-100', icon: Package, textColor: 'text-emerald-600', accent: 'bg-emerald-500' },
    { id: 'community', label: 'VALOR', color: 'bg-purple-50/60', border: 'border-purple-100', icon: Heart, textColor: 'text-purple-600', accent: 'bg-purple-500' },
  ];

  const StatusContent = (
    <div className={cn(
      "flex items-center justify-between w-full py-3.5 px-6 rounded-[28px] border transition-all duration-500 shadow-sm bg-gradient-to-r from-white to-slate-50/50",
      statusInfo.border,
      isAdmin && "hover:bg-slate-50 hover:shadow-xl cursor-pointer group/status active:scale-[0.98]"
    )}>
      <div className="flex items-center gap-4">
          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-100 transition-transform group-hover/status:rotate-[10deg]", statusInfo.color)}>
            <StatusIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className={cn("text-[11px] font-black uppercase tracking-[0.12em] italic leading-none", statusInfo.color)}>
              {statusInfo.label}
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Estatus Oficial</span>
          </div>
      </div>
      {isAdmin ? (
        <ChevronDown className="w-4 h-4 text-slate-300 group-hover/status:text-primary transition-colors" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center shadow-inner">
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );

  return (
    <Card className="group flex flex-col h-full border-none rounded-[48px] shadow-[0_15px_50px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.12)] transition-all duration-700 bg-white overflow-hidden">
      <div className="block relative aspect-[16/11] w-full overflow-hidden bg-slate-50">
        <Link href={`/stores/${store.id}`}>
          <Image
            src={store.imageUrl || 'https://picsum.photos/seed/store/800/600'}
            alt={store.name}
            fill
            className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
            data-ai-hint="store image"
          />
        </Link>
        
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-xl">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-[11px] font-black text-slate-900">4.9</span>
          </div>
        </div>

        <div className="absolute top-6 right-6 z-20">
          <Button 
            onClick={handleToggleFavorite}
            variant="ghost" 
            size="icon" 
            className={cn(
              "rounded-full h-12 w-12 backdrop-blur-xl border border-white/20 shadow-2xl transition-all active:scale-75",
              isFavorite ? "bg-rose-500 text-white border-none" : "bg-white/20 text-white hover:bg-white/40"
            )}
          >
            <Heart className={cn("w-6 h-6 transition-transform", isFavorite && "fill-current scale-110")} />
          </Button>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/30 to-transparent z-10 pointer-events-none" />

        <div className="absolute bottom-8 left-8 right-8 z-20 text-white space-y-4 pointer-events-none">
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
      </div>

      <CardContent className="p-8 flex flex-col flex-1 space-y-6 bg-white">
        {store.description && (
          <div className="relative group/desc">
            <div className="absolute -left-4 top-0 w-1 h-full bg-primary/10 rounded-full group-hover/desc:bg-primary/30 transition-colors" />
            <p className="text-[13px] text-slate-500 leading-[1.5] font-medium italic pl-3 pr-2 break-words">
              "{store.description}"
            </p>
          </div>
        )}

        {/* CORE: Grid de 2 Cuadrantes Compactos y Vibrantes */}
        <div className="grid grid-cols-2 gap-3 relative">
          {QUADRANTS.map((quad) => {
            const activeBadge = activeBadgeIds
              .map(id => ({ id, ...VALUE_BADGES_CONFIG[id] }))
              .find(b => b.category === quad.id);

            return (
              <div 
                key={quad.id} 
                className={cn(
                  "relative p-4 rounded-[24px] border flex flex-col items-center justify-center text-center gap-2 transition-all duration-500 min-h-[85px] overflow-hidden",
                  quad.color,
                  quad.border,
                  !activeBadge && "opacity-40 grayscale-[0.5]"
                )}
              >
                {/* Efecto de luz de fondo */}
                <div className={cn("absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl opacity-20", quad.accent)} />
                
                <div className={cn("relative z-10 w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center", quad.textColor)}>
                  {activeBadge ? <activeBadge.icon className="w-4 h-4" /> : <quad.icon className="w-4 h-4 opacity-30" />}
                </div>
                <div className="relative z-10 flex flex-col gap-0.5">
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40">{quad.label}</span>
                  <span className={cn("text-[9px] font-black uppercase tracking-widest italic leading-none", quad.textColor)}>
                    {activeBadge ? activeBadge.label : 'PENDIENTE'}
                  </span>
                </div>
                
                {isAdmin && (
                  <div className="absolute top-0 right-0 p-1 z-20">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" className="h-5 w-5 rounded-full bg-white/50 text-slate-400 hover:text-primary shadow-sm border-none">
                          <Plus className="w-2.5 h-2.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="w-56 rounded-[24px] p-2 shadow-2xl border-none bg-white z-[100]">
                        {(Object.keys(VALUE_BADGES_CONFIG) as BadgeKey[])
                          .filter(key => VALUE_BADGES_CONFIG[key].category === quad.id)
                          .map((key) => (
                            <DropdownMenuItem 
                              key={key} 
                              onClick={() => handleAddBadge(key)}
                              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50"
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                {(() => {
                                  const Icon = VALUE_BADGES_CONFIG[key].icon;
                                  return <Icon className="w-4 h-4 text-slate-600" />;
                                })()}
                              </div>
                              <span className="text-[11px] font-bold uppercase tracking-tight">{VALUE_BADGES_CONFIG[key].label}</span>
                            </DropdownMenuItem>
                          ))}
                        {activeBadge && (
                          <DropdownMenuItem 
                            onClick={() => handleRemoveBadge(activeBadge.id as BadgeKey)}
                            className="text-red-500 p-3 rounded-xl cursor-pointer hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> <span className="text-[11px] font-bold">REMOVER</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CORE: Barra de Estatus Final Compacta */}
        <div className="mt-2 pt-2">
          {isAdmin ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                {StatusContent}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-80 rounded-[40px] p-4 shadow-2xl border-none bg-white z-[100] mt-4">
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
