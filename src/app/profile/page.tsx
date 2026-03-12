
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
  Settings2
} from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Loader } from '@googlemaps/js-api-loader';

// Componente individual para cada input de dirección con Autocomplete opcional
function AddressAutocompleteInput({ 
  value, 
  onChange, 
  onRemove, 
  canRemove,
  mapsEnabled
}: { 
  value: string; 
  onChange: (value: string) => void; 
  onRemove: () => void; 
  canRemove: boolean;
  mapsEnabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [mapsError, setMapsError] = useState(false);

  useEffect(() => {
    // Si los mapas no están activados o no hay clave, no intentamos nada
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!mapsEnabled || !apiKey || !inputRef.current) return;

    const loader = new Loader({
      apiKey: apiKey,
      version: "weekly",
      libraries: ["places"]
    });

    loader.load().then(() => {
      if (!inputRef.current || !mapsEnabled) return;
      
      try {
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "co" },
          fields: ["formatted_address", "geometry"],
          types: ["address"]
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            onChange(place.formatted_address);
          }
        });
      } catch (error) {
        setMapsError(true);
      }
    }).catch(() => {
      setMapsError(true);
    });

    // Limpieza al desmontar: Eliminar avisos de Google que quedan en el body
    return () => {
      const overlays = document.querySelectorAll('.gm-err-container, .gm-style-cc, .gm-style-moc');
      overlays.forEach(el => el.remove());
    };
  }, [mapsEnabled, onChange]);

  return (
    <div className="relative group animate-in slide-in-from-left-2 duration-300">
      <MapPin className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 z-10 ${mapsEnabled && !mapsError ? 'text-primary' : 'text-slate-400'}`} />
      <Input 
        ref={inputRef}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={mapsEnabled && !mapsError ? "Busca tu dirección exacta..." : "Escribe tu dirección (Modo Manual)..."}
        className={`h-16 rounded-[24px] bg-slate-50 border-none pl-14 pr-12 font-black text-slate-800 focus:ring-4 transition-all text-base ${mapsEnabled && !mapsError ? 'focus:ring-primary/10' : 'focus:ring-slate-200'}`}
      />
      {canRemove && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onRemove}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
      {mapsEnabled && mapsError && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2" title="Error de Google Maps. Revisa tu facturación.">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        </div>
      )}
      {mapsEnabled && !mapsError && (
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 pointer-events-none group-focus-within:text-primary transition-colors" />
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { profile, user, isLoading } = useProfile();
  const firestore = useFirestore();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [name, setName] = useState("");
  const [addresses, setAddresses] = useState<string[]>([""]);
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mapsEnabled, setMapsEnabled] = useState(false); // Por defecto desactivado para evitar el aviso molesto

  // Limpieza global al entrar y salir para asegurar que no hay avisos de Google Maps
  useEffect(() => {
    const cleanOverlays = () => {
      const overlays = document.querySelectorAll('.gm-err-container, .gm-style-cc, .gm-style-moc');
      overlays.forEach(el => el.remove());
    };
    
    cleanOverlays();
    return () => cleanOverlays();
  }, [mapsEnabled]);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || "");
      setPhone(profile.phoneNumber || "");
      setCapturedImage(profile.photoURL || null);
      
      if (profile.addresses && Array.isArray(profile.addresses) && profile.addresses.length > 0) {
        setAddresses(profile.addresses);
      } else if (profile.address) {
        setAddresses([profile.address]);
      } else {
        setAddresses([""]);
      }
    }
  }, [profile]);

  useEffect(() => {
    if (showCamera && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1024 },
          height: { ideal: 1024 }
        } 
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Acceso a Cámara Denegado',
        description: 'Por favor permite el acceso a la cámara.',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        stopCamera();
        toast({ title: "¡Foto Capturada!" });
      }
    }
  };

  const handleAddAddress = () => setAddresses([...addresses, ""]);

  const handleRemoveAddress = (index: number) => {
    if (addresses.length > 1) {
      setAddresses(addresses.filter((_, i) => i !== index));
    } else {
      setAddresses([""]);
    }
  };

  const handleAddressChange = useCallback((index: number, value: string) => {
    setAddresses(prev => {
      const newAddresses = [...prev];
      newAddresses[index] = value;
      return newAddresses;
    });
  }, []);

  const handleSave = async () => {
    if (!user || !firestore) return;
    
    if (phone && phone.trim().length < 10) {
      toast({
        variant: "destructive",
        title: "Número Inválido",
        description: "El número debe tener al menos 10 dígitos.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const cleanAddresses = addresses.filter(a => a.trim() !== "");
      
      const data: any = {
        displayName: name,
        addresses: cleanAddresses,
        address: cleanAddresses[0] || "",
        phoneNumber: phone,
        updatedAt: serverTimestamp(),
      };

      if (capturedImage && capturedImage.startsWith('data:')) {
        data.photoURL = capturedImage;
      }

      updateDocumentNonBlocking(userRef, data);
      toast({
        title: "Perfil Actualizado",
        description: "Tus datos han sido sincronizados.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error al Guardar",
        description: "No se pudieron actualizar los datos.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-primary/30">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Mi Perfil</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 ml-1">Personaliza tu experiencia</p>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="border-none rounded-[48px] shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="text-center pb-2 pt-10">
              <div className="relative mx-auto w-44 h-44 mb-8 group">
                <Avatar className="w-44 h-44 border-[6px] border-white shadow-2xl ring-1 ring-slate-100">
                  <AvatarImage src={capturedImage || ""} className="object-cover" />
                  <AvatarFallback className="bg-slate-50 text-slate-200">
                    <UserIcon className="w-20 h-20" />
                  </AvatarFallback>
                </Avatar>
                <Button 
                  onClick={showCamera ? stopCamera : startCamera}
                  size="icon" 
                  className="absolute bottom-2 right-2 rounded-full bg-primary hover:bg-primary/90 text-white shadow-2xl h-14 w-14 border-[4px] border-white transition-transform active:scale-90"
                >
                  {showCamera ? <X className="w-7 h-7" /> : <Camera className="w-7 h-7" />}
                </Button>
              </div>
              <CardTitle className="text-3xl font-black italic tracking-tighter">{name || user?.displayName || 'Usuario Vitriniando'}</CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-300 mt-2">{user?.email}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8 p-10 pt-4">
              
              {showCamera && (
                <div className="space-y-6 animate-in fade-in zoom-in duration-500 bg-slate-900 p-6 rounded-[40px] mb-8 shadow-2xl">
                  <div className="relative aspect-square max-w-[320px] mx-auto rounded-[32px] overflow-hidden bg-black shadow-inner border-4 border-white/10">
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover scale-x-[-1]" 
                      autoPlay 
                      muted 
                      playsInline 
                    />
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={capturePhoto} className="rounded-full bg-green-500 hover:bg-green-600 text-white font-black px-12 h-16 gap-3 shadow-xl shadow-green-500/20 text-lg uppercase tracking-tighter italic">
                      <Camera className="w-6 h-6" /> Tomar Foto
                    </Button>
                    <Button onClick={stopCamera} variant="ghost" className="rounded-full px-8 h-16 text-white/50 hover:bg-white/10 hover:text-white font-bold">
                      Cerrar
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Nombre Público</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre en la vitrina"
                      className="h-18 rounded-[28px] bg-slate-50 border-none pl-16 font-black text-slate-800 focus:ring-8 focus:ring-primary/5 transition-all text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">WhatsApp de Contacto</Label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 300 000 0000"
                      className="h-18 rounded-[28px] bg-slate-50 border-none pl-16 font-black text-slate-800 focus:ring-8 focus:ring-green-500/5 transition-all text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Direcciones de Despacho</Label>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border">
                      <Sparkles className={`w-3 h-3 ${mapsEnabled ? 'text-primary' : 'text-slate-300'}`} />
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Modo Mapa</span>
                      <Switch 
                        checked={mapsEnabled} 
                        onCheckedChange={setMapsEnabled}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {addresses.map((addr, idx) => (
                      <AddressAutocompleteInput 
                        key={idx}
                        value={addr}
                        onChange={(val) => handleAddressChange(idx, val)}
                        onRemove={() => handleRemoveAddress(idx)}
                        canRemove={addresses.length > 1}
                        mapsEnabled={mapsEnabled}
                      />
                    ))}
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button 
                      onClick={handleAddAddress}
                      size="icon"
                      className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-2xl shadow-green-500/20 border-none transition-transform active:scale-90"
                    >
                      <Plus className="w-8 h-8" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-12">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="w-full h-20 rounded-[32px] bg-primary hover:bg-primary/90 text-white text-xl font-black gap-4 shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02] active:scale-95 uppercase italic tracking-tighter"
                >
                  {isSaving ? <Loader2 className="w-8 h-8 animate-spin" /> : <><Save className="w-8 h-8" /> Guardar Perfil</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
