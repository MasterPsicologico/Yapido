
"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store as StoreIcon, Package } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface StoreProductsSectionProps {
  storeId: string;
  categories: any[] | null;
}

export function StoreProductsSection({ storeId, categories }: StoreProductsSectionProps) {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="pt-4 overflow-hidden">
      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <div className="bg-[#f3f4f6]/50 rounded-full p-1 border border-slate-100 shadow-inner">
          <TabsList className="bg-transparent h-auto p-0 flex gap-1 justify-between overflow-x-auto no-scrollbar">
            <TabsTrigger 
              value="all" 
              className="rounded-full px-5 py-2.5 data-[state=active]:bg-[#fef3c7] data-[state=active]:text-[#d97706] data-[state=active]:shadow-sm font-bold text-[13px] border-none transition-all flex items-center gap-2"
            >
              <StoreIcon className="w-3.5 h-3.5" /> Todos
            </TabsTrigger>
            {categories?.map(cat => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id} 
                className="rounded-full px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-[#1f2937] data-[state=active]:shadow-sm font-bold text-[13px] border-none transition-all"
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {categories?.map(cat => (
          <TabsContent key={cat.id} value={cat.id} className="mt-8">
            <ProductsGrid storeId={storeId} categoryId={cat.id} />
          </TabsContent>
        ))}
        <TabsContent value="all" className="mt-8 text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200">
          <Package className="w-10 h-10 mx-auto text-slate-200 mb-2" />
          <p className="text-slate-400 font-bold italic text-sm">Selecciona una sección arriba</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductsGrid({ storeId, categoryId }: { storeId: string, categoryId: string }) {
  const firestore = useFirestore();
  const q = useMemoFirebase(() => {
    if (!firestore || !storeId || !categoryId) return null;
    return query(collection(firestore, 'stores', storeId, 'categories', categoryId, 'products'), where('status', '==', 'available'));
  }, [firestore, storeId, categoryId]);

  const { data: products, isLoading } = useCollection(q);

  if (isLoading) return <div className="grid grid-cols-2 gap-4"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;
  if (!products || products.length === 0) return <div className="text-center py-16 bg-slate-50 border-dashed border-2"><Package className="w-10 h-10 mx-auto text-slate-200 mb-2" /><p className="text-slate-400 font-bold text-sm italic">Sin productos</p></div>;

  return (
    <div className="grid grid-cols-2 gap-6">
      {products.map(p => <ProductCard key={p.id} product={p as any} />)}
    </div>
  );
}
