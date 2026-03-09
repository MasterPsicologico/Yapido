
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Heart, Share2, CheckCircle2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  const productRef = useMemoFirebase(() => doc(firestore, 'products', id), [firestore, id]);
  const { data: product, isLoading } = useDoc(productRef);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!product && !isLoading) notFound();

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(product?.price || 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link 
          href={product?.storeId ? `/stores/${product.storeId}` : "/"} 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la Tienda
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-border/50">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              <Image 
                src={product?.imageUrl || 'https://picsum.photos/seed/product/600/600'} 
                alt={product?.name || 'Producto'} 
                fill 
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6 space-y-2">
              <Badge variant="secondary" className="bg-secondary/10 text-secondary border-none uppercase tracking-widest text-[10px] font-bold">
                Disponible en Vitrina
              </Badge>
              <h1 className="text-3xl md:text-5xl font-black text-foreground">{product?.name}</h1>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary">{formattedPrice}</span>
                <span className="text-sm font-medium text-muted-foreground">
                  Vendido por: {product?.storeName || 'Tienda Local'}
                </span>
              </div>
            </div>

            <div className="prose prose-sm text-muted-foreground mb-8">
              <p className="text-lg leading-relaxed">{product?.description}</p>
            </div>

            <div className="mt-auto space-y-4 pt-8 border-t">
              <div className="flex gap-4">
                <Button size="lg" className="flex-1 h-14 rounded-full text-lg font-bold gap-3 shadow-lg shadow-primary/20">
                  <ShoppingCart className="w-5 h-5" />
                  Pedir por WhatsApp
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-full border-border hover:bg-red-50 hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
              <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Share2 className="w-4 h-4" /> Compartir con Amigos
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
