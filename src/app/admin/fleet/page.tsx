
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Truck, 
  X, 
  CheckCircle2, 
  Download, 
  Maximize2, 
  User as UserIcon,
  Phone,
  FileText,
  Loader2,
  AlertCircle,
  Settings2,
  Save,
  Percent
} from 'lucide-react';
import { useFirestore, useCollection, useDoc, useUser, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function FleetAdminPage() {
  const { isAdmin, isLoading: profileLoading } = useProfile();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [commissionInput, setCommissionInput] = useState<number>(20);
  const [savingCommission, setSavingCommission] = useState(false);

  // Leer store del admin para obtener commissionRate
  const adminStoreQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin || !user?.uid) return null;
    return query(collection(firestore, 'stores'), where('ownerId', '==', user.uid), where('type', '==', 'washer_rental'), limit(1));
  }, [firestore, isAdmin, user?.uid]);
  const { data: adminStores } = useCollection(adminStoreQuery);
  const adminStore = adminStores?.[0];

  useEffect(() => {
    if (adminStore?.commissionRate !== undefined) {
      setCommissionInput(Math.round(adminStore.commissionRate * 100));
    }
  }, [adminStore?.commissionRate]);

  useEffect(() => {
    if (!profileLoading && !isAdmin) router.push('/');
  }, [isAdmin, profileLoading, router]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'users'), where('deliveryRequested', '==', true));
  }, [firestore, isAdmin]);

  const { data: requests, isLoading: loadingRequests } = useCollection(requestsQuery);

  const handleApprove = (userId: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, {
      role: 'repartidor',
      deliveryRequested: false,
      deliveryStatus: 'approved',
      deliveryActive: true,
      balance: 0,
      completedJobs: 0,
      avgRating: 5.0,
      approvedAt: serverTimestamp(),
      hasSeenApproval: false // Flag para activar la página de bienvenida
    });
    toast({ title: "Repartidor Aprobado", className: "bg-green-600 text-white" });
  };

  const handleReject = (userId: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, {
      deliveryRequested: false,
      deliveryStatus: 'rejected',
      rejectedAt: serverTimestamp()
    });
    toast({ title: "Solicitud Rechazada", variant: "destructive" });
  };

  const downloadImage = (base64: string, name: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `Vitriniando_${name}.jpg`;
    link.click();
  };

  if (profileLoading) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex items-center gap-6 mb-12">
          <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center text-white shadow-2xl">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none break-words">Verificación de Flota</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Control de Personal • {requests?.length || 0} PENDIENTES</p>
          </div>
        </div>

        {/* SECCIÓN: Configuración de Comisión */}
        {adminStore && (
          <Card className="border-none rounded-[32px] shadow-sm bg-white overflow-hidden ring-1 ring-black/[0.03] mb-10">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <Settings2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">Comisión de Repartidores</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Porcentaje que gana cada repartidor por entrega</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                <div className="flex-1 w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Porcentaje</label>
                    <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full">
                      <span className="text-2xl font-black text-emerald-600 tracking-tighter">{commissionInput}</span>
                      <Percent className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={commissionInput}
                    onChange={(e) => setCommissionInput(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-500 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:appearance-none"
                  />
                  <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                    <span>1%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <Button
                  disabled={savingCommission}
                  onClick={async () => {
                    if (!firestore || !adminStore) return;
                    setSavingCommission(true);
                    try {
                      const storeRef = doc(firestore, 'stores', adminStore.id);
                      updateDocumentNonBlocking(storeRef, {
                        commissionRate: commissionInput / 100,
                        updatedAt: serverTimestamp()
                      });
                      toast({ title: `Comisión actualizada a ${commissionInput}%`, className: 'bg-emerald-600 text-white' });
                    } finally {
                      setSavingCommission(false);
                    }
                  }}
                  className="h-14 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-xl shadow-emerald-100 shrink-0"
                >
                  {savingCommission ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loadingRequests ? (
          <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
        ) : requests && requests.length > 0 ? (
          <div className="grid gap-10">
            {requests.map((req) => (
              <Card key={req.id} className="border-none rounded-[48px] shadow-sm bg-white overflow-hidden ring-1 ring-black/[0.03]">
                <CardContent className="p-10 space-y-10">
                  {/* Encabezado del Perfil */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-slate-100 rounded-[28px] overflow-hidden relative border-4 border-white shadow-xl">
                        <Image src={req.photoURL || 'https://picsum.photos/seed/user/200'} alt={req.displayName} fill className="object-cover" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">{req.realFullName || req.displayName}</h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-green-500" /> {req.phoneNumber}
                          </p>
                          <div className="w-1 h-1 rounded-full bg-slate-200" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-primary" /> ID: {req.idNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase px-4 h-8">{req.vehicleType}</Badge>
                      {req.vehiclePlate && <Badge className="bg-slate-900 text-white border-none font-black text-[10px] uppercase px-4 h-8">PLACA: {req.vehiclePlate}</Badge>}
                    </div>
                  </div>

                  {/* Galería de Documentos */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { label: 'Frente ID', key: 'docFront' },
                      { label: 'Reverso ID', key: 'docBack' },
                      { label: 'Selfie de Validación', key: 'selfie' }
                    ].map((item) => (
                      <div key={item.key} className="space-y-3 group">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">{item.label}</p>
                        <div className="relative aspect-video rounded-[32px] bg-slate-50 border border-slate-100 overflow-hidden shadow-inner group-hover:shadow-xl transition-all duration-500">
                          {req[item.key] ? (
                            <>
                              <Image src={req[item.key]} alt={item.label} fill className="object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <Button onClick={() => setSelectedImage(req[item.key])} variant="ghost" size="icon" className="bg-white/20 text-white rounded-full hover:bg-white/40"><Maximize2 className="w-5 h-5" /></Button>
                                <Button onClick={() => downloadImage(req[item.key], `${req.id}_${item.key}`)} variant="ghost" size="icon" className="bg-white/20 text-white rounded-full hover:bg-white/40"><Download className="w-5 h-5" /></Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-full text-slate-200"><AlertCircle className="w-10 h-10" /></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Acciones Maestras */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-dashed">
                    <Button onClick={() => handleApprove(req.id)} className="w-full h-16 rounded-[24px] bg-green-500 hover:bg-green-600 text-white font-black uppercase text-sm sm:text-lg tracking-widest gap-3 shadow-xl shadow-green-100">
                      <CheckCircle2 className="w-6 h-6" /> APROBAR ACCESO
                    </Button>
                    <Button onClick={() => handleReject(req.id)} variant="ghost" className="w-full sm:w-auto h-16 px-10 rounded-[24px] text-red-500 font-black uppercase text-[10px] sm:text-xs tracking-widest hover:bg-red-50">
                      <X className="w-4 h-4" /> RECHAZAR SOLICITUD
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[64px] border-2 border-dashed border-slate-100">
            <Truck className="w-20 h-20 mx-auto text-slate-100 mb-6" />
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-300">Sin solicitudes pendientes</h3>
            <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-2">La flota está operando al 100%</p>
          </div>
        )}
      </main>

      {/* Visor de Imagen Full */}
      <Dialog open={!!selectedImage} onOpenChange={(v) => !v && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 border-none bg-black/90 overflow-hidden">
          <DialogHeader className="sr-only"><DialogTitle>Visor de Documentos</DialogTitle></DialogHeader>
          <div className="relative w-full h-[80dvh]">
            {selectedImage && <Image src={selectedImage} alt="Fullscreen" fill className="object-contain" />}
            <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white"><X className="w-6 h-6" /></button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
