
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
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProfilePage() {
  const { profile, user, isLoading } = useProfile();
  const firestore = useFirestore();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || "");
      setAddress(profile.address || "");
      setPhone(profile.phoneNumber || "");
      setCapturedImage(profile.photoURL || null);
    }
  }, [profile]);

  // Manejador para conectar el stream al video cuando se abre la cámara
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
      
      // Ajustar canvas al tamaño del video real
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Dibujar el frame actual
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Comprimir a JPEG con calidad 0.8 (Balance perfecto)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
        toast({ 
          title: "¡Foto Capturada!", 
          description: "La imagen se ha procesado y optimizado correctamente." 
        });
      }
    }
  };

  const handleSave = async () => {
    if (!user || !firestore) return;
    
    if (phone && phone.trim().length < 10) {
      toast({
        variant: "destructive",
        title: "Número Inválido",
        description: "El número de WhatsApp debe tener al menos 10 dígitos.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const data: any = {
        displayName: name,
        address: address,
        phoneNumber: phone,
        updatedAt: serverTimestamp(),
      };

      if (capturedImage && capturedImage.startsWith('data:')) {
        data.photoURL = capturedImage;
      }

      updateDocumentNonBlocking(userRef, data);
      toast({
        title: "Perfil Actualizado",
        description: "Tus datos han sido guardados en la nube con éxito.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error al Guardar",
        description: "No se pudieron actualizar los datos del perfil.",
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
                <div className="space-y-4 animate-in fade-in zoom-in duration-500 bg-slate-900 p-4 rounded-[32px]">
                  <div className="relative aspect-square max-w-[320px] mx-auto rounded-3xl overflow-hidden bg-black shadow-2xl border-4 border-white/10">
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover scale-x-[-1]" 
                      autoPlay 
                      muted 
                      playsInline 
                    />
                    <div className="absolute inset-0 border-[12px] border-white/5 rounded-3xl pointer-events-none" />
                  </div>
                  
                  {hasCameraPermission === false && (
                    <Alert variant="destructive" className="rounded-2xl border-none bg-red-500/10 text-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Cámara No Disponible</AlertTitle>
                      <AlertDescription>Habilita los permisos en el candado de la barra de direcciones.</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={capturePhoto} 
                      className="rounded-full bg-green-500 hover:bg-green-600 text-white font-black px-10 h-14 gap-2 shadow-lg shadow-green-500/20"
                    >
                      <Camera className="w-5 h-5" /> Capturar Foto
                    </Button>
                    <Button 
                      onClick={stopCamera} 
                      variant="outline" 
                      className="rounded-full px-8 h-14 border-white/10 text-white hover:bg-white/10"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nombre de Exhibición</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre para la vitrina"
                      className="h-14 rounded-2xl bg-slate-50 border-none pl-12 font-bold focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">WhatsApp (Contacto de Ventas)</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 3001234567"
                      className="h-14 rounded-2xl bg-slate-50 border-none pl-12 font-bold focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 ml-4 font-bold uppercase italic">* Este número se usará para que los clientes te contacten.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Dirección Física / Despacho</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    <Input 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Calle, Barrio, Ciudad..."
                      className="h-14 rounded-2xl bg-slate-50 border-none pl-12 font-bold focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="w-full h-16 rounded-[24px] bg-primary hover:bg-primary/90 text-white text-lg font-black gap-3 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95"
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
