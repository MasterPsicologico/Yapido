
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Heart, Share2, Loader2, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function ProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const firestore = useFirestore();

  const productRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'products', id);
  }, [firestore, id]);

  const { data: product, isLoading } = useDoc(productRef);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">Cargando vitrina...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!product && !isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-300 italic">404</h2>
            <p className="text-muted-foreground">Este producto ya no está en vitrina.</p>
            <Link href="/">
              <Button className="rounded-full bg-primary font-bold">Volver al Inicio</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(product?.price || 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f6]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <Link 
          href={product?.storeId ? `/stores/${product.storeId}` : "/"} 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la Tienda
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-[40px] overflow-hidden shadow-xl shadow-slate-200/50 border border-white">
          {/* Visualización del Producto */}
          <div className="relative aspect-square lg:aspect-auto lg:h-full bg-slate-100">
            <Image 
              src={product?.imageUrl || 'https://picsum.photos/seed/product/800/800'} 
              alt={product?.name || 'Producto'} 
              fill 
              className="object-cover"
              priority
            />
          </div>

          {/* Detalles del Producto */}
          <div className="p-8 md:p-12 flex flex-col">
            <div className="mb-8 space-y-4">
              <Badge className="bg-secondary/10 text-secondary border-none uppercase tracking-[0.2em] text-[10px] font-black px-4 py-1 rounded-full">
                Vitriniando
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tighter">
                {product?.name}
              </h1>
              <div className="flex flex-col gap-1">
                <span className="text-4xl font-black text-primary tracking-tighter">{formattedPrice}</span>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Tienda: {product?.storeName || 'Negocio Local'}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">Descripción</h3>
              <p className="text-slate-500 text-lg leading-relaxed font-medium">
                {product?.description}
              </p>
            </div>

            <div className="mt-auto space-y-4 pt-8 border-t border-slate-100">
              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="w-full h-16 rounded-full text-lg font-black gap-3 bg-[#25d366] hover:bg-[#128c7e] text-white shadow-lg shadow-green-100 border-none transition-all hover:scale-[1.02]"
                >
                  <MessageCircle className="w-6 h-6" />
                  Pedir por WhatsApp
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-14 rounded-full border-slate-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all font-bold gap-2"
                >
                  <Heart className="w-5 h-5" />
                  Favorito
                </Button>
              </div>

              <Button variant="ghost" className="w-full gap-2 text-slate-400 font-bold hover:text-primary hover:bg-transparent transition-colors">
                <Share2 className="w-4 h-4" /> Compartir este tesoro
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
