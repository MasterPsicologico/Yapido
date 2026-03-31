"use client";

import { LayoutGrid } from 'lucide-react';
import { CategoryCard } from '@/components/category/CategoryCard';
import { Skeleton } from '@/components/ui/skeleton';

interface HomeCategorySectionProps {
  isAdmin: boolean;
  categories: any[] | null;
  isLoading: boolean;
  onEdit: (cat: any) => void;
}

export function HomeCategorySection({ isAdmin, categories, isLoading, onEdit }: HomeCategorySectionProps) {
  return (
    <section className="px-4 sm:px-8 mt-4 sm:mt-6">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight italic uppercase italic leading-none">Vitrinas por Categoría</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Exploración Local Sincronizada</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 sm:h-64 rounded-none" />)}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {categories.map((cat) => (
            <CategoryCard 
              key={cat.id} 
              category={cat as any} 
              onEdit={isAdmin ? onEdit : undefined} // Solo pasa onEdit si es admin
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-[40px]">
          <LayoutGrid className="w-16 h-16 mx-auto text-slate-100 mb-4" />
          <h3 className="text-lg font-black text-slate-300 italic uppercase">Sincronizando categorías...</h3>
        </div>
      )}
    </section>
  );
}