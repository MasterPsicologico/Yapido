
import { Navbar } from '@/components/layout/Navbar';
import { PRODUCTS, STORES } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Heart, Share2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) notFound();

  const store = STORES.find(s => s.id === product.storeId);
  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(product.price);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link 
          href={store ? `/stores/${store.id}` : "/"} 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a {store?.name || 'la tienda'}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-border/50">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              <Image 
                src={product.imageUrl} 
                alt={product.name} 
                fill 
                className="object-cover"
                priority
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted/50 cursor-pointer hover:opacity-75 transition-opacity border border-transparent hover:border-primary">
                  <Image src={`https://picsum.photos/seed/${product.id}-${i}/200/200`} alt="gallery item" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6 space-y-2">
              <Badge variant="secondary" className="bg-secondary/10 text-secondary border-none uppercase tracking-widest text-[10px] font-bold">
                {product.category}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-black text-foreground">{product.name}</h1>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary">{formattedPrice}</span>
                {store && (
                  <Link href={`/stores/${store.id}`} className="text-sm font-medium text-muted-foreground hover:text-secondary underline underline-offset-4">
                    Vendido por: {store.name}
                  </Link>
                )}
              </div>
            </div>

            <div className="prose prose-sm text-muted-foreground mb-8">
              <p className="text-lg leading-relaxed">{product.description}</p>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="font-bold text-foreground">Características principales:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-4 pt-8 border-t">
              <div className="flex gap-4">
                <Button size="lg" className="flex-1 h-14 rounded-full text-lg font-bold gap-3">
                  <ShoppingCart className="w-5 h-5" />
                  Agregar al Carrito
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-full border-border hover:bg-red-50 hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
              <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Share2 className="w-4 h-4" /> Compartir este producto
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
