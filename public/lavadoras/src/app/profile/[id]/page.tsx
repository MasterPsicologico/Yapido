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
  ArrowLeft,
  Waves,
  ChevronRight,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (!firestore || !id) ? null : doc(firestore, 'users', id), [firestore, id]);
  const { data: userProfile, isLoading } = useDoc(userRef);

  // FETCH: Tienda vinculada si existe (Ej: Empresa de Alquiler de Lavadoras)
  const linkedStoreRef = useMemoFirebase(() => 
    (!firestore || !userProfile?.linkedStoreId) ? null : doc(firestore, 'stores', userProfile.linkedStoreId), 
    [firestore, userProfile?.linkedStoreId]
  );
  const { data: linkedStore } = useDoc(linkedStoreRef);

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
            </div>
            <CardTitle className="text-5xl font-black italic tracking-tighter uppercase leading-none text-slate-900">
              {userProfile.displayName || 'Usuario'}
            </CardTitle>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 flex items-center justify-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Miembro desde {joinDate}
            </p>
          </CardHeader>

          <CardContent className="p-8 space-y-10">
            {/* VINCULACIÓN A EMPRESA PRIVADA: IDENTIDAD DE FLOTA */}
            {isRepartidor && linkedStore && (
              <Link href={`/stores/${linkedStore.id}`}>
                <Card className="border-none rounded-[36px] bg-slate-900 text-white p-8 shadow-2xl overflow-hidden relative group hover:scale-[1.02] transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-primary transition-colors">
                        <Waves className="w-7 h-7 text-primary group-hover:text-white animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">REPARTIDOR DE</p>
                        <h4 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{linkedStore.name}</h4>
                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-2">Servicio de Alquiler de Lavadoras</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                </Card>
              </Link>
            )}

            <div className="bg-slate-50/50 p-10 rounded-[40px] flex flex-col items-center text-center gap-5 border border-slate-100 shadow-inner">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-7 h-7 fill-yellow-400 text-yellow-400" />)}
              </div>
              <h4 className="text-3xl font-black italic uppercase leading-none tracking-tighter text-slate-900">Score de Confianza: 5.0</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-8 rounded-[40px] border-2 border-slate-50 flex flex-col items-center gap-3 bg-white">
                <div className="w-14 h-14 bg-blue-50 rounded-[20px] flex items-center justify-center text-blue-600">
                  {isRepartidor ? <Truck className="w-7 h-7" /> : <ShoppingBag className="w-7 h-7" />}
                </div>
                <div className="text-center">
                  <span className="text-4xl font-black leading-none tracking-tighter block text-slate-900">12+</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">
                    {isRepartidor ? "Entregas Exitosas" : "Pedidos Realizados"}
                  </span>
                </div>
              </div>
              <div className="p-8 rounded-[40px] border-2 border-slate-50 flex flex-col items-center gap-3 bg-white">
                <div className="w-14 h-14 bg-green-50 rounded-[20px] flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <span className="text-4xl font-black leading-none tracking-tighter block text-slate-900">100%</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Cumplimiento</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}