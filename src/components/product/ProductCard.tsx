
import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/mock-data';

export function ProductCard({ product }: { product: Product }) {
  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(product.price);

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            data-ai-hint="product image"
          />
        </div>
        <CardContent className="p-4 flex-1">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
            {product.category}
          </p>
          <h4 className="font-bold text-lg mb-1 line-clamp-1">{product.name}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {product.description}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">{formattedPrice}</span>
          <Button size="icon" variant="outline" className="rounded-full hover:bg-primary hover:text-white transition-colors">
            <Plus className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
