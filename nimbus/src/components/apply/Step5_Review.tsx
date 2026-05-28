'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TherapistApplicationData } from "@/lib/types";

interface Step5_ReviewProps {
  formData: TherapistApplicationData;
}

const ReviewItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base text-foreground">{value || '-'}</p>
    </div>
);

export default function Step5_Review({ formData }: Step5_ReviewProps) {
  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-xl">Revisa tu Información</CardTitle>
        <CardDescription>Asegúrate de que todos los datos sean correctos antes de enviar tu solicitud.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        <div className="space-y-3">
            <h3 className="font-semibold">Información Personal y Profesional</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReviewItem label="Nombre Completo" value={formData.name} />
                <ReviewItem label="Email" value={formData.email} />
                <ReviewItem label="WhatsApp" value={formData.whatsapp} />
                <ReviewItem label="Credenciales" value={formData.credentials} />
            </div>
             <ReviewItem label="Biografía" value={formData.bio} />
        </div>
        <Separator />
        <div className="space-y-3">
             <h3 className="font-semibold">Detalles de la Práctica</h3>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ReviewItem label="Especialidades" value={typeof formData.specialties === 'string' ? formData.specialties : formData.specialties.join(', ')} />
                <ReviewItem label="Idiomas" value={typeof formData.languages === 'string' ? formData.languages : formData.languages.join(', ')} />
                <ReviewItem label="Precio por Sesión (USD)" value={`$${formData.pricePerSession}`} />
            </div>
        </div>
        <Separator />
         <div>
            <h3 className="font-semibold mb-2">Documentos</h3>
            <p className="text-sm text-muted-foreground">Ambos documentos deben estar adjuntos para poder enviar la solicitud.</p>
        </div>
      </CardContent>
    </Card>
  );
}
