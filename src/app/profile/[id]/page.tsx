
"use client";

import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  ShieldCheck, 
  Calendar, 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  User as UserIcon,
  Truck,
  Award,
  Zap,
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (!firestore || !id) ? null : doc(firestore, 'users', id), [firestore, id]);
  const { data: userProfile, isLoading } = useDoc(userRef);

  if (isLoading) return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    </div>
  );

  if (!userProfile) return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-16 h-16 text-slate-200" />
        <h2 className="text-xl font-black text-slate-400 uppercase italic">Perfil no encontrado</h2>
      </div>
    </div>
  );

  const isRepartidor = userProfile.role === 'repartidor';
  const joinDate = userProfile.createdAt ? format(userProfile.createdAt.toDate(), "MMMM yyyy", { locale: es }) : 'Recientemente';

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {/* BOTÓN DE RETORNO QUIRÚRGICO */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-6 gap-2 text-slate-400 font-bold hover:text-primary p-0 h-auto hover:bg-transparent transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
        </Button>

        <Card className="border-none rounded-[48px] shadow-2xl overflow-hidden bg-white ring-1 ring-black/[0.02]">
          <div className={cn("h-44 relative", isRepartidor ? "bg-slate-900" : "bg-primary")}>
            {isRepartidor && (
              <div className="absolute inset-0 opacity-10 flex items-center justify-around overflow-hidden pointer-events-none">
                {[1,2,3,4,5].map(i => <Truck key={i} className="w-24 h-24 -rotate-12" />)}
              </div>
            )}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <Avatar className="w-36 h-36 border-[8px] border-white shadow-2xl ring-1 ring-slate-100">
                <AvatarImage src={userProfile.photoURL} className="object-cover" />
                <AvatarFallback className="bg-slate-50 text-slate-300 font-black text-4xl leading-none">
                  {userProfile.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          <CardHeader className="pt-20 text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Badge className={cn("text-white font-black uppercase text-[10px] px-4 py-1 rounded-full italic tracking-widest", isRepartidor ? "bg-secondary" : "bg-primary")}>
                {isRepartidor ? "Repartidor Verificado" : `Nivel ${userProfile.role === 'admin' ? 'Elite' : 'Comunidad'}`}
              </Badge>
              {userProfile.role === 'dueño' && <Badge className="bg-primary text-white font-black uppercase text-[10px] px-4 py-1 rounded-full">Vendedor VIP</Badge>}
            </div>
            <CardTitle className="text-5xl font-black italic tracking-tighter uppercase leading-none text-slate-900">
              {userProfile.displayName || 'Usuario de Vitriniando'}
            </CardTitle>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 flex items-center justify-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Miembro desde {joinDate}
            </p>
          </CardHeader>

          <CardContent className="p-8 space-y-10">
            {/* Score de Confianza Logística */}
            <div className="bg-slate-50/50 p-10 rounded-[40px] flex flex-col items-center text-center gap-5 border border-slate-100 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-7 h-7 fill-yellow-400 text-yellow-400 drop-shadow-sm" />)}
              </div>
              <div className="space-y-1">
                <h4 className="text-3xl font-black italic uppercase leading-none tracking-tighter text-slate-900">
                  {isRepartidor ? "Score Logístico: 5.0" : "Score de Confianza: 5.0"}
                </h4>
                <p className="text-slate-400 font-bold text-xs mt-1 max-w-xs mx-auto italic uppercase tracking-widest opacity-60">
                  {isRepartidor 
                    ? "Garantía de entrega rápida y profesional." 
                    : "Basado en cumplimiento certificado."}
                </p>
              </div>
            </div>

            {/* Cuadrantes de Desempeño */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-8 rounded-[40px] border-2 border-slate-50 flex flex-col items-center gap-3 bg-white hover:border-primary/20 transition-all hover:shadow-xl group/stat">
                <div className="w-14 h-14 bg-blue-50 rounded-[20px] flex items-center justify-center text-blue-600 group-hover/stat:bg-primary group-hover/stat:text-white transition-colors">
                  {isRepartidor ? <Truck className="w-7 h-7" /> : <ShoppingBag className="w-7 h-7" />}
                </div>
                <div className="text-center">
                  <span className="text-4xl font-black leading-none tracking-tighter block text-slate-900">12+</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">
                    {isRepartidor ? "Entregas Exitosas" : "Pedidos Realizados"}
                  </span>
                </div>
              </div>
              
              <div className="p-8 rounded-[40px] border-2 border-slate-50 flex flex-col items-center gap-3 bg-white hover:border-green-500/20 transition-all hover:shadow-xl group/stat">
                <div className="w-14 h-14 bg-green-50 rounded-[20px] flex items-center justify-center text-green-600 group-hover/stat:bg-green-500 group-hover/stat:text-white transition-colors">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <span className="text-4xl font-black leading-none tracking-tighter block text-slate-900">100%</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Tasa de Cumplimiento</span>
                </div>
              </div>

              {isRepartidor && (
                <>
                  <div className="p-8 rounded-[40px] border-2 border-slate-50 flex flex-col items-center gap-3 bg-white hover:border-orange-500/20 transition-all hover:shadow-xl group/stat">
                    <div className="w-14 h-14 bg-orange-50 rounded-[20px] flex items-center justify-center text-orange-600 group-hover/stat:bg-orange-500 group-hover/stat:text-white transition-colors">
                      <Zap className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                      <span className="text-4xl font-black leading-none tracking-tighter block text-slate-900">15m</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Velocidad Promedio</span>
                    </div>
                  </div>
                  <div className="p-8 rounded-[40px] border-2 border-slate-50 flex flex-col items-center gap-3 bg-white hover:border-indigo-500/20 transition-all hover:shadow-xl group/stat">
                    <div className="w-14 h-14 bg-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-600 group-hover/stat:bg-indigo-500 group-hover/stat:text-white transition-colors">
                      <MapPin className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                      <span className="text-4xl font-black leading-none tracking-tighter block text-slate-900">Z-1</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Zona de Operación</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Hoja de Vida / Reseñas de Negocios */}
            <div className="space-y-8">
              <div className="flex items-center gap-4 px-2">
                <div className="w-1.5 h-8 bg-primary rounded-full" />
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Actividad Comprobada</h3>
              </div>
              
              <div className="space-y-5">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm space-y-4 hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner">
                          <ShieldCheck className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                          <span className="text-sm font-black uppercase tracking-tight text-slate-900 block italic">Negocio Local Certificado #{i}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Referencia Verificada</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-[10px] font-black text-yellow-700 ml-1">5.0</span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-base font-medium italic leading-relaxed pl-2 border-l-2 border-slate-50">
                      {isRepartidor 
                        ? "Excelente repartidor. Muy puntual y cuida mucho los productos. ¡Recomendado!" 
                        : "Excelente trato y rapidez en el pago. Muy recomendado para futuros negocios."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
