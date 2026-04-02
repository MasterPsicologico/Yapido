
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
  Trash2, 
  Plus,
  Package,
  Target,
  Settings,
  Moon,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, updateDocumentNonBlocking, useUser } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { checkIsBusinessOpen } from '@/components/home/HomeActions';

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
  const isOwner = user?.uid === store.ownerId;
  const isWasherRental = store.mainCategoryId === 'category-washer' || store.type === 'washer_rental' || store.name?.toLowerCase().includes('lavadora');

  const hasHours = !!(store.openTime && store.closeTime);
  const isOpen = checkIsBusinessOpen(store.openTime, store.closeTime);

  const currentStatusKey = (store.verificationStatus as StatusKey) || 'verified';
  const statusInfo = STATUS_MAP[currentStatusKey] || STATUS_MAP.verified;
  const StatusIcon = statusInfo.icon;

  const activeBadgeIds: BadgeKey[] = store.activeBadgeIds || [];
  
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    if (isFavorite) updateDocumentNonBlocking(userRef, { favoriteProducts: arrayRemove(store.id) });
    else updateDocumentNonBlocking(userRef, { favoriteProducts: arrayUnion(store.id) });
  };

  const handleAddBadge = (badgeKey: BadgeKey) => {
    if (!firestore) return;
    const newBadges = [...activeBadgeIds, badgeKey].slice(-4);
    updateDocumentNonBlocking(doc(firestore, 'stores', store.id), { activeBadgeIds: newBadges });
  };

  const handleClosedClick = (e: React.MouseEvent) => {
    if (!isOwner && !isAdmin) {
      if (!hasHours) {
        e.preventDefault();
        e.stopPropagation();
        toast({ 
          title: "Configuración Pendiente", 
          description: "Esta vitrina no tiene horario establecido y no recibe pedidos.",
          variant: "destructive"
        });
        return;
      }
      if (!isOpen) {
        e.preventDefault();
        e.stopPropagation();
        toast({ 
          title: "Negocio Cerrado", 
          description: `Esta vitrina abre a las ${store.openTime || '08:00'}.`,
          variant: "destructive"
        });
      }
    }
  };

  const QUADRANTS = [
    { id: 'product', label: 'ESTADO', color: 'bg-emerald-50/60', border: 'border-emerald-100', icon: Package, textColor: 'text-emerald-600', accent: 'bg-emerald-500' },
    { id: 'community', label: 'VALOR', color: 'bg-purple-50/60', border: 'border-purple-100', icon: Heart, textColor: 'text-purple-600', accent: 'bg-purple-500' },
  ];

  return (
    <Card className={cn(
      "group flex flex-col h-full border-none rounded-[48px] shadow-[0_15px_50px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.12)] transition-all duration-700 bg-white overflow-hidden relative",
      isWasherRental && "ring-4 ring-primary/5",
      (!isOpen || !hasHours) && !isOwner && !isAdmin && "grayscale opacity-80"
    )}>
      {isWasherRental && isOwner && (
        <Link 
          href={`/admin/washer/${store.id}`}
          className="absolute inset-0 z-[40] bg-primary/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center text-center p-8 cursor-pointer"
        >
          <div className="w-20 h-20 bg-primary text-white rounded-[32px] flex items-center justify-center shadow-2xl animate-in zoom-in duration-300">
            <Settings className="w-10 h-10 animate-spin-slow" />
          </div>
          <h4 className="text-primary font-black text-2xl uppercase italic tracking-tighter mt-6 leading-none">PANEL MAESTRO</h4>
          <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Control de Flota y Ganancias</p>
        </Link>
      )}

      <div className="block relative aspect-[16/11] w-full overflow-hidden bg-slate-50">
        <Link 
          href={(isWasherRental && !isOwner) ? "#" : `/stores/${store.id}`} 
          onClick={handleClosedClick}
        >
          <Image
            src={store.imageUrl || 'https://picsum.photos/seed/store/800/600'}
            alt={store.name}
            fill
            className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
          />
        </Link>
        
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
          {!hasHours ? (
            <div className="flex items-center gap-1.5 bg-red-600/90 text-white backdrop-blur-md px-3 py-1.5 rounded-full border border-red-400 shadow-xl">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">HORARIO REQUERIDO</span>
            </div>
          ) : (
            <div className={cn(
              "flex items-center gap-1.5 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-xl",
              isOpen ? "bg-green-500/90 text-white border-green-400" : "bg-slate-800/90 text-slate-300 border-slate-600"
            )}>
              {isOpen ? <Zap className="w-3.5 h-3.5 fill-white animate-pulse" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="text-[9px] font-black uppercase tracking-widest">{isOpen ? "VITRINA ACTIVA" : "CERRADO"}</span>
            </div>
          )}
        </div>

        <div className="absolute top-6 right-6 z-20">
          <Button onClick={handleToggleFavorite} variant="ghost" size="icon" className={cn("rounded-full h-12 w-12 backdrop-blur-xl border border-white/20 shadow-2xl transition-all active:scale-75", isFavorite ? "bg-rose-500 text-white border-none" : "bg-white/20 text-white hover:bg-white/40")}>
            <Heart className={cn("w-6 h-6 transition-transform", isFavorite && "fill-current scale-110")} />
          </Button>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/30 to-transparent z-10 pointer-events-none" />

        {/* Info Inferior sobre la imagen (Limpiada de título) */}
        <div className="absolute bottom-8 left-8 right-8 z-20 text-white flex items-center justify-between gap-4 pointer-events-none">
          <div className="flex items-center gap-2.5 opacity-90 max-w-[70%]">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-[12px] font-black uppercase tracking-[0.1em] truncate">{store.address || 'Aguachica'}</span>
          </div>
          {isWasherRental && (
            <div className="flex flex-col items-end gap-1">
              <Badge className={cn("border-none text-white font-black text-[10px] px-4 py-2 uppercase tracking-tighter shadow-lg", (isOpen && hasHours) ? "bg-secondary" : "bg-slate-600")}>
                {(isOpen && hasHours) ? "ALQUILER ACTIVO" : "FUERA DE HORARIO"}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Contenido de la Tarjeta - Título reubicado aquí para no estorbar la imagen */}
      <CardContent className="p-8 flex flex-col flex-1 space-y-6 bg-white">
        <div className="space-y-2">
          <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none group-hover:text-primary transition-colors">
            {store.name}
          </h3>
          {store.description && (
            <p className="text-[13px] text-slate-500 leading-[1.5] font-medium italic pl-3 border-l-4 border-primary/10">
              "{store.description}"
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 relative">
          {QUADRANTS.map((quad) => {
            const activeBadge = activeBadgeIds.map(id => ({ id, ...VALUE_BADGES_CONFIG[id] })).find(b => b.category === quad.id);
            return (
              <div key={quad.id} className={cn("relative p-4 rounded-[24px] border flex flex-col items-center justify-center text-center gap-2 min-h-[85px] overflow-hidden", quad.color, quad.border, !activeBadge && "opacity-40")}>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" className="absolute top-0 right-0 h-5 w-5 rounded-full bg-white/50 text-slate-400 border-none"><Plus className="w-2.5 h-2.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-56 rounded-[24px] p-2 shadow-2xl border-none bg-white z-[100]">
                      {(Object.keys(VALUE_BADGES_CONFIG) as BadgeKey[]).filter(k => VALUE_BADGES_CONFIG[k].category === quad.id).map(k => (
                        <DropdownMenuItem key={k} onClick={() => handleAddBadge(k)} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer">
                          <span className="text-[11px] font-bold uppercase">{VALUE_BADGES_CONFIG[k].label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-2 pt-2">
          <div className={cn("flex items-center justify-between w-full py-3.5 px-6 rounded-[28px] border bg-slate-50/50 shadow-sm", statusInfo.border)}>
            <div className="flex items-center gap-4">
              <div className={cn("w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm", statusInfo.color)}>
                <StatusIcon className="w-5 h-5" />
              </div>
              <span className={cn("text-[11px] font-black uppercase tracking-[0.12em] italic", statusInfo.color)}>{statusInfo.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
