"use client";

import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  ShieldCheck, 
  MapPin, 
  CheckCircle2,
  Clock,
  Rocket,
  Target
} from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BusinessPlanPage() {
  const { isAdmin, isLoading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    // RESTRICCIÓN ABSOLUTA: Solo el Administrador Principal tiene acceso
    if (!isLoading && !isAdmin) router.push('/');
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl space-y-12 pb-32">
        
        {/* Cabecera Élite */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-4">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center text-white shadow-2xl relative border border-white/5">
              <Target className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900 break-words">Plan de Imperio</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Vitriniando: Medellín & Aguachica 2024</p>
            </div>
          </div>
          <Badge className="bg-primary text-white font-black text-[10px] px-4 py-2 rounded-full shadow-lg">ESTRATEGIA CONFIDENCIAL</Badge>
        </header>

        {/* Fase 1: El Laboratorio */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 ml-4">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm"><Zap className="w-4 h-4" /></div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Fase 1: El Laboratorio (Aguachica)</h2>
          </div>
          <Card className="border-none rounded-[40px] shadow-xl bg-white overflow-hidden ring-1 ring-black/[0.03]">
            <CardContent className="p-8 space-y-6">
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                Su papá es la clave del éxito. En Aguachica vamos a perfeccionar el "Product-Market Fit". No buscamos volumen aquí, buscamos <b>eficiencia absoluta</b>.
              </p>
              <div className="grid gap-4">
                {[
                  { title: "Entrenamiento de Campo", desc: "El repartidor de su papá debe dominar el radar. Medir cuánto tiempo tarda desde que recibe la alerta hasta que instala." },
                  { title: "Recolección de Evidencia", desc: "Grabar videos cortos de clientes felices en Aguachica. Esto será el material de venta para Medellín." },
                  { title: "Ajuste de Tarifas", desc: "Probar el modelo de recargos por pisos y escalas. Validar que la gente esté dispuesta a pagar por la comodidad." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase text-slate-900 italic tracking-tight">{item.title}</p>
                      <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Fase 2: El Caballo de Troya */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 ml-4">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm"><ShieldCheck className="w-4 h-4" /></div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Fase 2: El Caballo de Troya (Manrique)</h2>
          </div>
          <Card className="border-none rounded-[40px] shadow-xl bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <CardContent className="p-10 space-y-8 relative z-10">
              <div className="space-y-2">
                <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em]">Acción en Medellín</p>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Digitalizar el Caos</h3>
              </div>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Usted llegará a los dueños de Manrique no a "venderles clientes", sino a "venderles paz mental". 
              </p>
              <div className="space-y-4">
                <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 space-y-2">
                  <h4 className="text-sm font-black uppercase text-primary italic">La Oferta Irresistible:</h4>
                  <p className="text-xs text-slate-300">"Don José, le regalo este software para que sepa dónde están sus lavadoras, a qué hora tiene que recogerlas y cuánto dinero lleva ganado en el día. Pruébelo 15 días gratis para organizar su negocio."</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-2xl font-black text-white italic tracking-tighter">0%</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase mt-1">Costo inicial</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-2xl font-black text-white italic tracking-tighter">100%</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase mt-1">Control de inventario</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Fase 3: Apertura de Grifo */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 ml-4">
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shadow-sm"><Rocket className="w-4 h-4" /></div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Fase 3: Apertura de Grifo (Generación de Riqueza)</h2>
          </div>
          <Card className="border-none rounded-[40px] shadow-xl bg-white overflow-hidden ring-1 ring-black/[0.03]">
            <CardContent className="p-8 space-y-10">
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="flex-1 space-y-4">
                   <p className="text-sm text-slate-600 font-medium">
                     Una vez tenga 5 o 10 dueños en Manrique usando la app, usted lanza la <b>Campaña de Marketing</b>. 
                   </p>
                   <div className="space-y-3">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Anuncio sugerido:</p>
                     <div className="p-5 rounded-3xl bg-blue-50 border border-blue-100 text-blue-900 text-xs font-bold italic leading-relaxed">
                       "¿Cansada de lavar a mano? 🧺 Alquila una lavadora digital hoy en Manrique. Instalación en 15 min. Pago al recibir. ¡Pídela aquí!"
                     </div>
                   </div>
                </div>
                <div className="w-full sm:w-64 space-y-4">
                   <div className="bg-slate-900 rounded-[32px] p-6 text-white text-center shadow-xl">
                      <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-2">Comisión Vitriniando</p>
                      <h4 className="text-3xl font-black italic tracking-tighter leading-none">$3.000 - $5.000</h4>
                      <p className="text-[10px] text-slate-400 mt-2">POR CADA PEDIDO</p>
                   </div>
                   <p className="text-[10px] text-center font-bold text-slate-400 uppercase leading-tight">10 pedidos/día x 10 tiendas = <br/> <span className="text-slate-900 text-lg">$15.000.000/mes</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Acciones Físicas de Mañana */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 ml-4">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm"><MapPin className="w-4 h-4" /></div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Acciones Físicas Reales (¡MAÑANA MISMO!)</h2>
          </div>
          <div className="grid gap-6">
            <div className="p-8 rounded-[48px] bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#a16207] shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer" />
               <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white"><Clock className="w-6 h-6" /></div>
                    <span className="text-xl font-black text-slate-950 uppercase italic tracking-tighter">Agenda de Lanzamiento</span>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                       <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                       <p className="text-xs font-bold text-slate-900"><b>Aguachica:</b> Sentarse con su papá y su repartidor. Instalarles la app y simular 3 pedidos en su presencia. Corregir cualquier duda.</p>
                    </li>
                    <li className="flex items-start gap-4">
                       <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                       <p className="text-xs font-bold text-slate-900"><b>Medellín:</b> Ubicar 5 locales de alquiler de lavadoras en Manrique. No entrar a vender, entrar a <b>observar</b>. ¿Cómo anotan sus pedidos? ¿Tienen cuadernos? ¿WhatsApp lleno?</p>
                    </li>
                    <li className="flex items-start gap-4">
                       <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                       <p className="text-xs font-bold text-slate-900"><b>Digital:</b> Crear la Fanpage de Facebook "Lavadoras Manrique Digital" o "Vitriniando Alquiler". Empezar a calentar el algoritmo.</p>
                    </li>
                  </ul>
               </div>
            </div>
          </div>
        </section>

        <footer className="text-center py-10 opacity-40">
           <div className="flex items-center justify-center gap-3">
              <ShieldCheck className="w-5 h-5 text-slate-400" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">SISTEMA BLINDADO PARA CREACIÓN DE RIQUEZA</p>
           </div>
        </footer>
      </main>
    </div>
  );
}
