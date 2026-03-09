
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
        {/* Categories / Featured Stores - Now directly at the top */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-black text-foreground mb-2">Vitrinea en tu Ciudad</h1>
                <p className="text-muted-foreground text-lg">Descubre los mejores negocios locales seleccionados para ti.</p>
              </div>
              <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white transition-all font-bold">
                Ver todas las categorías <ChevronRight className="ml-1 w-4 h-4" />
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
                <Link href="/admin/manage">
                  <Button className="bg-primary hover:bg-primary/90 rounded-full px-8">Comenzar ahora</Button>
                </Link>
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
