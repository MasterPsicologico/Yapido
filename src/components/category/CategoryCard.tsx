
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Store as StoreIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export interface MainCategory {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export function CategoryCard({ category }: { category: MainCategory }) {
  const firestore = useFirestore();
  
  // Obtenemos conteo de tiendas
  const storesQuery = useMemoFirebase(() => {
    if (!firestore || !category.id) return null;
    return query(collection(firestore, 'stores'), where('mainCategoryId', '==', category.id));
  }, [firestore, category.id]);

  const { data: stores } = useCollection(storesQuery);

  return (
    <Link href={`/categories/${category.id}`}>
      <Card className="group relative h-40 sm:h-72 w-full overflow-hidden rounded-none border-none shadow-md transition-all duration-500 hover:shadow-xl">
        {/* Imagen de Fondo */}
        <div className="absolute inset-0 z-0">
          <Image 
            src={category.imageUrl} 
            alt={category.name} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        </div>

        {/* Contenido */}
        <CardContent className="absolute inset-0 z-10 flex flex-col justify-end p-3 sm:p-6 text-white">
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-1 w-4 sm:w-6 bg-secondary rounded-full" />
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Global</span>
                </div>
                {stores && stores.length > 0 && (
                    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                        <StoreIcon className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                        <span className="text-[8px] sm:text-[9px] font-black">{stores.length}</span>
                    </div>
                )}
            </div>
            
            <h3 className="text-xl sm:text-4xl font-black leading-none tracking-tighter uppercase italic">
              {category.name}
            </h3>
            
            <p className="hidden sm:block text-white/70 text-xs font-medium line-clamp-2 pr-4">
              {category.description}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <div className="h-6 w-6 sm:h-10 sm:w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-primary transition-colors">
                <ArrowRight className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">Ver Vitrinas</span>
            </div>
          </div>
        </CardContent>

        {/* Efecto decorativo */}
        <div className="absolute top-3 right-3 opacity-10">
          <Sparkles className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
        </div>
      </Card>
    </Link>
  );
}
