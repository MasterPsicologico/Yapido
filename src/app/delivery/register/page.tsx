
"use client";

import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useProfile } from '@/firebase/auth/use-profile';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/image-compression';

// Módulos Fragmentados
import { RegisterHeader } from '@/components/delivery/register/header';
import { TermsSection } from '@/components/delivery/register/terms';
import { IdentitySection } from '@/components/delivery/register/identity';
import { RegisterSubmit } from '@/components/delivery/register/submit';

export default function DeliveryRegisterPage() {
  const { user } = useUser();
  const { profile } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  
  // Refs para navegación
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
    if (profile) setFullName(profile.displayName || "");
    if (profile?.role === 'repartidor' || profile?.deliveryRequested) {
      router.push('/delivery/dashboard');
    }
  }, [profile, router]);

  const handleLockedClick = () => {
    if (!acceptedTerms) {
      termsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setShowTermsError(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200);
      toast({ title: "Acceso Bloqueado", description: "Primero acepta el compromiso de servicio.", variant: "destructive" });
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
      toast({ title: "Imagen optimizada", description: "Documento procesado correctamente." });
    } catch (err) {
      toast({ title: "Fallo en procesamiento", variant: "destructive" });
    } finally {
      setIsCompressing(null);
    }
  };

  const handleRegister = async () => {
    if (!user || !firestore || !acceptedTerms) return;
    if (!docFront || !docBack || !selfie || !idNumber || !vehicleType) {
      toast({ title: "Expediente Incompleto", description: "Completa todos los datos y fotos.", variant: "destructive" });
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
      setTimeout(() => router.push('/delivery/dashboard'), 1500);
    } catch (e) {
      toast({ title: "Error en el despliegue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role === 'repartidor' || profile?.deliveryRequested) return null;

  const isFormReady = acceptedTerms && docFront && docBack && selfie && idNumber && vehicleType;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-2xl">
        <RegisterHeader />

        <div className="space-y-12">
          <TermsSection 
            ref={termsRef}
            acceptedTerms={acceptedTerms}
            onAcceptedChange={setAcceptedTerms}
            showTermsError={showTermsError}
          />

          <IdentitySection 
            isLocked={!acceptedTerms}
            onLockedClick={handleLockedClick}
            fullName={fullName} setFullName={setFullName}
            idNumber={idNumber} setIdNumber={setIdNumber}
            vehicleType={vehicleType} setVehicleType={setVehicleType}
            plate={plate} setPlate={setPlate}
            docFront={docFront} docBack={docBack} selfie={selfie}
            isCompressing={isCompressing}
            onImageUpload={handleImageUpload}
            setDocFront={setDocFront} setDocBack={setDocBack} setSelfie={setSelfie}
          />
        </div>

        <RegisterSubmit 
          loading={loading}
          isReady={isFormReady}
          onClick={handleRegister}
        />
      </main>
    </div>
  );
}
