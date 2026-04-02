
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
  ChevronDown,
  Navigation,
  Smartphone
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
      
      // 3. Feedback táctil
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }

      toast({
        title: "Acceso Bloqueado",
        description: "Primero debes aceptar el compromiso de servicio.",
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
      const compressed = await compressImage(file, 1200, 1200, 0.85);
      if (type === 'front') setDocFront(compressed);
      if (type === 'back') setDocBack(compressed);
      if (type === 'selfie') setSelfie(compressed);
      toast({ title: "Imagen optimizada", description: "El documento ha sido procesado correctamente." });
    } catch (err) {
      toast({ title: "Fallo en procesamiento", variant: "destructive" });
    } finally {
      setIsCompressing(null);
    }
  };

  const handleRegister = async () => {
    if (!user || !firestore || !acceptedTerms) return;
    
    if (!docFront || !docBack || !selfie || !idNumber || !vehicleType) {
      toast({ 
        title: "Expediente Incompleto", 
        description: "Asegúrate de cargar todas las fotos y completar tus datos.", 
        variant: "destructive" 
      });
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
        title: "¡Misión Enviada!", 
        description: "Tu solicitud está en cola de verificación manual.",
        className: "bg-slate-900 text-white border-none"
      });
      
      setTimeout(() => router.push('/delivery/dashboard'), 1500);
    } catch (e) {
      toast({ title: "Error en el despliegue", variant: "destructive" });
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
      <main className="flex-1 container mx-auto px-4 py-16 max-w-2xl animate-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center mb-16 space-y-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-[40px] animate-ping [animation-duration:3000ms]" />
            <div className="relative w-28 h-28 bg-primary rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-primary/30">
              <Truck className="w-14 h-14" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">Inscripción Élite</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] ml-1">Protocolo de Verificación de Flota</p>
          </div>
        </div>

        <div className="space-y-12">
          {/* COMPROMISO DE SERVICIO */}
          <div ref={termsRef} className="transition-all duration-500">
            <Card className={cn(
              "border-none shadow-2xl rounded-[48px] bg-white ring-1 transition-all duration-700 overflow-hidden",
              showTermsError ? "ring-4 ring-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-vibrate" : "ring-black/[0.03]"
            )}>
              <CardContent className="p-12">
                <div className={cn(
                  "flex items-center gap-3 mb-8 font-black uppercase text-[11px] tracking-[0.3em] italic transition-colors",
                  showTermsError ? "text-red-500" : "text-primary"
                )}>
                  <ScrollText className="w-5 h-5" /> Compromiso de Operación
                </div>
                <div className="bg-slate-50/50 p-8 rounded-[36px] h-56 overflow-y-auto text-sm text-slate-500 leading-relaxed font-medium no-scrollbar border border-slate-100 shadow-inner mb-8">
                  <p className="mb-5">1. <b className="text-slate-900">Edad y Documentación:</b> Debes ser mayor de edad y contar con documentos de identidad vigentes y originales.</p>
                  <p className="mb-5">2. <b className="text-slate-900">Conducta Profesional:</b> El trato con clientes y comercios debe ser estrictamente profesional, puntual y respetuoso.</p>
                  <p className="mb-5">3. <b className="text-slate-900">Comisiones:</b> La plataforma gestiona una tasa de servicio del 30% del valor del envío para mantenimiento del sistema.</p>
                  <p className="mb-5">4. <b className="text-slate-900">Geolocalización:</b> Aceptas el rastreo GPS en tiempo real durante el transcurso de misiones activas para seguridad del pedido.</p>
                  <p>5. <b className="text-slate-900">Sanciones:</b> La cuenta será bloqueada permanentemente ante reportes comprobados de fraude o incumplimiento de entrega.</p>
                </div>
                <div className={cn(
                  "p-8 rounded-[32px] shadow-2xl flex items-center gap-5 transition-all duration-700",
                  showTermsError ? "bg-red-600 scale-[1.03]" : "bg-slate-950 text-white"
                )}>
                  <Checkbox 
                    id="terms" 
                    checked={acceptedTerms} 
                    onCheckedChange={(v) => {
                      setAcceptedTerms(!!v);
                      if (v) setShowTermsError(false);
                    }} 
                    className={cn(
                      "w-8 h-8 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-white rounded-xl",
                      showTermsError && "ring-4 ring-white/30 animate-pulse"
                    )} 
                  />
                  <label htmlFor="terms" className="text-[11px] font-black uppercase tracking-widest cursor-pointer leading-tight text-white/90">
                    He leído y acepto el compromiso de servicio de Vitriniando
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DATOS PERSONALES Y DOCUMENTOS */}
          <div className="relative group">
            <Card className={cn(
              "border-none shadow-2xl rounded-[56px] bg-white ring-1 transition-all duration-1000",
              acceptedTerms ? "ring-primary/20 opacity-100 translate-y-0" : "ring-black/[0.03] opacity-40 grayscale blur-[1px] translate-y-4 pointer-events-none"
            )}>
              <CardContent className="p-12 space-y-16">
                {/* Bloque 1: Identificación */}
                <div className="space-y-10">
                  <div className="flex items-center gap-4 text-secondary">
                    <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-[0.3em] italic">Datos de Identidad</h3>
                  </div>

                  <div className="grid gap-10">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Nombre Completo (Real)</Label>
                      <Input 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Tal como aparece en tu documento" 
                        className="h-16 rounded-[24px] bg-slate-50 border-none font-bold text-lg px-8 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Número de ID / Cédula</Label>
                        <Input 
                          value={idNumber} 
                          onChange={(e) => setIdNumber(e.target.value)}
                          placeholder="Ej: 1065..." 
                          className="h-16 rounded-[24px] bg-slate-50 border-none font-bold text-lg px-8 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Vehículo de Operación</Label>
                        <div className="relative">
                          <select 
                            value={vehicleType} 
                            onChange={(e) => setVehicleType(e.target.value as any)}
                            className="w-full h-16 rounded-[24px] bg-slate-50 border-none px-8 font-black text-sm appearance-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                          >
                            <option value="">Selecciona...</option>
                            <option value="moto">Motocicleta</option>
                            <option value="bici">Bicicleta</option>
                            <option value="carro">Automóvil</option>
                          </select>
                          <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {(vehicleType === 'moto' || vehicleType === 'carro') && (
                      <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Placa del Vehículo</Label>
                        <Input 
                          value={plate} 
                          onChange={(e) => setPlate(e.target.value.toUpperCase())}
                          placeholder="ABC-123" 
                          className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-center text-2xl tracking-[0.4em] uppercase focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent" />

                {/* Bloque 2: Archivos */}
                <div className="space-y-10">
                  <div className="flex items-center gap-4 text-primary">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-[0.3em] italic">Evidencia Visual</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="px-4">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Frente de ID</Label>
                        <p className="text-[8px] text-slate-300 uppercase tracking-widest mt-1">Debe ser legible</p>
                      </div>
                      <div className="relative aspect-[16/10] rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group/upload hover:border-primary/50 transition-all">
                        {docFront ? (
                          <>
                            <Image src={docFront} alt="Frente" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                              <Button onClick={() => setDocFront(null)} size="icon" variant="destructive" className="h-12 w-12 rounded-full shadow-2xl"><X className="w-6 h-6" /></Button>
                            </div>
                          </>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-slate-100 transition-colors">
                            {isCompressing === 'front' ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <Smartphone className="w-10 h-10 text-slate-200" />}
                            <span className="text-[9px] font-black uppercase text-slate-400 mt-4 tracking-widest">Capturar Frente</span>
                            <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'front')} />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="px-4">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Reverso de ID</Label>
                        <p className="text-[8px] text-slate-300 uppercase tracking-widest mt-1">Enfoque nítido</p>
                      </div>
                      <div className="relative aspect-[16/10] rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group/upload hover:border-primary/50 transition-all">
                        {docBack ? (
                          <>
                            <Image src={docBack} alt="Reverso" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                              <Button onClick={() => setDocBack(null)} size="icon" variant="destructive" className="h-12 w-12 rounded-full shadow-2xl"><X className="w-6 h-6" /></Button>
                            </div>
                          </>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-slate-100 transition-colors">
                            {isCompressing === 'back' ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <Smartphone className="w-10 h-10 text-slate-200" />}
                            <span className="text-[9px] font-black uppercase text-slate-400 mt-4 tracking-widest">Capturar Reverso</span>
                            <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'back')} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="px-4">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Selfie Biométrica</Label>
                      <p className="text-[8px] text-slate-300 uppercase tracking-widest mt-1">Sujeta tu ID cerca de tu rostro</p>
                    </div>
                    <div className="relative aspect-[16/9] rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group/upload hover:border-primary/50 transition-all shadow-inner">
                      {selfie ? (
                        <>
                          <Image src={selfie} alt="Selfie" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                            <Button onClick={() => setSelfie(null)} size="icon" variant="destructive" className="h-12 w-12 rounded-full shadow-2xl"><X className="w-6 h-6" /></Button>
                          </div>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-slate-100 transition-colors">
                          {isCompressing === 'selfie' ? <Loader2 className="w-12 h-12 animate-spin text-primary" /> : <UserIcon className="w-12 h-12 text-slate-200" />}
                          <span className="text-[10px] font-black uppercase text-slate-400 mt-4 tracking-widest">Tomar Selfie de Validación</span>
                          <input type="file" className="hidden" accept="image/*" capture="user" onChange={(e) => handleImageUpload(e, 'selfie')} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* ESCUDO DE INTERACCIÓN */}
            {!acceptedTerms && (
              <div 
                className="absolute inset-0 z-50 cursor-pointer rounded-[56px]" 
                onClick={handleLockedClick}
              />
            )}
          </div>
        </div>

        <div className="mt-16 space-y-6">
          <Button 
            onClick={handleRegister} 
            disabled={loading || !isFormReady} 
            className={cn(
              "w-full h-24 rounded-[40px] text-2xl font-black gap-5 text-white shadow-2xl transition-all active:scale-95 uppercase italic tracking-tighter",
              isFormReady ? "bg-primary hover:bg-primary/90 shadow-primary/20" : "bg-slate-300 grayscale cursor-not-allowed"
            )}
          >
            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <><CheckCircle2 className="w-8 h-8" /> ENVIAR SOLICITUD MAESTRA</>}
          </Button>
          <p className="text-[9px] text-center text-slate-300 font-black uppercase tracking-[0.5em] animate-pulse">SISTEMA BLINDADO • PROTECCIÓN DE DATOS ACTIVA</p>
        </div>
      </main>
    </div>
  );
}
