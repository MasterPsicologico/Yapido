
"use client";

import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Truck, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Loader2, 
  ScrollText, 
  Camera, 
  ImageIcon, 
  X, 
  User as UserIcon,
  CreditCard,
  FileText,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useProfile } from '@/firebase/auth/use-profile';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { compressImage } from '@/lib/image-compression';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function DeliveryRegisterPage() {
  const { user } = useUser();
  const { profile } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  
  // Refs para navegación y enfoque
  const termsRef = useRef<HTMLDivElement>(null);
  
  // Datos del Formulario
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<"moto" | "bici" | "carro" | "">("");
  const [plate, setPlate] = useState("");
  
  // Documentos en Base64
  const [docFront, setDocFront] = useState<string | null>(null);
  const [docBack, setDocBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.displayName || "");
    }
    if (profile?.role === 'repartidor' || profile?.deliveryRequested) {
      router.push('/delivery/dashboard');
    }
  }, [profile, router]);

  const handleLockedClick = () => {
    if (!acceptedTerms) {
      // 1. Scroll hacia arriba profesional
      termsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // 2. Activar iluminación de alerta
      setShowTermsError(true);
      
      // 3. Feedback táctil (vibración si está disponible)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }

      toast({
        title: "Acción Requerida",
        description: "Acepta el compromiso de servicio para habilitar el formulario.",
        variant: "destructive"
      });

      // 4. Limpiar error después de la animación
      setTimeout(() => setShowTermsError(false), 2000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(type);
    try {
      const compressed = await compressImage(file, 1000, 1000, 0.8);
      if (type === 'front') setDocFront(compressed);
      if (type === 'back') setDocBack(compressed);
      if (type === 'selfie') setSelfie(compressed);
      toast({ title: "Documento listo" });
    } catch (err) {
      toast({ title: "Error al procesar imagen", variant: "destructive" });
    } finally {
      setIsCompressing(null);
    }
  };

  const handleRegister = async () => {
    if (!user || !firestore || !acceptedTerms) return;
    
    if (!docFront || !docBack || !selfie || !idNumber || !vehicleType) {
      toast({ title: "Información Incompleta", description: "Todos los campos y fotos son obligatorios.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      
      await updateDocumentNonBlocking(userRef, {
        deliveryRequested: true,
        deliveryStatus: 'pending',
        deliveryRequestDate: serverTimestamp(),
        realFullName: fullName,
        idNumber,
        vehicleType,
        vehiclePlate: plate,
        docFront,
        docBack,
        selfie,
        updatedAt: serverTimestamp()
      });

      toast({ 
        title: "Solicitud Recibida", 
        description: "Tu perfil ha sido enviado para verificación manual.",
        className: "bg-slate-900 text-white border-none"
      });
      
      setTimeout(() => router.push('/delivery/dashboard'), 1500);
    } catch (e) {
      toast({ title: "Error al enviar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role === 'repartidor' || profile?.deliveryRequested) {
    return null;
  }

  const isFormReady = acceptedTerms && docFront && docBack && selfie && idNumber && vehicleType;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl animate-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-12 space-y-4">
          <div className="w-24 h-24 bg-primary rounded-[36px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-primary/20">
            <Truck className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">Únete al Equipo</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Validación de Identidad Requerida</p>
        </div>

        <div className="space-y-8 mb-12">
          {/* COMPROMISO DE SERVICIO - CON REF Y ANIMACIÓN DE ERROR */}
          <div ref={termsRef} className="transition-all duration-300">
            <Card className={cn(
              "border-none shadow-2xl rounded-[40px] bg-white ring-1 transition-all duration-500 overflow-hidden",
              showTermsError ? "ring-4 ring-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-vibrate" : "ring-black/[0.03]"
            )}>
              <CardContent className="p-10">
                <div className={cn(
                  "flex items-center gap-3 mb-6 font-black uppercase text-[10px] tracking-[0.3em] italic transition-colors",
                  showTermsError ? "text-red-500" : "text-primary"
                )}>
                  <ScrollText className="w-4 h-4" /> Compromiso de Operación
                </div>
                <div className="bg-slate-50 p-6 rounded-[28px] h-48 overflow-y-auto text-xs text-slate-500 leading-relaxed font-medium no-scrollbar border border-slate-100 shadow-inner mb-6">
                  <p className="mb-4">1. Debes ser mayor de edad y contar con documentos de identidad vigentes.</p>
                  <p className="mb-4">2. El trato con clientes debe ser estrictamente profesional y puntual.</p>
                  <p className="mb-4">3. La plataforma retiene una comisión del 30% del valor del envío.</p>
                  <p className="mb-4">4. Aceptas el registro de tu ubicación GPS en tiempo real durante cada misión activa.</p>
                  <p>5. La cuenta será suspendida ante cualquier reporte de fraude o mal comportamiento.</p>
                </div>
                <div className={cn(
                  "p-6 rounded-[28px] shadow-xl flex items-center gap-4 transition-all duration-500",
                  showTermsError ? "bg-red-600 scale-[1.02]" : "bg-slate-900 text-white"
                )}>
                  <Checkbox 
                    id="terms" 
                    checked={acceptedTerms} 
                    onCheckedChange={(v) => {
                      setAcceptedTerms(!!v);
                      if (v) setShowTermsError(false);
                    }} 
                    className={cn(
                      "w-7 h-7 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-white rounded-lg",
                      showTermsError && "ring-4 ring-white/30 animate-pulse"
                    )} 
                  />
                  <label htmlFor="terms" className="text-[10px] font-black uppercase tracking-widest cursor-pointer leading-tight text-white">
                    Acepto los términos y el compromiso de servicio
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DATOS PERSONALES Y DOCUMENTOS - BLOQUEADO HASTA ACEPTAR */}
          <div className="relative group">
            <Card className={cn(
              "border-none shadow-2xl rounded-[40px] bg-white ring-1 transition-all duration-500",
              acceptedTerms ? "ring-primary/20 opacity-100" : "ring-black/[0.03] opacity-50 grayscale pointer-events-none"
            )}>
              <CardContent className="p-10 space-y-8">
                <div className="flex items-center gap-3 text-secondary font-black uppercase text-[10px] tracking-[0.3em] italic">
                  <CreditCard className="w-4 h-4" /> Validación de Identidad
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre Completo (Real)</Label>
                    <Input 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tal como aparece en tu documento" 
                      className="h-14 rounded-2xl bg-slate-50 border-none font-bold" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Número de ID/Cédula</Label>
                      <Input 
                        value={idNumber} 
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="Ej: 1065..." 
                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Vehículo</Label>
                      <select 
                        value={vehicleType} 
                        onChange={(e) => setVehicleType(e.target.value as any)}
                        className="w-full h-14 rounded-2xl bg-slate-50 border-none px-4 font-bold text-sm appearance-none"
                      >
                        <option value="">Selecciona...</option>
                        <option value="moto">Motocicleta</option>
                        <option value="bici">Bicicleta</option>
                        <option value="carro">Automóvil</option>
                      </select>
                    </div>
                  </div>

                  {(vehicleType === 'moto' || vehicleType === 'carro') && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Placa del Vehículo</Label>
                      <Input 
                        value={plate} 
                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                        placeholder="ABC-123" 
                        className="h-14 rounded-2xl bg-slate-50 border-none font-black text-center tracking-[0.2em]" 
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">FOTOGRAFÍAS REQUERIDAS (NÍTIDAS)</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Frente del Documento</Label>
                      <div className="relative aspect-video rounded-[24px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group hover:border-primary/50 transition-colors">
                        {docFront ? (
                          <>
                            <Image src={docFront} alt="Frente" fill className="object-cover" />
                            <button onClick={() => setDocFront(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                            {isCompressing === 'front' ? <Loader2 className="animate-spin text-primary" /> : <Camera className="text-slate-300" />}
                            <span className="text-[8px] font-black uppercase text-slate-400 mt-2">Tomar Foto</span>
                            <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'front')} />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Reverso del Documento</Label>
                      <div className="relative aspect-video rounded-[24px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group hover:border-primary/50 transition-colors">
                        {docBack ? (
                          <>
                            <Image src={docBack} alt="Reverso" fill className="object-cover" />
                            <button onClick={() => setDocBack(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                            {isCompressing === 'back' ? <Loader2 className="animate-spin text-primary" /> : <Camera className="text-slate-300" />}
                            <span className="text-[8px] font-black uppercase text-slate-400 mt-2">Tomar Foto</span>
                            <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'back')} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Selfie con tu Documento</Label>
                    <div className="relative aspect-video rounded-[24px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group hover:border-primary/50 transition-colors">
                      {selfie ? (
                        <>
                          <Image src={selfie} alt="Selfie" fill className="object-cover" />
                          <button onClick={() => setSelfie(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                          {isCompressing === 'selfie' ? <Loader2 className="animate-spin text-primary" /> : <UserIcon className="text-slate-300" />}
                          <span className="text-[8px] font-black uppercase text-slate-400 mt-2">Tomar Selfie</span>
                          <input type="file" className="hidden" accept="image/*" capture="user" onChange={(e) => handleImageUpload(e, 'selfie')} />
                        </label>
                      )}
                    </div>
                    <p className="text-[8px] text-slate-400 text-center uppercase tracking-tight mt-2">Sujeta tu ID cerca de tu rostro para validar que eres tú.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* ESCUDO DE INTERACCIÓN: Dispara la navegación si el formulario está bloqueado */}
            {!acceptedTerms && (
              <div 
                className="absolute inset-0 z-50 cursor-pointer rounded-[40px]" 
                onClick={handleLockedClick}
              />
            )}
          </div>
        </div>

        <Button 
          onClick={handleRegister} 
          disabled={loading || !isFormReady} 
          className={cn(
            "w-full h-20 rounded-[32px] text-xl font-black gap-4 text-white shadow-2xl transition-all active:scale-95",
            isFormReady ? "bg-primary hover:bg-primary/90 shadow-primary/20" : "bg-slate-300 grayscale cursor-not-allowed"
          )}
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> ENVIAR SOLICITUD</>}
        </Button>
        <p className="text-[8px] text-center text-slate-300 font-black uppercase tracking-[0.4em] mt-8">VERIFICACIÓN SEGURA • PROTECCIÓN DE DATOS ACTIVA</p>
      </main>
    </div>
  );
}
