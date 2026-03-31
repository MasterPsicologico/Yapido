
"use client";

import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  User as UserIcon, 
  MapPin, 
  Loader2, 
  Plus,
  Trash2,
  ArrowLeft,
  Link2,
  CheckCircle2
} from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, collection, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, user, isLoading } = useProfile();
  const firestore = useFirestore();
  
  const [name, setName] = useState("");
  const [addresses, setAddresses] = useState<string[]>([""]);
  const [phone, setPhone] = useState("");
  const [driverCode, setDriverCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

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
      const q = query(collection(firestore, 'stores'), where('driverCode', '==', driverCode.toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ title: "Código Inválido", description: "Verifica el código con el dueño del negocio.", variant: "destructive" });
      } else {
        const storeDoc = snap.docs[0];
        const storeRef = doc(firestore, 'stores', storeDoc.id);
        const userRef = doc(firestore, 'users', user.uid);
        
        // Vincular en ambos sentidos
        updateDocumentNonBlocking(storeRef, { privateDrivers: arrayUnion(user.uid) });
        updateDocumentNonBlocking(userRef, { role: 'repartidor', linkedStoreId: storeDoc.id, updatedAt: serverTimestamp() });
        
        toast({ 
          title: "¡Vinculación Exitosa!", 
          description: `Ahora eres repartidor de ${storeDoc.data().name}`,
          className: "bg-green-600 text-white border-none"
        });
        setDriverCode("");
      }
    } catch (e) {
      toast({ title: "Error al vincular", variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  const handleSave = async () => {
    if (!user || !firestore) return;
    setIsSaving(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const cleanAddresses = addresses.filter(a => a.trim() !== "");
      const data: any = { 
        displayName: name, 
        addresses: cleanAddresses, 
        address: cleanAddresses[0] || "", 
        phoneNumber: phone, 
        updatedAt: serverTimestamp() 
      };
      updateDocumentNonBlocking(userRef, data);
      toast({ title: "Perfil Actualizado" });
    } catch (e) { 
      toast({ title: "Error al Guardar", variant: "destructive" }); 
    } finally { 
      setIsSaving(false); 
    }
  };

  if (isLoading) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2 text-slate-400 font-bold hover:text-primary p-0 h-auto">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center text-white shadow-2xl"><UserIcon className="w-8 h-8" /></div>
          <div><h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Mi Perfil</h1><p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Gestión de Cuenta</p></div>
        </div>

        <div className="space-y-8 pb-20">
          {/* SECCIÓN VINCULACIÓN: EXCLUSIVO REPARTIDORES */}
          <Card className="border-none rounded-[40px] bg-slate-900 text-white p-8 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Link2 className="w-5 h-5" />
                <h3 className="font-black text-sm uppercase tracking-widest">¿Eres Repartidor Personal?</h3>
              </div>
              <p className="text-slate-400 text-xs font-bold leading-relaxed">
                Si trabajas para una tienda de lavadoras, ingresa el código único proporcionado por el dueño para vincularte instantáneamente a su flota privada.
              </p>
              <div className="flex gap-2">
                <Input 
                  value={driverCode} 
                  onChange={(e) => setDriverCode(e.target.value.toUpperCase())}
                  placeholder="INGRESA CÓDIGO" 
                  className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-black text-center tracking-[0.3em] uppercase"
                />
                <Button 
                  onClick={handleLinkDriver} 
                  disabled={isLinking || !driverCode} 
                  className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest gap-2 shadow-xl"
                >
                  {isLinking ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> VINCULAR</>}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-none rounded-[48px] shadow-2xl overflow-hidden bg-white p-10 space-y-10">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre Público</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg px-6" />
            </div>
            
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">WhatsApp de contacto</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="300 000 0000" className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg px-6" />
            </div>

            <div className="space-y-6">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Mis Direcciones Guardadas</Label>
              <div className="space-y-4">
                {addresses.map((addr, idx) => (
                  <div key={idx} className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary z-10" />
                    <Input 
                      value={addr} 
                      onChange={(e) => {
                        const n = [...addresses];
                        n[idx] = e.target.value;
                        setAddresses(n);
                      }} 
                      placeholder="Dirección exacta..." 
                      className="h-16 rounded-[24px] bg-slate-50 border-none pl-14 pr-12 font-black" 
                    />
                    {addresses.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setAddresses(addresses.filter((_, i) => i !== idx))} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={() => setAddresses([...addresses, ""])} variant="ghost" className="w-full h-14 rounded-[24px] border-2 border-dashed border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                <Plus className="w-4 h-4 mr-2" /> Agregar Otra Dirección
              </Button>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full h-20 rounded-[32px] bg-primary text-white text-xl font-black gap-4 shadow-2xl active:scale-95 uppercase italic tracking-tighter">
              {isSaving ? <Loader2 className="animate-spin" /> : "Actualizar Mi Perfil"}
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
