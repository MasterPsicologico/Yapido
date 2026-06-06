
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Heart } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

export function ProductCard({ product }: { product: any }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useProfile();
  const { addToCart } = useCart();
  
  const isFavorite = profile?.favoriteProducts?.includes(product.id);

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(product.price);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !firestore) {
      toast({ title: "Inicia sesión", description: "Para guardar favoritos.", variant: "destructive" });
      return;
    }

    const userRef = doc(firestore, 'users', user.uid);
    if (isFavorite) {
      updateDocumentNonBlocking(userRef, { favoriteProducts: arrayRemove(product.id) });
      toast({ title: "Producto removido" });
    } else {
      updateDocumentNonBlocking(userRef, { favoriteProducts: arrayUnion(product.id) });
      toast({ title: "Producto en favoritos", className: "bg-rose-500 text-white border-none" });
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl || 'https://picsum.photos/seed/product/400',
      storeId: product.storeId,
      storeName: product.storeName || 'Negocio Local'
    });
  };

  return (
    <Card className="group relative h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-500 border-none shadow-md bg-white rounded-[24px]">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link href={`/products/${product.id}`} className="block h-full w-full">
          <Image
            src={product.imageUrl || 'https://picsum.photos/seed/product/400'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            data-ai-hint="product image"
          />
        </Link>
        
        {/* Botón Favorito */}
        <Button 
          onClick={handleToggleFavorite}
          variant="ghost" 
          size="icon" 
          className={cn(
            "absolute top-3 right-3 z-20 rounded-full h-9 w-9 backdrop-blur-md border border-white/20 shadow-xl transition-all active:scale-75",
            isFavorite ? "bg-rose-500 text-white border-none" : "bg-white/40 text-slate-700 hover:bg-white/60"
          )}
        >
          <Heart className={cn("w-5 h-5 transition-transform", isFavorite && "fill-current scale-110")} />
        </Button>
      </div>

      <CardContent className="p-4 flex-1">
        <p className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] mb-1.5 opacity-70">
          {product.categoryName || 'Producto'}
        </p>
        <h4 className="font-black text-sm mb-1.5 line-clamp-1 group-hover:text-primary transition-colors italic uppercase tracking-tighter">
          {product.name}
        </h4>
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-lg font-black text-slate-900 tracking-tighter">{formattedPrice}</span>
        <Button 
          onClick={handleAddToCart}
          size="icon" 
          variant="ghost" 
          className="rounded-full bg-slate-50 text-slate-900 hover:bg-primary hover:text-white transition-all h-10 w-10 shadow-sm"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
