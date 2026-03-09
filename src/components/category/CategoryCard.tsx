
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface MainCategory {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export function CategoryCard({ category }: { category: MainCategory }) {
  return (
    <Link href={`/categories/${category.id}`}>
      <Card className="group relative h-80 w-full overflow-hidden rounded-[45px] border-none shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2">
        {/* Imagen de Fondo */}
        <div className="absolute inset-0 z-0">
          <Image 
            src={category.imageUrl} 
            alt={category.name} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        </div>

        {/* Contenido */}
        <CardContent className="absolute inset-0 z-10 flex flex-col justify-end p-8 text-white">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-8 bg-secondary rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Categoría Global</span>
            </div>
            
            <h3 className="text-4xl font-black leading-none tracking-tighter uppercase">
              {category.name}
            </h3>
            
            <p className="text-white/70 text-sm font-medium line-clamp-2 pr-10">
              {category.description}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-primary transition-colors">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Ver Tiendas</span>
            </div>
          </div>
        </CardContent>

        {/* Efecto decorativo */}
        <div className="absolute top-6 right-6 opacity-20">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
      </Card>
    </Link>
  );
}
