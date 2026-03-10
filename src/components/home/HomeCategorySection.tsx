
"use client";

import { LayoutGrid } from 'lucide-react';
import { CategoryCard } from '@/components/category/CategoryCard';
import { Skeleton } from '@/components/ui/skeleton';

interface HomeCategorySectionProps {
  categories: any[] | null;
  isLoading: boolean;
  onEdit: (cat: any) => void;
}

export function HomeCategorySection({ categories, isLoading, onEdit }: HomeCategorySectionProps) {
  return (
    <section className="px-4 sm:px-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1.5 h-6 bg-primary rounded-full" />
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Vitrinas por Categoría</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 sm:h-64 rounded-none" />)}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat as any} onEdit={onEdit} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-slate-100">
          <LayoutGrid className="w-12 h-12 mx-auto text-slate-200 mb-2" />
          <h3 className="text-lg font-bold text-slate-400 italic">No hay categorías globales.</h3>
        </div>
      )}
    </section>
  );
}
