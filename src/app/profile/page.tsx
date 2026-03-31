"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  Camera, 
  User as UserIcon, 
  MapPin, 
  Phone, 
  Save, 
  Loader2, 
  X, 
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Link2,
  CheckCircle2
} from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, collection, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Loader } from '@googlemaps/js-api-loader';
import { useRouter } from 'next/navigation';

function cleanGoogleMapsOverlays() {
  if (typeof document === 'undefined') return;
  const selectors = ['.gm-err-container', '.gm-err-content', '.gm-style-cc', '.gm-style-moc', '.gm-style-mtc', '.gm-err-autocomplete', '.pac-container'];
  selectors.forEach(selector => { document.querySelectorAll(selector).forEach(el => el.remove()); });
}

function AddressAutocompleteInput({ value, onChange, onRemove, canRemove, mapsEnabled }: { value: string; onChange: (value: string) => void; onRemove: () => void; canRemove: boolean; mapsEnabled: boolean; }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [mapsError, setMapsError] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!mapsEnabled || !apiKey || !inputRef.current) return;
    const loader = new Loader({ apiKey: apiKey, version: "weekly", libraries: ["places"] });
    loader.load().then(() => {
      if (!inputRef.current || !mapsEnabled) return;
      try {
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, { componentRestrictions: { country: "co" }, fields: ["formatted_address", "geometry"], types: ["address"] });
        autocompleteRef.current.addListener("place_changed", () => { const place = autocompleteRef.current?.getPlace(); if (place?.formatted_address) { onChange(place.formatted_address); } });
      } catch (error) { setMapsError(true); }
    }).catch(() => { setMapsError(true); });
  }, [mapsEnabled, onChange]);

  return (
    <div className="relative group">
      <MapPin className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 z-10 ${mapsEnabled ? 'text-primary' : 'text-slate-400'}`} />
      <Input ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)} placeholder={mapsEnabled ? "Busca tu dirección..." : "Escribe tu dirección..."} className="h-16 rounded-[24px] bg-slate-50 border-none pl-14 pr-12 font-black text-slate-800" />
      {canRemove && ( <Button variant="ghost" size="icon" onClick={onRemove} className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-slate-300 hover:text-red-500 transition-all" > <Trash2 className="w-4 h-4" /> </Button> )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { profile, user, isLoading } = useProfile();
  const firestore = useFirestore();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [name, setName] = useState("");
  const [addresses, setAddresses] = useState<string[]>([""]);
  const [phone, setPhone] = useState("");
  const [driverCode, setDriverCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mapsEnabled, setMapsEnabled] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || "");
      setPhone(profile.phoneNumber || "");
      setCapturedImage(profile.photoURL || null);
      if (profile.addresses?.length > 0) setAddresses(profile.addresses);
      else if (profile.address) setAddresses([profile.address]);
    }
  }, [profile]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (error) { toast({ variant: 'destructive', title: 'Error de Cámara' }); }
  };

  const handleLinkDriver = async () => {
    if (!driverCode.trim() || !user || !firestore) return;
    setIsLinking(true);
    try {
      const q = query(collection(firestore, 'stores'), where('driverCode', '==', driverCode.toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ title: "Código Inválido", variant: "destructive" });
      } else {
        const storeDoc = snap.docs[0];
        const storeRef = doc(firestore, 'stores', storeDoc.id);
        const userRef = doc(firestore, 'users', user.uid);
        
        await updateDocumentNonBlocking(storeRef, { privateDrivers: arrayUnion(user.uid) });
        await updateDocumentNonBlocking(userRef, { role: 'repartidor', linkedStoreId: storeDoc.id });
        
        toast({ title: "¡Vinculación Exitosa!", description: `Ahora eres repartidor de ${storeDoc.data().name}` });
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
      const data: any = { displayName: name, addresses: cleanAddresses, address: cleanAddresses[0] || "", phoneNumber: phone, updatedAt: serverTimestamp() };
      if (capturedImage?.startsWith('data:')) data.photoURL = capturedImage;
      updateDocumentNonBlocking(userRef, data);
      toast({ title: "Perfil Actualizado" });
    } catch (e) { toast({ title: "Error al Guardar", variant: "destructive" }); } finally { setIsSaving(false); }
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
          <div><h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Mi Perfil</h1><p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Configuración Personal</p></div>
        </div>

        <div className="space-y-8">
          {/* SECCIÓN VINCULACIÓN REPARTIDOR (EXCLUSIVO) */}
          <Card className="border-none rounded-[40px] bg-slate-900 text-white p-8 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Link2 className="w-5 h-5" />
                <h3 className="font-black text-sm uppercase tracking-widest">¿Eres Repartidor Personal?</h3>
              </div>
              <p className="text-slate-400 text-xs font-bold leading-relaxed">Si trabajas para una tienda de lavadoras, ingresa el código que te dio el dueño para vincularte instantáneamente.</p>
              <div className="flex gap-2">
                <Input 
                  value={driverCode} 
                  onChange={(e) => setDriverCode(e.target.value.toUpperCase())}
                  placeholder="CÓDIGO" 
                  className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-black text-center tracking-[0.3em]"
                />
                <Button onClick={handleLinkDriver} disabled={isLinking || !driverCode} className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest gap-2">
                  {isLinking ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> VINCULAR</>}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-none rounded-[48px] shadow-2xl overflow-hidden bg-white p-10">
            <div className="space-y-10">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400">Nombre Público</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400">WhatsApp</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" />
              </div>
              <div className="space-y-6">
                <Label className="text-[10px] font-black uppercase text-slate-400">Mis Direcciones</Label>
                <div className="space-y-4">
                  {addresses.map((addr, idx) => (
                    <AddressAutocompleteInput key={idx} value={addr} onChange={(val) => { const n = [...addresses]; n[idx] = val; setAddresses(n); }} onRemove={() => setAddresses(addresses.filter((_, i) => i !== idx))} canRemove={addresses.length > 1} mapsEnabled={mapsEnabled} />
                  ))}
                </div>
                <Button onClick={() => setAddresses([...addresses, ""])} variant="ghost" className="w-full h-14 rounded-[24px] border-2 border-dashed border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-widest"><Plus className="w-4 h-4 mr-2" /> Agregar Otra Dirección</Button>
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="w-full h-20 rounded-[32px] bg-primary text-white text-xl font-black gap-4 shadow-2xl active:scale-95 uppercase italic">
                {isSaving ? <Loader2 className="animate-spin" /> : "Guardar Perfil"}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
