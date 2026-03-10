
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { 
  Store as StoreIcon, 
  MapPin, 
  ChevronRight, 
  Package, 
  Zap, 
  Award, 
  Star, 
  Clock,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ChevronDown
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
};

type StatusKey = keyof typeof STATUS_MAP;

export function StoreCard({ store }: { store: any }) {
  const firestore = useFirestore();
  const { isAdmin } = useProfile();
  
  const currentStatusKey = (store.verificationStatus as StatusKey) || 'verified';
  const statusInfo = STATUS_MAP[currentStatusKey];
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
      "flex items-center justify-between w-full py-3 px-4 rounded-xl border transition-all duration-300",
      statusInfo.bg,
      statusInfo.border,
      isAdmin && "hover:bg-white hover:shadow-md cursor-pointer group/status"
    )}>
      <div className="flex items-center gap-2.5">
          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center bg-white shadow-sm", statusInfo.color)}>
            <StatusIcon className="w-4 h-4" />
          </div>
          <span className={cn("text-[11px] font-black uppercase tracking-widest", statusInfo.color)}>
            {statusInfo.label}
          </span>
      </div>
      {isAdmin ? (
        <ChevronDown className="w-4 h-4 text-slate-300 group-hover/status:text-primary transition-colors" />
      ) : (
        <ChevronRight className="w-4 h-4 text-slate-300" />
      )}
    </div>
  );

  return (
    <Card className="group flex flex-col h-full border-none rounded-none shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden border-b sm:border">
      <Link href={`/stores/${store.id}`} className="block relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <Image
          src={store.imageUrl}
          alt={store.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          data-ai-hint="store image"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasProducts && (
            <Badge className="bg-secondary text-white border-none text-[8px] sm:text-[9px] h-5 px-2 rounded-sm uppercase font-black tracking-tighter">
              Stock Disponible
            </Badge>
          )}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
          <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
          <span className="text-[9px] font-black text-slate-900">4.8</span>
        </div>
      </Link>

      <CardContent className="p-3 sm:p-5 flex flex-col flex-1 space-y-4">
        <Link href={`/stores/${store.id}`} className="space-y-1 block">
          <h3 className="text-base sm:text-xl font-black text-slate-900 group-hover:text-primary transition-colors leading-[1.1] tracking-tight">
            {store.name}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-[10px] font-bold text-slate-400 line-clamp-1">{store.address || 'Aguachica, Cesar'}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-2.5 h-2.5" />
              <span className="text-[9px] font-bold">15-25 min</span>
            </div>
          </div>
        </Link>

        <div className="flex flex-wrap gap-1.5">
          <div className="flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-md border border-primary/10 transition-colors group-hover:bg-primary/10">
             <Zap className="w-3 h-3 text-primary animate-pulse" />
             <span className="text-[9px] font-black text-primary uppercase tracking-tighter">Envío Express</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
             <Award className="w-3 h-3 text-secondary" />
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Negocio Pro</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium italic">
          {store.description || 'Descubre lo mejor de nuestra vitrina local con productos seleccionados.'}
        </p>

        <div className="mt-auto pt-2">
          {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {StatusContent}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-100">
                {(Object.keys(STATUS_MAP) as StatusKey[]).map((key) => {
                  const item = STATUS_MAP[key];
                  const ItemIcon = item.icon;
                  return (
                    <DropdownMenuItem 
                      key={key} 
                      onClick={() => handleStatusChange(key)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                        currentStatusKey === key ? "bg-slate-50 font-bold" : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-100", item.color)}>
                        <ItemIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs">{item.label}</span>
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
