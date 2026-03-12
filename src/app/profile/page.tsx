
"use client";

import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { profile, user, isLoading } = useProfile();
  const firestore = useFirestore();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [name, setName] = useState("");
  const [addresses, setAddresses] = useState<string[]>([""]);
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || "");
      setPhone(profile.phoneNumber || "");
      setCapturedImage(profile.photoURL || null);
      
      // Cargar direcciones guardadas o inicializar con una vacía
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
      setHasCameraPermission(true);
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Acceso a Cámara Denegado',
        description: 'Por favor permite el acceso a la cámara en tu navegador para tomar la foto.',
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
        toast({ title: "¡Foto Capturada!", description: "Imagen optimizada correctamente." });
      }
    }
  };

  const handleAddAddress = () => {
    setAddresses([...addresses, ""]);
  };

  const handleRemoveAddress = (index: number) => {
    if (addresses.length > 1) {
      const newAddresses = addresses.filter((_, i) => i !== index);
      setAddresses(newAddresses);
    } else {
      setAddresses([""]);
    }
  };

  const handleAddressChange = (index: number, value: string) => {
    const newAddresses = [...addresses];
    newAddresses[index] = value;
    setAddresses(newAddresses);
  };

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
        address: cleanAddresses[0] || "", // Compatibilidad con versiones anteriores
        phoneNumber: phone,
        updatedAt: serverTimestamp(),
      };

      if (capturedImage && capturedImage.startsWith('data:')) {
        data.photoURL = capturedImage;
      }

      updateDocumentNonBlocking(userRef, data);
      toast({
        title: "Perfil Actualizado",
        description: "Tus datos han sido sincronizados en la nube.",
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
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-primary rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-primary/20">
            <UserIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Mi Perfil</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Configuración Maestra de Cuenta</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none rounded-[40px] shadow-sm overflow-hidden bg-white">
            <CardHeader className="text-center pb-2">
              <div className="relative mx-auto w-40 h-40 mb-6 group">
                <Avatar className="w-40 h-40 border-4 border-white shadow-2xl">
                  <AvatarImage src={capturedImage || ""} className="object-cover" />
                  <AvatarFallback className="bg-slate-100 text-slate-300">
                    <UserIcon className="w-16 h-16" />
                  </AvatarFallback>
                </Avatar>
                <Button 
                  onClick={showCamera ? stopCamera : startCamera}
                  size="icon" 
                  className="absolute bottom-2 right-2 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl h-12 w-12 border-4 border-white transition-transform active:scale-90"
                >
                  {showCamera ? <X className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                </Button>
              </div>
              <CardTitle className="text-2xl font-black italic">{name || user?.displayName}</CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest font-black text-slate-400">{user?.email}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 p-8 pt-4">
              
              {showCamera && (
                <div className="space-y-4 animate-in fade-in zoom-in duration-500 bg-slate-900 p-4 rounded-[32px] mb-6">
                  <div className="relative aspect-square max-w-[320px] mx-auto rounded-3xl overflow-hidden bg-black shadow-2xl border-4 border-white/10">
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover scale-x-[-1]" 
                      autoPlay 
                      muted 
                      playsInline 
                    />
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={capturePhoto} className="rounded-full bg-green-500 hover:bg-green-600 text-white font-black px-10 h-14 gap-2 shadow-lg shadow-green-500/20">
                      <Camera className="w-5 h-5" /> Capturar Foto
                    </Button>
                    <Button onClick={stopCamera} variant="outline" className="rounded-full px-8 h-14 border-white/10 text-white hover:bg-white/10">
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-8">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Nombre de Exhibición</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre para la vitrina"
                      className="h-16 rounded-[24px] bg-slate-50 border-none pl-14 font-black text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all text-base"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">WhatsApp (Contacto de Ventas)</Label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 318 992 5503"
                      className="h-16 rounded-[24px] bg-slate-50 border-none pl-14 font-black text-slate-800 focus:ring-4 focus:ring-green-500/10 transition-all text-base"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 ml-1 font-bold uppercase italic leading-tight">* Este número se usará para que los clientes te contacten.</p>
                </div>

                <div className="space-y-4">
                  <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Dirección Física / Despacho</Label>
                  <div className="space-y-4">
                    {addresses.map((addr, idx) => (
                      <div key={idx} className="relative group animate-in slide-in-from-left-2 duration-300">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 z-10" />
                        <Input 
                          value={addr} 
                          onChange={(e) => handleAddressChange(idx, e.target.value)}
                          placeholder="Ej: Calle 50 No 23-22, Aguachica"
                          className="h-16 rounded-[24px] bg-slate-50 border-none pl-14 pr-12 font-black text-slate-800 focus:ring-4 focus:ring-red-500/10 transition-all text-base"
                        />
                        {addresses.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveAddress(idx)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 pointer-events-none group-focus-within:text-primary transition-colors mr-10" />
                      </div>
                    ))}
                  </div>

                  {/* Botón Verde Circular para añadir direcciones */}
                  <div className="flex justify-center pt-2">
                    <Button 
                      onClick={handleAddAddress}
                      size="icon"
                      className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-100 border-none transition-transform active:scale-90"
                    >
                      <Plus className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-10">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="w-full h-16 rounded-[28px] bg-primary hover:bg-primary/90 text-white text-lg font-black gap-3 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95"
                >
                  {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> Sincronizar Mi Perfil</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
