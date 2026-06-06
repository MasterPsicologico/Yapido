
"use client";

import { useMemo } from 'react';
import { Heart, Store as StoreIcon, Package, ChevronRight, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, documentId } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function FavoritesCenter() {
  const { user } = useUser();
  const { profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();

  const favoriteStoreIds = profile?.favoriteStores || [];
  const favoriteProductIds = profile?.favoriteProducts || [];

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const superAdmins = ['9qjHXRHfKfS2LrlE6074rR9JOm83', 'OUeZfonX8AY4YHRI4qLCc1WiVFN2', 'YohYZ5BLFiUIL9Z4IWrTVlDjwt43', 'ZfSO1go6agR2owAsDh07GH440QN2'];
    return superAdmins.includes(user.uid) || profile?.role === 'admin';
  }, [user, profile]);

  const storesQuery = useMemoFirebase(() => {
    if (!firestore || favoriteStoreIds.length === 0) return null;
    return query(collection(firestore, 'stores'), where(documentId(), 'in', favoriteStoreIds.slice(0, 10)));
  }, [firestore, favoriteStoreIds]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || favoriteProductIds.length === 0) return null;
    return query(collection(firestore, 'products'), where(documentId(), 'in', favoriteProductIds.slice(0, 10)));
  }, [firestore, favoriteProductIds]);

  const { data: rawStores } = useCollection(storesQuery);
  const { data: products } = useCollection(productsQuery);

  const stores = useMemo(() => {
    if (!rawStores) return [];
    return rawStores.filter((s: any) => {
      const isOwner = user?.uid === s.ownerId;
      const trashedAt = s.trashedAt?.toDate?.() || (s.trashedAt?.seconds ? new Date(s.trashedAt.seconds * 1000) : null);
      const isWithin24h = trashedAt ? (Date.now() - trashedAt.getTime()) < (24 * 60 * 60 * 1000) : true;

      if (s.status === 'active') return true;
      if (s.status === 'trashed' && (isAdmin || isOwner) && isWithin24h) return true;
      return false;
    });
  }, [rawStores, user?.uid, isAdmin]);

  const totalCount = favoriteStoreIds.length + favoriteProductIds.length;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 transition-colors h-8 w-8 sm:h-9 sm:w-9">
          <Heart className={cn("w-4 h-4 sm:w-4.5 sm:h-4.5 transition-all", totalCount > 0 ? "text-rose-500 fill-rose-500" : "text-slate-400")} />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[7px] sm:text-[8px] font-black w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in">
              {totalCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-2 rounded-[28px] shadow-2xl border-none bg-white mt-2" align="center">
        <DropdownMenuLabel className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black italic uppercase tracking-tighter text-slate-900">Mis Favoritos</span>
            <Badge className="bg-rose-50 text-rose-600 rounded-full text-[10px] font-black border-none">{totalCount}</Badge>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-slate-50" />
        
        <div className="max-h-[400px] overflow-y-auto p-1 space-y-4 no-scrollbar">
          {totalCount === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Aún no tienes favoritos</p>
            </div>
          ) : (
            <>
              {stores && stores.length > 0 && (
                <div className="space-y-2">
                  <div className="px-3 flex items-center gap-2">
                    <StoreIcon className="w-3 h-3 text-slate-300" />
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tiendas</span>
                  </div>
                  {stores.map((store) => (
                    <DropdownMenuItem key={store.id} asChild className="rounded-2xl p-2 cursor-pointer focus:bg-slate-50 border border-transparent transition-all">
                      <Link href={`/stores/${store.id}`} className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0">
                          <Image src={store.imageUrl || 'https://picsum.photos/seed/store/200'} alt={store.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black text-slate-900 leading-tight truncate uppercase italic">{store.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">{store.address || 'Local'}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-200" />
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}

              {products && products.length > 0 && (
                <div className="space-y-2">
                  <div className="px-3 flex items-center gap-2">
                    <Package className="w-3 h-3 text-slate-300" />
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Productos</span>
                  </div>
                  {products.map((prod) => (
                    <DropdownMenuItem key={prod.id} asChild className="rounded-2xl p-2 cursor-pointer focus:bg-slate-50 border border-transparent transition-all">
                      <Link href={`/products/${prod.id}`} className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0">
                          <Image src={prod.imageUrl || 'https://picsum.photos/seed/product/200'} alt={prod.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black text-slate-900 leading-tight truncate uppercase italic">{prod.name}</p>
                          <p className="text-[9px] font-bold text-primary uppercase tracking-tight truncate">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(prod.price)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-200" />
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        <DropdownMenuSeparator className="bg-slate-50" />
        <DropdownMenuItem asChild className="rounded-xl justify-center h-10 focus:bg-rose-50">
          <Link href="/profile" className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Gestionar todo el historial</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
