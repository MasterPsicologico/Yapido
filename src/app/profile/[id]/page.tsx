
"use client";

import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  ShieldCheck, 
  Calendar, 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  User as UserIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PublicProfilePage() {
  const params = useParams();
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

  const joinDate = userProfile.createdAt ? format(userProfile.createdAt.toDate(), "MMMM yyyy", { locale: es }) : 'Recientemente';

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <Card className="border-none rounded-[48px] shadow-2xl overflow-hidden bg-white">
          <div className="h-32 bg-primary relative">
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <Avatar className="w-32 h-32 border-[6px] border-white shadow-xl">
                <AvatarImage src={userProfile.photoURL} className="object-cover" />
                <AvatarFallback className="bg-slate-100 text-slate-300"><UserIcon className="w-12 h-12" /></AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          <CardHeader className="pt-20 text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge className="bg-secondary text-white font-black uppercase text-[10px] px-3">Nivel {userProfile.role === 'admin' ? 'Elite' : 'Comunidad'}</Badge>
              {userProfile.role === 'dueño' && <Badge className="bg-primary text-white font-black uppercase text-[10px] px-3">Vendedor Verificado</Badge>}
            </div>
            <CardTitle className="text-4xl font-black italic tracking-tighter uppercase">{userProfile.displayName || 'Usuario de Vitriniando'}</CardTitle>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Miembro desde {joinDate}</p>
          </CardHeader>

          <CardContent className="p-8 space-y-10">
            {/* Score de Comportamiento */}
            <div className="bg-slate-50 p-8 rounded-[32px] flex flex-col items-center text-center gap-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />)}
              </div>
              <div>
                <h4 className="text-2xl font-black italic uppercase leading-none">Score de Confianza: 5.0</h4>
                <p className="text-slate-400 font-medium text-sm mt-1">Basado en el cumplimiento de sus últimos pedidos.</p>
              </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-[28px] border-2 border-slate-50 flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><ShoppingBag className="w-5 h-5" /></div>
                <span className="text-2xl font-black leading-none">12+</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Pedidos Exitosos</span>
              </div>
              <div className="p-6 rounded-[28px] border-2 border-slate-50 flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600"><CheckCircle2 className="w-5 h-5" /></div>
                <span className="text-2xl font-black leading-none">100%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Tasa de Respuesta</span>
              </div>
            </div>

            {/* Hoja de Vida / Reseñas */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 px-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-black italic uppercase tracking-tight">Actividad de la Comunidad</h3>
              </div>
              
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-green-500" /></div>
                        <span className="text-xs font-black uppercase tracking-tight text-slate-700">Negocio Local #{i}</span>
                      </div>
                      <div className="flex gap-0.5"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /></div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium italic">"Excelente trato y rapidez. Muy recomendado para futuros negocios en la plataforma."</p>
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
