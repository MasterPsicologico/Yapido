
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
  RefreshCw
} from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';
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

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || "");
      setAddress(profile.address || "");
      setPhone(profile.phoneNumber || "");
      setCapturedImage(profile.photoURL || null);
    }
  }, [profile]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setHasCameraPermission(true);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Acceso a Cámara Denegado',
        description: 'Por favor permite el acceso a la cámara en tu navegador.',
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        stopCamera();
        toast({ title: "Foto capturada", description: "La imagen se ha procesado correctamente." });
      }
    }
  };

  const handleSave = async () => {
    if (!user || !firestore) return;
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
        description: "Tus datos han sido guardados correctamente.",
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
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Personaliza tu experiencia Morrocoyera</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none rounded-[32px] shadow-sm overflow-hidden bg-white">
            <CardHeader className="text-center pb-2">
              <div className="relative mx-auto w-32 h-32 mb-4 group">
                <Avatar className="w-32 h-32 border-4 border-slate-50 shadow-inner">
                  <AvatarImage src={capturedImage || ""} />
                  <AvatarFallback className="bg-slate-100 text-slate-400">
                    <UserIcon className="w-12 h-12" />
                  </AvatarFallback>
                </Avatar>
                <Button 
                  onClick={showCamera ? stopCamera : startCamera}
                  size="icon" 
                  className="absolute bottom-0 right-0 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg h-10 w-10 border-4 border-white"
                >
                  {showCamera ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                </Button>
              </div>
              <CardTitle className="text-xl font-black italic">{user?.displayName}</CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest font-bold text-slate-400">{user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8 pt-4">
              
              {showCamera && (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="relative aspect-square max-w-[300px] mx-auto rounded-3xl overflow-hidden bg-black shadow-2xl">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <div className="absolute inset-0 border-[8px] border-white/20 rounded-3xl pointer-events-none" />
                  </div>
                  
                  {hasCameraPermission === false && (
                    <Alert variant="destructive" className="rounded-2xl">
                      <AlertTitle>Cámara Bloqueada</AlertTitle>
                      <AlertDescription>Por favor habilita los permisos en tu navegador.</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex gap-2 justify-center">
                    <Button onClick={capturePhoto} className="rounded-full bg-green-500 hover:bg-green-600 text-white font-black px-8 h-12 gap-2">
                      <Camera className="w-5 h-5" /> Tomar Foto
                    </Button>
                    <Button onClick={stopCamera} variant="outline" className="rounded-full px-6 h-12 border-slate-200">
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nombre Público</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="h-14 rounded-2xl bg-slate-50 border-none pl-12 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Número de WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 300 123 4567"
                      className="h-14 rounded-2xl bg-slate-50 border-none pl-12 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Dirección de Entrega / Local</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    <Input 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Calle, Barrio, Detalles..."
                      className="h-14 rounded-2xl bg-slate-50 border-none pl-12 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="w-full h-16 rounded-[22px] bg-primary hover:bg-primary/90 text-white text-lg font-black gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                >
                  {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> Guardar Perfil</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
