
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Store as StoreIcon, MapPin, ChevronRight, Package, Zap, Award, Star, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

export function StoreCard({ store }: { store: any }) {
  const firestore = useFirestore();
  
  // Obtenemos una vista previa de cuántos productos tiene la tienda
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

  return (
    <Link href={`/stores/${store.id}`}>
      <Card className="group flex flex-col h-full border-none rounded-none shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden border-b sm:border">
        {/* Imagen: Con gradiente inmersivo */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
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
          
          {/* Rating flotante sobre imagen */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
            <span className="text-[9px] font-black text-slate-900">4.8</span>
          </div>
        </div>

        <CardContent className="p-3 sm:p-5 flex flex-col flex-1 space-y-3">
          <div className="space-y-1">
            {/* Nombre Completo sin truncamiento */}
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
          </div>

          {/* Información Enriquecida: Badges Pro */}
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

          <div className="mt-auto pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Vitrina Verificada</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
