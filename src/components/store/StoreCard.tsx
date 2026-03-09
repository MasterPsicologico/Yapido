
import Image from 'next/image';
import Link from 'next/link';
import { Store as StoreIcon, MapPin, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Store } from '@/lib/mock-data';

export function StoreCard({ store }: { store: Store }) {
  return (
    <Link href={`/stores/${store.id}`}>
      <Card className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={store.imageUrl}
            alt={store.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            data-ai-hint="store image"
          />
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/90 text-primary hover:bg-white">{store.category}</Badge>
          </div>
        </div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                {store.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {store.description}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <MapPin className="w-3.5 h-3.5 text-secondary" />
              <span>Tienda Verificada</span>
            </div>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
