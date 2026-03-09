
"use client";

import Link from 'next/link';
import { Store, ShoppingBag, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-primary">Vitriniando</span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-md relative">
          <Input 
            placeholder="Buscar tiendas o productos..." 
            className="pl-10 bg-muted/50 border-none focus-visible:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/manage">
            <Button variant="ghost" className="hidden sm:flex items-center gap-2">
              <Store className="w-4 h-4" />
              Mi Tienda
            </Button>
          </Link>
          <Button variant="default" className="bg-secondary hover:bg-secondary/90 flex items-center gap-2 rounded-full px-6">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Ingresar</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
