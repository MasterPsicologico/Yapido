
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
  Medal
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

type StatusKey = keyof typeof STATUS_MAP;

export function StoreCard({ store }: { store: any }) {
  const firestore = useFirestore();
  const { isAdmin } = useProfile();
  
  const currentStatusKey = (store.verificationStatus as StatusKey) || 'verified';
  const statusInfo = STATUS_MAP[currentStatusKey] || STATUS_MAP.verified;
  const StatusIcon = statusInfo.icon;

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !store.id) return null;
    return query(
      collection(firestore, 'products'),
      where('storeId', '==', store.id),
      limit(1)
    );
  }, [firestore, store.id]);

  const { data: products } = useCollection(productsQuery);
  const hasProducts = products && products.length > 0;

  const handleStatusChange = (newStatus: StatusKey) => {
    if (!firestore || !store.id) return;
    const storeRef = doc(firestore, 'stores', store.id);
    updateDocumentNonBlocking(storeRef, { verificationStatus: newStatus });
  };

  const StatusContent = (
    <div className={cn(
      "flex items-center justify-between w-full py-3.5 px-4 rounded-2xl border transition-all duration-500 shadow-sm",
      statusInfo.bg,
      statusInfo.border,
      isAdmin && "hover:bg-white hover:shadow-lg cursor-pointer group/status active:scale-95"
    )}>
      <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-md border border-white/50", statusInfo.color)}>
            <StatusIcon className="w-4.5 h-4.5" />
          </div>
          <span className={cn("text-[11px] font-black uppercase tracking-[0.15em] italic", statusInfo.color)}>
            {statusInfo.label}
          </span>
      </div>
      {isAdmin ? (
        <ChevronDown className="w-4 h-4 text-slate-300 group-hover/status:text-primary transition-colors animate-bounce" />
      ) : (
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
      )}
    </div>
  );

  return (
    <Card className="group flex flex-col h-full border-none rounded-[32px] shadow-sm hover:shadow-2xl transition-all duration-500 bg-white overflow-hidden border-b sm:border">
      <Link href={`/stores/${store.id}`} className="block relative aspect-[5/4] w-full overflow-hidden bg-slate-100">
        <Image
          src={store.imageUrl || 'https://picsum.photos/seed/store/800/600'}
          alt={store.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-in-out"
          data-ai-hint="store image"
        />
        
        {/* Badges de Capa Superior */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {hasProducts && (
            <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none text-[9px] h-6 px-3 rounded-full uppercase font-black tracking-widest shadow-xl">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Stock Vivo
            </Badge>
          )}
          {store.isPro && (
            <Badge className="bg-secondary text-white border-none text-[9px] h-6 px-3 rounded-full uppercase font-black tracking-widest shadow-xl">
              <Award className="w-3 h-3 mr-1" /> Premium
            </Badge>
          )}
        </div>

        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-lg">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span className="text-[10px] font-black text-slate-900">4.9</span>
          <span className="text-[8px] text-slate-400 font-bold ml-1">(120+)</span>
        </div>
      </Link>

      <CardContent className="p-5 sm:p-7 flex flex-col flex-1 space-y-5">
        <Link href={`/stores/${store.id}`} className="space-y-1.5 block">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-primary transition-colors leading-[1] tracking-tighter italic">
            {store.name}
          </h3>
          
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary/60 shrink-0" />
              <span className="text-[11px] font-bold text-slate-500 line-clamp-1">{store.address || 'Aguachica, Cesar'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-tighter">15-30 min</span>
            </div>
          </div>
        </Link>

        {/* Tags de Valor Adicional */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10 transition-all group-hover:bg-primary/10">
             <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.05em]">Envío Express</span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/5 px-3 py-1.5 rounded-xl border border-secondary/10">
             <Medal className="w-3.5 h-3.5 text-secondary" />
             <span className="text-[10px] font-black text-secondary uppercase tracking-[0.05em]">Top Choice</span>
          </div>
        </div>

        <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed font-medium italic pr-2">
          {store.description || 'Explora una selección única de productos locales con la garantía de nuestra vitrina digital.'}
        </p>

        <div className="mt-auto pt-3">
          {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {StatusContent}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-[24px] p-2 shadow-2xl border-slate-100 bg-white/95 backdrop-blur-md">
                {(Object.keys(STATUS_MAP) as StatusKey[]).map((key) => {
                  const item = STATUS_MAP[key];
                  const ItemIcon = item.icon;
                  return (
                    <DropdownMenuItem 
                      key={key} 
                      onClick={() => handleStatusChange(key)}
                      className={cn(
                        "flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer transition-all mb-1",
                        currentStatusKey === key ? "bg-slate-50 font-black ring-1 ring-slate-100" : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-100", item.color)}>
                        <ItemIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-700">{item.label}</span>
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
