
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
        <div className="bg-[#f3f4f6]/50 rounded-full p-1 border border-slate-100 shadow-inner overflow-x-auto no-scrollbar">
          <TabsList className="bg-transparent h-auto p-0 flex gap-1 justify-start">
            <TabsTrigger 
              value="all" 
              className="rounded-full px-5 py-2.5 data-[state=active]:bg-[#fef3c7] data-[state=active]:text-[#d97706] data-[state=active]:shadow-sm font-bold text-[13px] border-none transition-all flex items-center gap-2 shrink-0"
            >
              <StoreIcon className="w-3.5 h-3.5" /> Todos
            </TabsTrigger>
            {categories?.map(cat => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id} 
                className="rounded-full px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-[#1f2937] data-[state=active]:shadow-sm font-bold text-[13px] border-none transition-all shrink-0"
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-8">
           <ProductsGrid storeId={storeId} categoryId="all" />
        </TabsContent>

        {categories?.map(cat => (
          <TabsContent key={cat.id} value={cat.id} className="mt-8">
            <ProductsGrid storeId={storeId} categoryId={cat.id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ProductsGrid({ storeId, categoryId }: { storeId: string, categoryId: string }) {
  const firestore = useFirestore();
  const q = useMemoFirebase(() => {
    if (!firestore || !storeId) return null;
    
    // Consulta global a la colección de productos para evitar el error 404
    let baseQuery = query(
      collection(firestore, 'products'), 
      where('storeId', '==', storeId), 
      where('status', '==', 'available')
    );

    if (categoryId && categoryId !== 'all') {
      baseQuery = query(baseQuery, where('categoryId', '==', categoryId));
    }

    return baseQuery;
  }, [firestore, storeId, categoryId]);

  const { data: products, isLoading } = useCollection(q);

  if (isLoading) return <div className="grid grid-cols-2 gap-4"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;
  if (!products || products.length === 0) return <div className="text-center py-16 bg-slate-50 border-dashed border-2 rounded-[32px]"><Package className="w-10 h-10 mx-auto text-slate-200 mb-2" /><p className="text-slate-400 font-bold text-sm italic">Sin productos en esta sección</p></div>;

  return (
    <div className="grid grid-cols-2 gap-6">
      {products.map(p => <ProductCard key={p.id} product={p as any} />)}
    </div>
  );
}
