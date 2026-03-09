
import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ProductCard({ product }: { product: any }) {
  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(product.price);

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-none shadow-md">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            data-ai-hint="product image"
          />
        </div>
        <CardContent className="p-4 flex-1">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">
            {product.category || 'Producto'}
          </p>
          <h4 className="font-bold text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <span className="text-base font-black text-primary">{formattedPrice}</span>
          <Button size="icon" variant="ghost" className="rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all h-8 w-8">
            <Plus className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
