'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { User } from 'firebase/auth';
import { useFirestore, useStorage } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { TherapistApplicationDataSchema, type TherapistApplicationData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import StepIndicator from './StepIndicator';
import Step1_PersonalInfo from './Step1_PersonalInfo';
import Step2_ProfessionalInfo from './Step2_ProfessionalInfo';
import Step3_Details from './Step3_Details';
import Step4_Documents from './Step4_Documents';
import Step5_Review from './Step5_Review';

interface OnboardingFormProps {
  user: User;
}

const steps = ["Personal", "Profesional", "Detalles", "Documentos", "Revisión"];

export default function OnboardingForm({ user }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  
  const [fileUploads, setFileUploads] = useState({
    identity: { file: null as File | null, progress: 0, url: '', error: null as string | null },
    license: { file: null as File | null, progress: 0, url: '', error: null as string | null }
  });

  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const methods = useForm<TherapistApplicationData>({
    resolver: zodResolver(TherapistApplicationDataSchema),
    mode: 'onChange',
    defaultValues: {
      name: user.displayName || '',
      email: user.email || '',
      whatsapp: '',
      credentials: '',
      bio: '',
      specialties: '',
      languages: '',
      pricePerSession: 50,
    }
  });

  const { trigger, getValues } = methods;

  const nextStep = async () => {
    const fieldsToValidate: (keyof TherapistApplicationData)[] = [
      ['name', 'email', 'whatsapp'],
      ['credentials', 'bio'],
      ['specialties', 'languages', 'pricePerSession'],
      [],
      [],
    ][currentStep];

    const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate as any) : true;
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const uploadFile = (file: File, type: 'identity' | 'license'): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("No file selected for upload."));
            return;
        }

        const filePath = `applications/${user.uid}/${type}_${Date.now()}_${file.name}`;
        const fileRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setFileUploads(prev => ({ ...prev, [type]: { ...prev[type], progress } }));
            },
            (error) => {
                console.error(`Upload error for ${type}:`, error);
                setFileUploads(prev => ({ ...prev, [type]: { ...prev[type], error: 'Error al subir' } }));
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                setFileUploads(prev => ({ ...prev, [type]: { ...prev[type], url: downloadURL, progress: 100 } }));
                resolve(downloadURL);
            }
        );
    });
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
        if (!fileUploads.identity.file || !fileUploads.license.file) {
            throw new Error("Por favor, sube ambos documentos.");
        }
        
        const identityDocumentUrl = await uploadFile(fileUploads.identity.file, 'identity');
        const professionalLicenseUrl = await uploadFile(fileUploads.license.file, 'license');

        const data = getValues();
        
        // Ensure specialties and languages are arrays of strings
        const specialtiesArray = typeof data.specialties === 'string' 
            ? data.specialties.split(',').map(s => s.trim()).filter(Boolean) 
            : data.specialties;
        
        const languagesArray = typeof data.languages === 'string'
            ? data.languages.split(',').map(l => l.trim()).filter(Boolean)
            : data.languages;
            
        const applicationData = {
            ...data,
            specialties: specialtiesArray,
            languages: languagesArray,
            identityDocumentUrl,
            professionalLicenseUrl,
            photoUrl: user.photoURL,
        };

        await addDoc(collection(firestore, 'therapistApplications'), {
            userId: user.uid,
            displayName: user.displayName || data.name,
            email: user.email,
            status: 'pending',
            submittedAt: serverTimestamp(),
            applicationData,
        });

        setSubmissionComplete(true);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error al Enviar', description: error.message || 'No se pudo enviar la solicitud.' });
        setIsSubmitting(false);
    }
  };
  
  if (submissionComplete) {
      return (
          <div className="text-center py-12">
            <h3 className="text-2xl font-semibold text-primary">¡Gracias por tu interés!</h3>
            <p className="mt-2 text-muted-foreground">Hemos recibido tu solicitud y nuestro equipo la revisará pronto. Te notificaremos por correo electrónico sobre el estado de tu postulación.</p>
          </div>
      );
  }

  const renderStepContent = () => {
    switch(currentStep) {
        case 0: return <Step1_PersonalInfo />;
        case 1: return <Step2_ProfessionalInfo />;
        case 2: return <Step3_Details />;
        case 3: return <Step4_Documents fileUploads={fileUploads} setFileUploads={setFileUploads} />;
        case 4: return <Step5_Review formData={getValues()} />;
        default: return null;
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={e => e.preventDefault()} className="space-y-8">
        <StepIndicator currentStep={currentStep} steps={steps} />
        
        <div className="relative min-h-[350px]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                >
                   {renderStepContent()}
                </motion.div>
            </AnimatePresence>
        </div>

        <div className="flex justify-between items-center pt-4">
          <div>
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0 || isSubmitting}>
              Anterior
            </Button>
          </div>
          <div>
            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Siguiente
              </Button>
            ) : (
              <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Enviando Solicitud...' : 'Enviar Solicitud'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
