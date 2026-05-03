
"use client";

import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { ResponsiveHero } from './ResponsiveHero';
import { AdminWelcomeControls } from './AdminWelcomeControls';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useProfile } from '@/firebase/auth/use-profile';
import { useRouter } from 'next/navigation';

// IMPORTACIÓN DE MÓDULOS DE REGISTRO
import { TermsSection } from '@/components/delivery/register/terms';
import { IdentitySection } from '@/components/delivery/register/identity';
import { RegisterSubmit } from '@/components/delivery/register/submit';
import { cn } from '@/lib/utils';

interface WelcomeLandingProps {
  isAdmin: boolean;
  config: any;
  onUpdateConfig: (data: any) => void;
}

/**
 * WelcomeLanding - Orquestador de Inmersión Total.
 * Actualizado: El clic en la imagen ahora fuerza el scroll al formulario siempre.
 */
export function WelcomeLanding({ isAdmin, config, onUpdateConfig }: WelcomeLandingProps) {
  const { user } = useUser();
  const { profile } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  // Estados de Interfaz
  const [isUploading, setIsUploading] = useState<'mobile' | 'pc' | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados de Formulario
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<"moto" | "bici" | "carro" | "">("");
  const [plate, setPlate] = useState("");
  const [docFront, setDocFront] = useState<string | null>(null);
  const [docBack, setDocBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setFullName(profile.displayName || "");
  }, [profile]);

  const handleToggleForm = () => {
    // Activar formulario si no lo está
    if (!showForm) {
      setShowForm(true);
    }
    
    // Ejecutar scroll automático instantáneo
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'mobile' | 'pc') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(target);
    try {
      const compressed = await compressImage(file, target === 'mobile' ? 1000 : 1920, target === 'mobile' ? 1600 : 1080, 0.85);
      const updateKey = target === 'mobile' ? 'bgMobile' : 'bgDesktop';
      onUpdateConfig({ [updateKey]: compressed });
      toast({ title: `Portada ${target.toUpperCase()} actualizada` });
    } catch (err) {
      toast({ title: "Error al procesar imagen", variant: "destructive" });
    } finally {
      setIsUploading(null);
    }
  };

  const handleRegisterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(type);
    try {
      const compressed = await compressImage(file, 1200, 1200, 0.85);
      if (type === 'front') setDocFront(compressed);
      if (type === 'back') setDocBack(compressed);
      if (type === 'selfie') setSelfie(compressed);
      toast({ title: "Documento procesado" });
    } catch (err) {
      toast({ title: "Fallo en procesamiento", variant: "destructive" });
    } finally {
      setIsCompressing(null);
    }
  };

  const handleFinalSubmit = async () => {
    if (!user || !firestore || !acceptedTerms) return;
    if (!docFront || !docBack || !selfie || !idNumber || !vehicleType) {
      toast({ title: "Expediente Incompleto", description: "Sube todas las fotos y datos.", variant: "destructive" });
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
      toast({ title: "¡Solicitud Enviada!", className: "bg-slate-900 text-white border-none" });
      router.refresh();
    } catch (e) {
      toast({ title: "Error en el despliegue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isFormReady = Boolean(acceptedTerms && docFront && docBack && selfie && idNumber && vehicleType);

  return (
    <div className={cn(
      "flex flex-col min-h-screen bg-slate-950 transition-all duration-700",
      !showForm ? "h-screen overflow-hidden" : "overflow-x-hidden"
    )}>
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black z-0" />
        
        {/* HERO RESPONSIVO: Sin overlays, dispara scroll al tocar */}
        <ResponsiveHero 
          bgMobile={config?.bgMobile} 
          bgDesktop={config?.bgDesktop} 
          onAction={handleToggleForm}
        />

        {/* CONTROLES ADMIN */}
        {isAdmin && (
          <AdminWelcomeControls 
            isUploading={isUploading} 
            onUpload={handleImageUpload} 
          />
        )}

        {/* CONTENEDOR DEL FORMULARIO */}
        {showForm && (
          <div ref={formRef} className="container mx-auto px-4 max-w-2xl relative z-20 py-20 space-y-12 animate-in slide-in-from-bottom-10 duration-1000">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Registro de Flota</h3>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Completa tu expediente maestro</p>
            </div>

            <TermsSection 
              acceptedTerms={acceptedTerms}
              onAcceptedChange={setAcceptedTerms}
              showTermsError={showTermsError}
            />

            <IdentitySection 
              isLocked={!acceptedTerms}
              onLockedClick={() => {
                setShowTermsError(true);
                toast({ title: "Compromiso requerido", variant: "destructive" });
                setTimeout(() => setShowTermsError(false), 2000);
              }}
              fullName={fullName} setFullName={setFullName}
              idNumber={idNumber} setIdNumber={setIdNumber}
              vehicleType={vehicleType} setVehicleType={setVehicleType}
              plate={plate} setPlate={setPlate}
              docFront={docFront} docBack={docBack} selfie={selfie}
              isCompressing={isCompressing}
              onImageUpload={handleRegisterImageUpload}
              setDocFront={setDocFront} setDocBack={setDocBack} setSelfie={setSelfie}
            />

            <RegisterSubmit 
              loading={loading}
              isReady={isFormReady}
              onClick={handleFinalSubmit}
            />
            
            <footer className="py-10 text-center opacity-40">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.5em]">Vitriniando AI Central • Yapido</p>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
