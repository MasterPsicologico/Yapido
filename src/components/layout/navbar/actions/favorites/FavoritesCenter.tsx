
"use client";

import { useState } from 'react';
import { Heart, Store as StoreIcon, Package } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, documentId } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { FavoritesTrigger } from './FavoritesTrigger';
import { FavoritesItem } from './FavoritesItem';

import { toast } from '@/hooks/use-toast';
export function FavoritesCenter() {
  const [open, setOpen] = useState(false);
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

  const handleFavoriteClick = (type: 'store' | 'product', id: string, name: string) => {
    setOpen(false);
    toast({
      title: "Próximamente",
      description: `La vista detallada de ${name} estará disponible pronto.`,
      className: "bg-slate-900 text-white"
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FavoritesTrigger totalCount={totalCount} />
      </PopoverTrigger>
      <PopoverContent className="w-[340px] sm:w-[380px] p-0 rounded-[32px] shadow-2xl border border-slate-100/50 bg-white/95 backdrop-blur-xl mt-2 z-[1000] overflow-hidden" align="center">
        <div className="px-5 py-4 bg-gradient-to-br from-slate-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-tighter text-slate-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              Colección Favorita
            </span>
            <Badge className="bg-rose-100 text-rose-600 rounded-full px-2 py-0.5 text-[10px] font-black border-none shadow-sm">{totalCount} ítems</Badge>
          </div>
        </div>
        <div className="h-px bg-slate-100" />
        <div className="max-h-[450px] overflow-y-auto p-3 space-y-5 no-scrollbar">
          {totalCount === 0 ? (
            <div className="py-16 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <Heart className="w-10 h-10 text-rose-200" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Aún no hay favoritos</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Guarda lo que más te guste</p>
            </div>
          ) : (
            <div className="space-y-8">
              {stores && stores.length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-100">
                  <div className="px-1 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center shadow-inner ring-1 ring-orange-100/50">
                      <StoreIcon className="w-3.5 h-3.5 text-orange-600" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">Tiendas Favoritas</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 px-1">
                    {stores.map(s => (
                      <FavoritesItem 
                        key={s.id} 
                        id={s.id} 
                        name={s.name} 
                        subLabel={s.address || 'Local'} 
                        imageUrl={s.imageUrl || 'https://picsum.photos/seed/store/200'} 
                        onClick={() => handleFavoriteClick('store', s.id, s.name)} 
                      />
                    ))}
                  </div>
                </div>
              )}
              {products && products.length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-200">
                  <div className="px-1 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shadow-inner ring-1 ring-blue-100/50">
                      <Package className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">Productos Favoritos</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 px-1">
                    {products.map(p => (
                      <FavoritesItem 
                        key={p.id} 
                        id={p.id} 
                        name={p.name} 
                        subLabel="" 
                        price={p.price} 
                        imageUrl={p.imageUrl || 'https://picsum.photos/seed/product/200'} 
                        onClick={() => handleFavoriteClick('product', p.id, p.name)} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="h-px bg-slate-100" />
        <div className="p-3 bg-slate-50/50">
          <Link href="/profile" className="flex items-center justify-center w-full h-12 rounded-xl bg-white hover:bg-rose-50 border border-slate-100 hover:border-rose-100 hover:shadow-md text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-rose-600 transition-all duration-300">
            Gestionar Colección
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
