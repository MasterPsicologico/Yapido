
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Settings, Wrench, RefreshCw, MapPin, Truck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-black py-24 px-4 overflow-hidden min-h-[60vh] flex items-center border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50 mix-blend-overlay blur-3xl"></div>
          
          {/* Cyber grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>

          <div className="container mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm mb-6 uppercase tracking-widest font-mono">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Conoce Yapido.click
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 uppercase tracking-tight">
              Logística Inteligente <br className="hidden md:block"/> para <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Lavadoras</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed font-mono">
              Especialistas en alquiler, compraventa y mantenimiento integral. 
              Transformando el servicio de electrodomésticos en Colombia.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 rounded-sm h-14 text-lg uppercase tracking-wider">
                  Nuestros Servicios
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Quiénes Somos Section */}
        <section className="py-20 bg-black border-b border-white/5 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tight">Quiénes Somos</h2>
              <div className="w-16 h-1 bg-primary mx-auto"></div>
              <p className="text-lg md:text-xl text-zinc-400 font-mono leading-relaxed">
                En <strong className="text-white">Yapido.click</strong> somos un equipo apasionado por solucionar las necesidades de electrodomésticos en los hogares colombianos. Nos alejamos de los modelos tradicionales para ofrecer una plataforma ágil, tecnológica y enfocada 100% en la <strong className="text-primary">logística, mantenimiento y provisión de lavadoras</strong>. Entendemos el valor de tu tiempo y la importancia de equipos confiables, por eso hemos construido una red sólida que garantiza que nunca te quedes sin lavar.
              </p>
            </div>
          </div>
        </section>

        {/* Core Services Section */}
        <section className="py-24 bg-zinc-950 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tight mb-4">Nuestro Core</h2>
              <div className="w-24 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Service 1 */}
              <div className="group bg-black/50 border border-white/10 p-8 hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <RefreshCw className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 uppercase tracking-wide">Alquiler & Compraventa</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Gestionamos la logística completa para el alquiler de lavadoras y facilitamos el mercado de segunda mano con equipos garantizados.
                </p>
              </div>

              {/* Service 2 */}
              <div className="group bg-black/50 border border-white/10 p-8 hover:border-secondary/50 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                  <Wrench className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 uppercase tracking-wide">Mantenimiento</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Servicio técnico especializado para alargar la vida útil de los equipos. Respuestas rápidas y repuestos de alta calidad.
                </p>
              </div>

              {/* Service 3 */}
              <div className="group bg-black/50 border border-white/10 p-8 hover:border-green-500/50 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-14 h-14 bg-white/5 border border-white/10 flex items-center justify-center text-green-400 mb-6 group-hover:scale-110 transition-transform">
                  <Truck className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 uppercase tracking-wide">Logística Integral</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Movilidad y distribución eficiente. Llevamos el equipo hasta donde lo necesites con total seguridad y puntualidad.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Expansion Plan */}
        <section className="py-24 bg-black border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2 space-y-8">
                <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tight">Ruta de <span className="text-primary">Expansión</span></h2>
                <p className="text-lg text-zinc-400 font-mono leading-relaxed">
                  Nacimos con una visión clara: estructurar el mercado de lavadoras en Colombia con tecnología y eficiencia. Nuestro mapa de ruta está diseñado para llegar a cada rincón.
                </p>
                
                <ul className="space-y-6">
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Fase 1: Medellín</h4>
                      <p className="text-zinc-500">Nuestro punto de partida y actual centro de operaciones principales.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0 mt-1">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Fase 2: Aguachica, Cesar</h4>
                      <p className="text-zinc-500">Próxima apertura para conectar el norte del país con nuestro servicio.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0 mt-1">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Fase 3: Expansión Nacional</h4>
                      <p className="text-zinc-500">Llevando el estándar de Yapido.click a más ciudades de Colombia.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="md:w-1/2 w-full">
                <div className="aspect-square bg-zinc-900 border border-white/10 relative flex items-center justify-center p-8 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]"></div>
                  <div className="w-64 h-64 border border-primary/30 rounded-full flex items-center justify-center relative animate-spin-slow">
                    <div className="absolute w-full h-full border border-secondary/30 rounded-full rotate-45 scale-110"></div>
                    <div className="absolute w-full h-full border border-white/10 rounded-full -rotate-45 scale-125"></div>
                  </div>
                  <div className="absolute text-center z-10 bg-black/80 p-6 border border-white/10 backdrop-blur-md">
                    <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-black text-white tracking-widest uppercase">Yapido.click</div>
                    <div className="text-sm text-zinc-500 font-mono mt-1">OPERATIONS HUB</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-12">
        <div className="container mx-auto px-4 text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center text-primary">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white tracking-widest uppercase">Yapido.click</span>
          </div>
          <p className="text-sm text-zinc-500 max-w-md mx-auto font-mono">
            Logística, alquiler y mantenimiento de lavadoras en Colombia.
          </p>
          <div className="text-xs text-zinc-700 pt-4 font-mono tracking-widest">
            &copy; {new Date().getFullYear()} YAPIDO.CLICK. TODOS LOS DERECHOS RESERVADOS.
          </div>
        </div>
      </footer>
    </div>
  );
}

