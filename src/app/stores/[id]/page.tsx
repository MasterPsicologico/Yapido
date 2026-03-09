
import { Navbar } from '@/components/layout/Navbar';
import { STORES, PRODUCTS } from '@/lib/mock-data';
import { ProductCard } from '@/components/product/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Info, Star } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = STORES.find(s => s.id === id);
  if (!store) notFound();

  const storeProducts = PRODUCTS.filter(p => p.storeId === id);
  const categories = Array.from(new Set(storeProducts.map(p => p.category)));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-background">
        {/* Store Header */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <Image 
            src={store.imageUrl} 
            alt={store.name} 
            fill 
            className="object-cover" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 -mt-20 relative z-10 pb-20">
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-border/50">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <Badge className="bg-secondary text-white">{store.category}</Badge>
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl md:text-5xl font-black text-foreground">{store.name}</h1>
                  <div className="hidden sm:flex items-center gap-1 text-yellow-500 bg-yellow-50 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-sm">4.9</span>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl">{store.description}</p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Button className="rounded-full gap-2">
                    <Phone className="w-4 h-4" /> {store.contact}
                  </Button>
                  <Button variant="outline" className="rounded-full gap-2">
                    <Info className="w-4 h-4" /> Más información
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-muted/50 p-1 rounded-full mb-8 h-12 flex overflow-x-auto">
                  <TabsTrigger value="all" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-white">
                    Todos los productos
                  </TabsTrigger>
                  {categories.map(cat => (
                    <TabsTrigger key={cat} value={cat} className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-white">
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="mt-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {storeProducts.map(p => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </TabsContent>

                {categories.map(cat => (
                  <TabsContent key={cat} value={cat} className="mt-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {storeProducts.filter(p => p.category === cat).map(p => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
