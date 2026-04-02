
"use client";

import { Heart, Store as StoreIcon, Package } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, documentId } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { FavoritesTrigger } from './FavoritesTrigger';
import { FavoritesItem } from './FavoritesItem';

export function FavoritesCenter() {
  const { user } = useUser();
  const { profile } = useProfile();
  const firestore = useFirestore();

  const favoriteStoreIds = profile?.favoriteStores || [];
  const favoriteProductIds = profile?.favoriteProducts || [];

  const storesQuery = useMemoFirebase(() => {
    if (!firestore || favoriteStoreIds.length === 0) return null;
    return query(collection(firestore, 'stores'), where(documentId(), 'in', favoriteStoreIds.slice(0, 10)));
  }, [firestore, favoriteStoreIds]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || favoriteProductIds.length === 0) return null;
    return query(collection(firestore, 'products'), where(documentId(), 'in', favoriteProductIds.slice(0, 10)));
  }, [firestore, favoriteProductIds]);

  const { data: stores } = useCollection(storesQuery);
  const { data: products } = useCollection(productsQuery);

  const totalCount = favoriteStoreIds.length + favoriteProductIds.length;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <FavoritesTrigger totalCount={totalCount} />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent className="w-80 p-2 rounded-[28px] shadow-2xl border-none bg-white mt-2 z-[500]" align="center">
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
                <Heart className="w-16 h-16 bg-slate-50 rounded-full p-4 mx-auto mb-4 text-slate-200" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Aún no tienes favoritos</p>
              </div>
            ) : (
              <>
                {stores && stores.length > 0 && (
                  <div className="space-y-2">
                    <div className="px-3 flex items-center gap-2 text-slate-300">
                      <StoreIcon className="w-3 h-3" /><span className="text-[9px] font-black uppercase tracking-widest">Tiendas</span>
                    </div>
                    {stores.map(s => <FavoritesItem key={s.id} id={s.id} name={s.name} subLabel={s.address || 'Local'} imageUrl={s.imageUrl || 'https://picsum.photos/seed/store/200'} href={`/stores/${s.id}`} />)}
                  </div>
                )}
                {products && products.length > 0 && (
                  <div className="space-y-2">
                    <div className="px-3 flex items-center gap-2 text-slate-300">
                      <Package className="w-3 h-3" /><span className="text-[9px] font-black uppercase tracking-widest">Productos</span>
                    </div>
                    {products.map(p => <FavoritesItem key={p.id} id={p.id} name={p.name} subLabel="" price={p.price} imageUrl={p.imageUrl || 'https://picsum.photos/seed/product/200'} href={`/products/${p.id}`} />)}
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
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
