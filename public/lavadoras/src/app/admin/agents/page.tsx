
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  User, 
  Store, 
  Truck, 
  Target, 
  Navigation, 
  Wallet, 
  Bell, 
  ShieldAlert, 
  LifeBuoy, 
  TrendingUp, 
  Sparkles, 
  LineChart, 
  Zap, 
  Globe,
  ChevronRight,
  ArrowLeft,
  Package,
  Radio,
  Scale,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/firebase/auth/use-profile';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

const SPECIALIZED_AGENTS = [
  { id: 'logistica', name: 'LOGÍSTICA', icon: Navigation, color: 'text-white', bg: 'bg-slate-900', desc: 'Orquestador Principal', featured: true },
  { id: 'cliente', name: 'CLIENTE', icon: User, color: 'text-blue-500', bg: 'bg-blue-50', desc: 'Orquestación de Pedidos' },
  { id: 'tienda', name: 'TIENDA', icon: Store, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Gestión de Inventario' },
  { id: 'repartidor', name: 'REPARTIDOR', icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Control de Flota' },
  { id: 'asignador', name: 'ASIGNADOR', icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50', desc: 'Matchmaking Inteligente' },
  { id: 'rutas', name: 'RUTAS', icon: Navigation, color: 'text-cyan-500', bg: 'bg-cyan-50', desc: 'Navegación y Tiempos' },
  { id: 'precios', name: 'PRECIOS', icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-50', desc: 'Tarifas Dinámicas' },
  { id: 'pagos', name: 'PAGOS', icon: Wallet, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Split Financiero' },
  { id: 'notificaciones', name: 'NOTIFICACIONES', icon: Bell, color: 'text-rose-500', bg: 'bg-rose-50', desc: 'Comunicación Omnicanal' },
  { id: 'prediccion', name: 'PREDICCIÓN', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Demanda Futura' },
  { id: 'fraude', name: 'ANTIFRAUDE', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50', desc: 'Seguridad y Riesgo' },
  { id: 'soporte', name: 'SOPORTE', icon: LifeBuoy, color: 'text-sky-500', bg: 'bg-sky-50', desc: 'Resolución de Conflictos' },
  { id: 'supervisor', name: 'SUPERVISOR', icon: Cpu, color: 'text-slate-900', bg: 'bg-slate-100', desc: 'Torre de Control' },
  { id: 'analytics', name: 'ANALYTICS', icon: LineChart, color: 'text-violet-600', bg: 'bg-violet-50', desc: 'Cerebro de Datos' },
  { id: 'optimizacion', name: 'OPTIMIZACIÓN', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Eficiencia Continua' },
  { id: 'marketing', name: 'MARKETING', icon: Sparkles, color: 'text-pink-500', bg: 'bg-pink-50', desc: 'Crecimiento y Ventas' },
  { id: 'growth', name: 'GROWTH', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', desc: 'Expansión Global' },
  { id: 'inventario', name: 'INVENTARIO', icon: Package, color: 'text-teal-600', bg: 'bg-teal-50', desc: 'Stock y Suministros' },
  { id: 'tiempo-real', name: 'TIEMPO REAL', icon: Radio, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', desc: 'Streaming de Eventos' },
  { id: 'legal', name: 'LEGAL', icon: Scale, color: 'text-gray-600', bg: 'bg-gray-50', desc: 'Cumplimiento y Normas' },
];

export default function AdminAgentsPage() {
  const { isAdmin, isLoading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex flex-col gap-8 mb-12">
          <Link href="/" className="group flex items-center gap-2 text-slate-400 font-bold hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Volver al Marketplace</span>
          </Link>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 rounded-[24px] sm:rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-slate-200 border border-white/5 shrink-0">
              <Cpu className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>
            <div className="space-y-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900 break-words">Ciudadela de Agentes</h1>
              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] sm:tracking-[0.4em] ml-0.5 sm:ml-1">20 Especialistas • Yapido AI</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {SPECIALIZED_AGENTS.map((agent) => (
            <Link key={agent.id} href={`/admin/agents/${agent.id}`}>
              <Card className={cn(
                "border-none rounded-[24px] sm:rounded-[32px] shadow-sm overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer ring-1 ring-black/[0.03]",
                (agent as any).featured ? "bg-slate-900 text-white col-span-2 ring-0" : "bg-white"
              )}>
                <CardContent className={cn("p-5 sm:p-8 flex flex-col items-center text-center", (agent as any).featured ? "space-y-3 sm:space-y-5" : "space-y-3 sm:space-y-5")}>
                  <div className={cn(
                    "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-[5deg]",
                    agent.bg, agent.color
                  )}>
                    <agent.icon className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <Badge className={cn("border-none text-[7px] font-black uppercase px-2.5 tracking-widest mb-1", (agent as any).featured ? "bg-primary/20 text-primary" : cn(agent.bg, agent.color))}>ACTIVO</Badge>
                    <h3 className={cn("text-lg sm:text-xl font-black italic uppercase tracking-tighter", (agent as any).featured ? "text-white" : "text-slate-900")}>{agent.name}</h3>
                    <p className={cn("text-[9px] sm:text-[10px] font-bold uppercase tracking-widest", (agent as any).featured ? "text-slate-400" : "text-slate-400")}>{agent.desc}</p>
                  </div>
                  <div className="w-full pt-4 border-t border-slate-50 flex items-center justify-center gap-2 text-primary font-black text-[9px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                    Abrir Monitor <ChevronRight className="w-3 h-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
