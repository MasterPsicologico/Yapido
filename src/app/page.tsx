
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { StoreCard } from '@/components/store/StoreCard';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, ShoppingBag, ArrowRight, Zap, Shield, Rocket } from 'lucide-react';
import Link from 'next/link';
import { useUser, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { collection, query, where, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  // If loading user state, show a clean skeleton or loading screen
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
      <Navbar />
      <main className="flex-1">
        {user ? <AuthenticatedHome /> : <UnauthenticatedLanding auth={auth} />}
      </main>

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
              <li><Link href="/">Precios</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Soporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/">Centro de Ayuda</Link></li>
              <li><Link href="/">Contacto</Link></li>
              <li><Link href="/">Seguridad</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/">Términos de Servicio</Link></li>
              <li><Link href="/">Privacidad</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Vitriniando. Todos los derechos reservados.
        </div>
      </footer>
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

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/bg-landing/1920/1080')] opacity-10 bg-cover bg-center"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 text-white/70 text-sm backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span>Potenciado con Inteligencia Artificial</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tight leading-[1.1]">
            Vitriniando: Tu Ciudad <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              en un solo clic.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            La plataforma que conecta los mejores negocios locales con personas que buscan calidad, rapidez y confianza.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button 
              onClick={handleLogin}
              size="lg" 
              className="bg-secondary hover:bg-secondary/90 text-white font-black px-12 rounded-full h-16 text-xl shadow-2xl shadow-secondary/40 group"
            >
              Comenzar Gratis <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Link href="/about">
              <Button size="lg" variant="outline" className="text-white border-white/20 hover:bg-white/10 px-10 rounded-full h-16 text-lg backdrop-blur-sm">
                Saber más
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-20 bg-white border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-4xl font-black text-primary">+500</p>
              <p className="text-muted-foreground font-medium">Tiendas Activas</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-black text-secondary">+10k</p>
              <p className="text-muted-foreground font-medium">Productos Únicos</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-black text-primary">24/7</p>
              <p className="text-muted-foreground font-medium">Soporte Local</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-black text-secondary">IA</p>
              <p className="text-muted-foreground font-medium">Gestión Inteligente</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl font-black text-slate-900 mb-6">¿Por qué elegir Vitriniando?</h2>
            <p className="text-lg text-slate-500">
              Hemos reinventado la forma en que los negocios locales operan y cómo los clientes descubren productos excepcionales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <Rocket className="w-8 h-8 text-primary" />,
                title: "Velocidad Extrema",
                desc: "Desde que pides hasta que llega, optimizamos cada segundo de la cadena logística."
              },
              {
                icon: <Zap className="w-8 h-8 text-secondary" />,
                title: "IA Generativa",
                desc: "Nuestra IA crea descripciones profesionales por ti, permitiéndote vender más rápido."
              },
              {
                icon: <Shield className="w-8 h-8 text-primary" />,
                title: "Pagos Seguros",
                desc: "Transacciones protegidas con tecnología de punta y verificación de comerciantes."
              }
            ].map((f, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:scale-[1.02] transition-transform">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/pattern/1920/1080')] opacity-5 mix-blend-overlay"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8">
            ¿Listo para llevar tu <br /> negocio al siguiente nivel?
          </h2>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-white text-primary hover:bg-slate-100 font-black px-14 rounded-full h-20 text-2xl shadow-3xl shadow-white/20"
          >
            Únete a Vitriniando Ahora
          </Button>
          <p className="mt-8 text-white/60 font-medium">Registro instantáneo con Google. Sin tarjetas de crédito.</p>
        </div>
      </section>
    </div>
  );
}
