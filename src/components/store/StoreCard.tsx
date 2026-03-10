
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Store as StoreIcon, MapPin, ChevronRight, Package, Zap, Award } from 'lucide-react';
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
        {/* Imagen: Más compacta para grid de 2 columnas */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={store.imageUrl}
            alt={store.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            data-ai-hint="store image"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasProducts && (
              <Badge className="bg-secondary text-white border-none text-[8px] sm:text-[10px] h-5 px-2 rounded-sm uppercase font-black">
                En Stock
              </Badge>
            )}
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <CardContent className="p-3 sm:p-4 flex flex-col flex-1 space-y-2">
          <div className="flex flex-col">
            <h3 className="text-sm sm:text-lg font-black text-slate-900 line-clamp-1 group-hover:text-primary transition-colors leading-tight">
              {store.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 line-clamp-1">{store.address || 'Aguachica'}</span>
            </div>
          </div>

          {/* Información Sorpresa/Enriquecida */}
          <div className="flex flex-wrap gap-1.5 py-1">
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
               <Zap className="w-2.5 h-2.5 text-secondary" />
               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Express</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
               <Award className="w-2.5 h-2.5 text-primary" />
               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Pro</span>
            </div>
          </div>

          <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-2 leading-snug font-medium">
            {store.description || 'Visita nuestra vitrina para ver todos los productos disponibles.'}
          </p>

          <div className="mt-auto pt-2 border-t flex items-center justify-between">
            <div className="flex items-center gap-1">
                <Package className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-black text-primary uppercase">Vitrina Verificada</span>
            </div>
            <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
