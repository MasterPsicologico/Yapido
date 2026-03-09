
import { Navbar } from '@/components/layout/Navbar';
import { STORES, PRODUCTS } from '@/lib/mock-data';
import { StoreCard } from '@/components/store/StoreCard';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-primary py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/pattern/1920/1080')] opacity-10 mix-blend-overlay"></div>
          <div className="container mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Vitrinea lo mejor de <br /> tu ciudad en un solo lugar
            </h1>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Descubre tiendas increíbles, productos exclusivos y recibe todo en la puerta de tu casa. 
              Moderno, rápido y confiable.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-bold px-8 rounded-full h-14">
                Explorar Tiendas
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 px-8 rounded-full h-14">
                Registrar mi Negocio
              </Button>
            </div>
          </div>
        </section>

        {/* Categories / Featured Stores */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Tiendas Destacadas</h2>
                <p className="text-muted-foreground">Los negocios más populares de la comunidad.</p>
              </div>
              <Button variant="link" className="text-primary font-semibold flex items-center gap-1">
                Ver todas <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {STORES.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </div>
        </section>

        {/* AI Highlight */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="bg-muted/30 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">¿Tienes una tienda? Potencia tus ventas con IA</h3>
                <p className="text-muted-foreground max-w-xl">
                  Nuestra herramienta de Inteligencia Artificial te ayuda a crear descripciones de productos 
                  persuasivas y profesionales en segundos. Vitriniando es el aliado de tu crecimiento.
                </p>
              </div>
              <div className="md:ml-auto">
                <Button className="bg-primary hover:bg-primary/90 rounded-full px-8">Comenzar ahora</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Productos Recientes</h2>
                <p className="text-muted-foreground">Novedades de nuestras vitrinas.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {PRODUCTS.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
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
              <li><Link href="/">Delivery</Link></li>
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
