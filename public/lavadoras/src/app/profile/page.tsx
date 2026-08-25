"use client";

import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User as UserIcon, 
  MapPin, 
  Loader2, 
  Plus,
  Trash2,
  ArrowLeft,
  Link2,
  CheckCircle2,
  ShieldCheck,
  Waves,
  ArrowRight,
  ChevronRight,
  XCircle,
  BookOpen,
  LineChart,
  Key,
  Copy,
  Check
} from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useFirestore, updateDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, collection, query, where, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthService';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, user, isLoading, isOwner } = useProfile();
  const { getRecoveryCode } = useAuth();
  const firestore = useFirestore();
  
  const [name, setName] = useState("");
  const [addresses, setAddresses] = useState<string[]>([""]);
  const [phone, setPhone] = useState("");
  const [driverCode, setDriverCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [copied, setCopied] = useState(false);

  const recoveryCode = getRecoveryCode();

  const linkedStoreRef = useMemoFirebase(() => 
    (!firestore || !profile?.linkedStoreId) ? null : doc(firestore, 'stores', profile.linkedStoreId), 
    [firestore, profile?.linkedStoreId]
  );
  const { data: linkedStore, isLoading: loadingLinkedStore } = useDoc(linkedStoreRef);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || "");
      setPhone(profile.phoneNumber || "");
      if (profile.addresses?.length > 0) setAddresses(profile.addresses);
      else if (profile.address) setAddresses([profile.address]);
    }
  }, [profile]);

  const handleLinkDriver = async () => {
    if (!driverCode.trim() || !user || !firestore) return;
    setIsLinking(true);
    try {
      const q = query(
        collection(firestore, 'stores'), 
        where('driverCode', '==', driverCode.toUpperCase()),
        where('status', '==', 'active')
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ title: "Código Inválido", variant: "destructive" });
      } else {
        const storeDoc = snap.docs[0];
        const storeRef = doc(firestore, 'stores', storeDoc.id);
        const userRef = doc(firestore, 'users', user.uid);
        
        updateDocumentNonBlocking(storeRef, { privateDrivers: arrayUnion(user.uid) });
        updateDocumentNonBlocking(userRef, { 
          role: 'repartidor', 
          linkedStoreId: storeDoc.id, 
          updatedAt: serverTimestamp(),
          deliveryActive: true 
        });
        
        toast({ title: "¡Vinculación Exitosa!", className: "bg-green-600 text-white" });
        setDriverCode("");
        setTimeout(() => router.push('/delivery/dashboard'), 1500);
      }
    } catch (e) {
      toast({ title: "Error al vincular", variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!user || !firestore || !profile?.linkedStoreId) return;
    setIsUnlinking(true);
    try {
      const storeRef = doc(firestore, 'stores', profile.linkedStoreId);
      const userRef = doc(firestore, 'users', user.uid);
      updateDocumentNonBlocking(storeRef, { privateDrivers: arrayRemove(user.uid) });
      updateDocumentNonBlocking(userRef, { linkedStoreId: null, role: 'cliente', updatedAt: serverTimestamp() });
      toast({ title: "Vinculación terminada" });
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleSave = async () => {
    if (!user || !firestore) return;
    setIsSaving(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const cleanAddresses = addresses.filter(a => a.trim() !== "");
      updateDocumentNonBlocking(userRef, { 
        displayName: name, 
        addresses: cleanAddresses, 
        address: cleanAddresses[0] || "", 
        phoneNumber: phone, 
        updatedAt: serverTimestamp() 
      });
      toast({ title: "Perfil Actualizado" });
    } finally { 
      setIsSaving(false); 
    }
  };

  if (isLoading) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-6 gap-2 text-slate-400 font-bold hover:text-primary p-0 h-auto group transition-colors">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
        </Button>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center text-white shadow-2xl"><UserIcon className="w-8 h-8" /></div>
          <div><h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-slate-900">Mi Perfil</h1><p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Gestión Maestro</p></div>
        </div>

        <div className="space-y-8 pb-20">
          {profile?.linkedStoreId ? (
            <Card className="border-none rounded-[40px] bg-slate-900 text-white p-8 shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-primary">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="font-black text-sm uppercase tracking-widest italic">Flota Privada Activa</h3>
                  </div>
                  <Badge className="bg-green-500 text-white border-none rounded-full px-4 h-7 text-[8px] font-black uppercase animate-pulse">VINCULADO</Badge>
                </div>

                <Link href={profile.role === 'repartidor' ? '/delivery/dashboard' : `/admin/washer/${profile.linkedStoreId}`} className="block">
                  <div className="flex items-center justify-between gap-3 p-4 rounded-[24px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all shadow-inner group/card overflow-hidden">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-lg shrink-0">
                        {loadingLinkedStore ? <Loader2 className="w-5 h-5 animate-spin" /> : <Waves className="w-5 h-5 animate-pulse" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">EQUIPO DE</p>
                        <h4 className="text-base font-black italic uppercase tracking-tight leading-tight text-white group-hover/card:text-primary transition-colors truncate">{linkedStore?.name || 'Cargando...'}</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{linkedStore?.address || 'Ubicación vinculada'}</span>
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover/card:text-white group-hover/card:translate-x-1 transition-all shrink-0" />
                  </div>
                </Link>

                <div className="flex justify-center pt-2">
                  <Button onClick={handleUnlink} disabled={isUnlinking} variant="ghost" className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 font-black text-[9px] uppercase tracking-[0.3em] h-10 px-6 rounded-full transition-all">
                    {isUnlinking ? <Loader2 className="w-3 h-3 animate-spin" /> : "DESVINCULAR DE EMPRESA"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="border-none rounded-[40px] bg-slate-900 text-white p-8 shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3 text-primary"><Link2 className="w-5 h-5" /><h3 className="font-black text-sm uppercase tracking-widest">¿Eres Repartidor Personal?</h3></div>
                <p className="text-slate-400 text-xs font-bold leading-relaxed">Ingresa el código único de la tienda para vincularte a su flota privada.</p>
                <div className="flex gap-2">
                  <Input value={driverCode} onChange={(e) => setDriverCode(e.target.value.toUpperCase())} placeholder="INGRESA CÓDIGO" className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-black text-center tracking-[0.3em] uppercase" />
                  <Button onClick={handleLinkDriver} disabled={isLinking || !driverCode} className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest gap-2 shadow-xl">
                    {isLinking ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> VINCULAR</>}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card className="border-none rounded-[32px] shadow-xl overflow-hidden bg-white p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Público</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-sm px-4" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp de contacto</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="300 000 0000" className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-sm px-4" />
            </div>

            {/* Código de acceso de 6 dígitos - Único por cuenta */}
            {recoveryCode && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                  <Key className="w-3 h-3" />
                  Código de acceso (6 dígitos)
                </Label>
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <code className="flex-1 text-xl font-mono font-bold text-primary tracking-widest select-all bg-white px-3 py-2 rounded border border-slate-200 text-center">{recoveryCode}</code>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => {
                      navigator.clipboard.writeText(recoveryCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="h-10 w-10 shrink-0"
                    aria-label={copied ? "Copiado" : "Copiar código"}
                  >
                    {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Guarda este código. Te permite ingresar a tu cuenta en cualquier dispositivo sin contraseña.
                </p>
              </div>
            )}

            <Button onClick={handleSave} disabled={isSaving} className="w-full h-12 rounded-2xl bg-primary text-white text-xs font-black gap-2 shadow-lg active:scale-95 uppercase tracking-widest">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualizar Mi Perfil"}
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
