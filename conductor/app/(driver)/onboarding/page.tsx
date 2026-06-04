'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Check, ChevronRight, User, FileText, Bike } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseAuth, firebaseDb, firebaseStorage } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { useUserStore } from '@/store/userStore';
import { uuid } from '@/lib/utils';
import type { VehicleType } from '@/lib/contracts';

const STEPS = [
  { id: 'personal', label: 'Datos personales', icon: User },
  { id: 'vehicle',  label: 'Tu vehículo',      icon: Bike },
  { id: 'docs',     label: 'Documentos',       icon: FileText },
] as const;

export default function DriverOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const setUser = useUserStore((s) => s.setUser);

  const [step, setStep] = useState<typeof STEPS[number]['id']>('personal');
  const [fullName, setFullName] = useState(user?.displayName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [type, setType] = useState<VehicleType>('moto');
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [ccFront, setCcFront] = useState<File | null>(null);
  const [ccBack, setCcBack] = useState<File | null>(null);
  const [license, setLicense] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function uploadFile(file: File, path: string): Promise<string> {
    const r = ref(firebaseStorage(), path);
    await uploadBytes(r, file);
    return getDownloadURL(r);
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    try {
      const uid = user.uid;
      const basePath = `users/${uid}/driver_onboarding`;

      const [ccFrontUrl, ccBackUrl, licenseUrl, selfieUrl] = await Promise.all([
        ccFront ? uploadFile(ccFront, `${basePath}/cc_front_${uuid()}`) : Promise.resolve(undefined),
        ccBack  ? uploadFile(ccBack,  `${basePath}/cc_back_${uuid()}`)  : Promise.resolve(undefined),
        license ? uploadFile(license, `${basePath}/license_${uuid()}`) : Promise.resolve(undefined),
        selfie  ? uploadFile(selfie,  `${basePath}/selfie_${uuid()}`)  : Promise.resolve(undefined),
      ]);

      // Crear driver_profile
      const vehicleId = uuid();
      await setDoc(doc(firebaseDb(), 'driver_profiles', uid), {
        uid,
        status: 'pending_docs',
        ratingAvg: 5,
        ratingCount: 0,
        totalTrips: 0,
        acceptRate30d: 1,
        cancelRate30d: 0,
        vehicleId,
        online: false,
        currentLocation: null,
        currentGeohash6: null,
        citiesActive: ['aguachica'],
        currentCityId: 'aguachica',
        flaggedAt: null,
        city: 'aguachica',
        vehicleType: type,
        bankAccount: null,
        market: { primaryZone: 'centro', worksWeekends: true, worksNights: false, vehicleInspectionPassed: false },
        onboarding: { channel: 'remote', verifiedBy: null, verifiedAt: null, verificationNotes: null },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Crear vehículo
      await setDoc(doc(firebaseDb(), 'driver_vehicles', vehicleId), {
        vehicleId,
        driverId: uid,
        type,
        plate: plate.toUpperCase(),
        brand,
        model,
        year: Number(year) || new Date().getFullYear(),
        color,
        capacity: type === 'moto' ? 1 : type === 'auto' ? 4 : 4,
        photoFront: '', photoSide: '', photoBack: '',
        insuranceExpiry: null,
        soatExpiry: null,
        verifiedAt: null,
      });

      // Crear documentos
      await setDoc(doc(firebaseDb(), 'driver_documents', uid), {
        uid,
        ccFrontUrl,
        ccBackUrl,
        licenseUrl,
        selfieWithCcUrl: selfieUrl,
        licenseExpiry: null,
        backgroundCheckUrl: null,
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
        updatedAt: serverTimestamp(),
      });

      // Actualizar user.role = 'driver'
      await setDoc(doc(firebaseDb(), 'users', uid), { role: 'driver', updatedAt: serverTimestamp() }, { merge: true });
      setUser({ ...user, role: 'driver' });

      router.push('/(driver)/home');
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-4 pt-safe">
      <h1 className="text-2xl font-bold mb-1">Conviértete en conductor</h1>
      <p className="text-muted-foreground mb-4">Empieza a ganar con Yapido en 3 pasos.</p>

      <ol className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          const passed = STEPS.findIndex(x => x.id === step) > i;
          return (
            <li key={s.id} className={`flex-1 flex items-center gap-2 p-2 rounded-lg ${active ? 'bg-primary/5' : ''}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${passed ? 'bg-primary text-primary-foreground' : active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                {passed ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${active ? '' : 'text-muted-foreground'}`}>{s.label}</span>
            </li>
          );
        })}
      </ol>

      {step === 'personal' && (
        <div className="space-y-3">
          <div>
            <label className="label">Nombre completo</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Pérez" />
          </div>
          <div>
            <label className="label">Celular</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 300 123 4567" inputMode="tel" />
          </div>
          <Button fullWidth size="lg" disabled={!fullName || !phone} onClick={() => setStep('vehicle')}>
            Siguiente <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {step === 'vehicle' && (
        <div className="space-y-3">
          <div>
            <label className="label">Tipo de vehículo</label>
            <div className="grid grid-cols-3 gap-2">
              {(['moto', 'auto', 'auto_comfort'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`h-12 rounded-xl border text-sm font-semibold ${type === t ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                >
                  {t === 'moto' ? 'Moto' : t === 'auto' ? 'Auto' : 'Comfort'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Placa</label>
              <Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ABC123" />
            </div>
            <div>
              <label className="label">Año</label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2020" inputMode="numeric" />
            </div>
          </div>
          <div>
            <label className="label">Marca</label>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Yamaha / Renault / …" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Modelo</label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="FZ 150 / Logan" />
            </div>
            <div>
              <label className="label">Color</label>
              <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Rojo" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setStep('personal')}>Atrás</Button>
            <Button onClick={() => setStep('docs')} disabled={!plate || !brand || !model}>Siguiente</Button>
          </div>
        </div>
      )}

      {step === 'docs' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Sube fotos claras. Nuestro equipo las revisa en 24-48h.</p>
          <FileField label="Cédula (frente)" file={ccFront} onChange={setCcFront} />
          <FileField label="Cédula (atrás)" file={ccBack} onChange={setCcBack} />
          <FileField label="Licencia de conducción" file={license} onChange={setLicense} />
          <FileField label="Selfie sosteniendo la cédula" file={selfie} onChange={setSelfie} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setStep('vehicle')}>Atrás</Button>
            <Button onClick={handleSubmit} loading={submitting} disabled={!ccFront || !license || !selfie}>
              Enviar solicitud
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

function FileField({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <label className="block">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <div className="h-24 rounded-xl border-2 border-dashed border-border bg-card flex items-center justify-center gap-2 cursor-pointer hover:bg-secondary/40">
          {file ? (
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-5 w-5 text-emerald-500" /> {file.name}
            </div>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <Camera className="h-6 w-6" />
              <span className="text-xs">Toca para tomar foto</span>
            </div>
          )}
        </div>
      </label>
    </div>
  );
}

