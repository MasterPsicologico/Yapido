
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Users, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section - The content from the original homepage */}
        <section className="relative bg-primary py-24 px-4 overflow-hidden min-h-[60vh] flex items-center">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/pattern/1920/1080')] opacity-10 mix-blend-overlay"></div>
          <div className="container mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              Vitrinea lo mejor de <br /> tu ciudad en un solo lugar
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed">
              Descubre tiendas increíbles, productos exclusivos y recibe todo en la puerta de tu casa. 
              Moderno, rápido y confiable.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/">
                <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-bold px-10 rounded-full h-16 text-lg">
                  Explorar Tiendas
                </Button>
              </Link>
              <Link href="/admin/manage">
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 px-10 rounded-full h-16 text-lg">
                  Registrar mi Negocio
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Vision / Mission Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">Comunidad Local</h3>
                <p className="text-muted-foreground">
                  Fortalecemos la economía local conectando a vecinos con los mejores negocios de su barrio.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">Tecnología Ágil</h3>
                <p className="text-muted-foreground">
                  Usamos IA para que gestionar tu inventario y descripciones sea más rápido que nunca.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">Seguridad Total</h3>
                <p className="text-muted-foreground">
                  Tus transacciones y datos están protegidos bajo los más altos estándares de seguridad.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary/5 border-t py-12">
        <div className="container mx-auto px-4 text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-primary">Vitriniando</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            La plataforma definitiva para conectar tiendas locales con clientes modernos.
          </p>
          <div className="text-xs text-muted-foreground pt-4">
            &copy; {new Date().getFullYear()} Vitriniando. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
