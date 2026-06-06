
"use client";

import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Loader2, 
  Activity, 
  History, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  Clock,
  User,
  Truck,
  ArrowUpRight,
  Database,
  Sparkles
} from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LogisticsPanel } from '@/components/agents/logistica/LogisticsPanel';

const AGENT_FUNCTIONS: Record<string, string[]> = {
  soporte: ["Auditoría de Rutas", "Gestión de Tickets", "Mediación Tienda-Driver", "Protocolos de Emergencia"],
  cliente: ["Validación de Carrito", "Control de Estados", "Sugerencia de Productos"],
  notificaciones: ["Push Messaging", "SMS Gateway", "Alertas en Tiempo Real"],
  antifraude: ["Risk Scoring", "Pattern Detection", "Account Sanctions"],
  asignador: ["Matchmaking", "Fleet Balancing", "Auto-Reassignment"],
  pagos: ["Split Logic", "Debt Management", "Refund Processing"],
};

export default function AgentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isAdmin, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();

  useEffect(() => {
    if (!profileLoading && !isAdmin) router.push('/');
  }, [isAdmin, profileLoading, router]);

  // Si es el agente de logística, renderizar panel especializado
  if (id === 'logistica') {
    if (profileLoading) return null;
    if (!isAdmin) return null;
    return <LogisticsPanel />;
  }

  // QUERY DE INCIDENTES PARA EL AGENTE DE SOPORTE
  const incidentsQuery = useMemoFirebase(() => {
    if (!firestore || id !== 'soporte') return null;
    return query(
      collection(firestore, 'incidents'),
      where('agentOwner', '==', 'soporte'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [firestore, id]);

  const { data: incidents, isLoading: loadingIncidents } = useCollection(incidentsQuery);

  const functions = AGENT_FUNCTIONS[id] || ["Monitorización General", "Sincronización de Datos", "Logs de Actividad"];

  if (profileLoading) return null;

  return (
    <div className="fixed inset-0 z-[400] bg-white flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
      {/* Header Industrial */}
      <div className="h-20 bg-slate-900 flex items-center justify-between px-8 text-white shrink-0 shadow-2xl relative">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[18px] bg-primary/20 flex items-center justify-center border border-white/5 relative">
            <Zap className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Agente {id}</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Estatus: Activo y Sincronizado</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/admin/agents')} 
          className="h-12 w-12 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      <main className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar p-6 sm:p-10">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Grid de Funciones Activas */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Módulos de Ejecución</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {functions.map((fn, idx) => (
                <Card key={idx} className="border-none rounded-3xl shadow-sm bg-white overflow-hidden ring-1 ring-black/[0.02] group">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-slate-800 leading-tight uppercase italic">{fn}</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sincronizado</span>
                      </div>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-green-500/30 group-hover:text-green-500 transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Monitor de Datos Reales (Ej: Historial para Soporte) */}
          {id === 'soporte' && (
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Historial de Liberaciones</h3>
                </div>
                <Badge className="bg-slate-900 text-white border-none font-black text-[9px] uppercase px-3">Logs Reales</Badge>
              </div>

              <div className="space-y-4">
                {loadingIncidents ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
                  </div>
                ) : incidents && incidents.length > 0 ? (
                  incidents.map((incident) => (
                    <Card key={incident.id} className="border-none rounded-[32px] shadow-sm bg-white overflow-hidden ring-1 ring-black/[0.03] hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                              <AlertCircle className="w-7 h-7 text-red-500" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-tight text-slate-900 italic">#{incident.orderId.slice(-6).toUpperCase()}</span>
                                <Badge className={cn("text-[8px] font-black uppercase px-2 h-5 border-none", incident.hasProducts ? "bg-red-500 text-white" : "bg-orange-500 text-white")}>
                                  {incident.hasProducts ? "CON DEUDA" : "LIMPIO"}
                                </Badge>
                              </div>
                              <p className="text-sm font-bold text-slate-600 italic">"{incident.reason}"</p>
                              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {incident.driverName}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(incident.createdAt.toDate(), "dd MMM, HH:mm", { locale: es })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="w-full sm:w-auto flex flex-col items-end gap-2">
                            <p className="text-right text-[10px] font-black text-slate-300 uppercase tracking-widest">Saldo Afectado</p>
                            <span className={cn("text-xl font-black italic tracking-tighter", incident.hasProducts ? "text-red-600" : "text-slate-400")}>
                              {incident.hasProducts ? `-${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(incident.orderValue)}` : "$0"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                    <Database className="w-12 h-12 mx-auto text-slate-100 mb-4" />
                    <p className="text-slate-300 font-black uppercase tracking-widest text-sm italic">Sin incidentes registrados</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Sección Genérica para otros agentes */}
          {id !== 'soporte' && (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
              <Sparkles className="w-12 h-12 text-primary mb-4 animate-pulse" />
              <h3 className="text-2xl font-black text-slate-400 italic uppercase tracking-tighter">Módulo en Desarrollo</h3>
              <p className="text-slate-400 font-medium max-w-sm mt-2 uppercase text-[10px] tracking-widest">
                La Ciudadela está conectando los flujos de datos para {id.toUpperCase()}. Los logs reales aparecerán aquí pronto.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Footer Técnico */}
      <div className="h-12 bg-white border-t flex items-center justify-center px-8 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Yapido AI Central • Kernel v2.0</span>
        </div>
      </div>
    </div>
  );
}
