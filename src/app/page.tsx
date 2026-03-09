
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { StoreCard } from '@/components/store/StoreCard';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { collection, query, where, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  if (isUserLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Skeleton className="h-12 w-1/3 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {!user && <div className="absolute top-0 left-0 w-full z-50"><Navbar /></div>}
      {user && <Navbar />}
      <main className="flex-1">
        {user ? <AuthenticatedHome /> : <UnauthenticatedLanding auth={auth} />}
      </main>

      {user && (
        <footer className="bg-primary/5 border-t py-12">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-primary">Vitriniando</span>
              </div>
              <p className="text-sm text-muted-foreground">
                La plataforma definitiva para conectar tiendas locales con clientes modernos.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/">Tiendas</Link></li>
                <li><Link href="/about">Sobre Nosotros</Link></li>
              </ul>
            </div>
          </div>
          <div className="container mx-auto px-4 mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Vitriniando. Todos los derechos reservados.
          </div>
        </footer>
      )}
    </div>
  );
}

function AuthenticatedHome() {
  const { firestore } = useAuth();
  
  const storesQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'stores'), where('status', '==', 'active'), limit(6));
  }, [firestore]);

  const productsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'products'), where('status', '==', 'available'), limit(8));
  }, [firestore]);

  const { data: stores, isLoading: loadingStores } = useCollection(storesQuery);
  const { data: products, isLoading: loadingProducts } = useCollection(productsQuery);

  return (
    <>
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-black text-foreground mb-2">Tu Vitrina Digital</h1>
              <p className="text-muted-foreground text-lg">Explora lo mejor de tu ciudad ahora mismo.</p>
            </div>
            <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white transition-all font-bold">
              Todas las categorías <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
          
          {loadingStores ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-3xl" />)}
            </div>
          ) : stores && stores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store as any} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
              <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No hay tiendas disponibles en este momento.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-muted/30 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 border border-border/50">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-secondary/20">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">¿Eres comerciante?</h3>
              <p className="text-muted-foreground max-w-xl">
                Potencia tu catálogo con nuestra Inteligencia Artificial. Genera descripciones que venden y llega a más clientes en segundos.
              </p>
            </div>
            <div className="md:ml-auto">
              <Link href="/admin/manage">
                <Button className="bg-primary hover:bg-primary/90 rounded-full px-8 h-12 font-bold">Gestionar mi Vitrina</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-8">Novedades para ti</h2>
          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

function UnauthenticatedLanding({ auth }: { auth: any }) {
  const handleLogin = () => initiateGoogleSignIn(auth);
  const morrocoyImage = PlaceHolderImages.find(img => img.id === 'bg-morrocoy');

  return (
    <div className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-slate-950">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={morrocoyImage?.imageUrl || "https://picsum.photos/seed/morrocoy/1920/1080"} 
          alt="Morrocoy Background" 
          fill 
          className="object-cover opacity-60"
          priority
          data-ai-hint="morrocoy tortoise"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
      </div>

      {/* Content Scene */}
      <div className="container mx-auto px-4 relative z-10 text-center animate-in fade-in zoom-in duration-1000">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8 text-white/90 text-sm backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-secondary" />
          <span>Vitriniando presenta</span>
        </div>
        
        <h1 className="text-6xl md:text-9xl font-black text-white mb-6 tracking-tighter leading-none">
          AGUACHICA <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient">
            2.0
          </span>
        </h1>
        
        <p className="text-xl md:text-3xl text-white/80 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
          Descubre la nueva era del comercio local. <br />
          Calidad, rapidez y el orgullo de nuestra tierra en un solo lugar.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-white font-black px-12 rounded-full h-20 text-2xl shadow-2xl shadow-primary/40 group transform hover:scale-105 transition-all"
          >
            Comenzar Ahora <ArrowRight className="ml-2 w-8 h-8 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto text-white/60 text-sm font-medium">
          <div className="flex flex-col items-center gap-2">
            <span className="text-white text-2xl font-bold">100%</span>
            <span>Local</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-white text-2xl font-bold">IA</span>
            <span>Inteligente</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-white text-2xl font-bold">24/7</span>
            <span>Disponible</span>
          </div>
        </div>
      </div>
    </div>
  );
}
