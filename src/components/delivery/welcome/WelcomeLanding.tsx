"use client";

import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { ResponsiveHero } from './ResponsiveHero';
import { WelcomeFeatureCards } from './WelcomeFeatureCards';
import { AdminWelcomeControls } from './AdminWelcomeControls';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useProfile } from '@/firebase/auth/use-profile';
import { useRouter } from 'next/navigation';

// IMPORTACIÓN DE MÓDULOS DE REGISTRO (MUDANZA LÓGICA)
import { TermsSection } from '@/components/delivery/register/terms';
import { IdentitySection } from '@/components/delivery/register/identity';
import { RegisterSubmit } from '@/components/delivery/register/submit';

interface WelcomeLandingProps {
  isAdmin: boolean;
  config: any;
  onUpdateConfig: (data: any) => void;
}

/**
 * WelcomeLanding - Orquestador Maestro Unificado.
 * Ahora gestiona tanto la bienvenida como el registro instantáneo en una sola pieza.
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

  // Estados de Formulario (Sincronizados)
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
    setShowForm(true);
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
      router.refresh(); // Sincronización de estado para ocultar landing
    } catch (e) {
      toast({ title: "Error en el despliegue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isFormReady = acceptedTerms && docFront && docBack && selfie && idNumber && vehicleType;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 overflow-x-hidden selection:bg-primary selection:text-white">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black z-0" />
        
        {/* COMPONENTE ATÓMICO: HERO RESPONSIVO INTERACTIVO */}
        <ResponsiveHero 
          bgMobile={config?.bgMobile} 
          bgDesktop={config?.bgDesktop} 
          onAction={handleToggleForm}
        />

        {/* COMPONENTE ATÓMICO: CONTROLES DE ADMINISTRADOR */}
        {isAdmin && (
          <AdminWelcomeControls 
            isUploading={isUploading} 
            onUpload={handleImageUpload} 
          />
        )}

        {/* CONTENEDOR DE CONTENIDO DINÁMICO */}
        <div className="container mx-auto px-4 max-w-2xl -mt-12 relative z-20 pb-20 space-y-12">
          {!showForm ? (
            <WelcomeFeatureCards onAction={handleToggleForm} />
          ) : (
            <div ref={formRef} className="animate-in slide-in-from-bottom-10 duration-1000 space-y-12">
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
            </div>
          )}
        </div>
      </main>

      <footer className="py-10 text-center relative z-10 border-t border-white/5 bg-black/20">
        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.5em]">Vitriniando AI Central • Aguachica Élite</p>
      </footer>
    </div>
  );
}
