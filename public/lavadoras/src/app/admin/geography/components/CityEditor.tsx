"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, X, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { slugify } from '@/lib/city-config';
import type { CityConfig } from '@/lib/city-config';

interface CityEditorProps {
  city: CityConfig | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function CityEditor({ city, onSaved, onCancel }: CityEditorProps) {
  const firestore = useFirestore();
  const isNew = !city;

  const [name, setName] = useState(city?.name || '');
  const [department, setDepartment] = useState(city?.department || '');
  const [minHours, setMinHours] = useState(city?.minHours ?? 4);
  const [rateAuto, setRateAuto] = useState(city?.rateAuto ?? 3500);
  const [rateSemi, setRateSemi] = useState(city?.rateSemi ?? 3000);
  const [floorFee, setFloorFee] = useState(city?.floorFee ?? 2000);
  const [stairsFee, setStairsFee] = useState(city?.stairsFee ?? 5000);
  const [lat, setLat] = useState(city?.mapCenter?.lat ?? 0);
  const [lng, setLng] = useState(city?.mapCenter?.lng ?? 0);
  const [mapZoom, setMapZoom] = useState(city?.mapZoom ?? 13);
  const [active, setActive] = useState(city?.active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !department.trim()) return;
    setSaving(true);
    try {
      const cityId = city?.id || slugify(name);
      const data: any = {
        name: name.trim(),
        department: department.trim(),
        country: 'Colombia',
        minHours, rateAuto, rateSemi, floorFee, stairsFee,
        mapCenter: { lat, lng },
        mapZoom,
        timezone: 'America/Bogota',
        active,
        updatedAt: serverTimestamp(),
      };
      if (isNew) data.createdAt = serverTimestamp();

      await setDoc(doc(firestore, 'cities', cityId), data, { merge: true });
      onSaved();
    } catch (err) {
      console.error('Error saving city:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-none rounded-[32px] shadow-sm bg-white ring-1 ring-black/[0.03]">
      <CardContent className="p-8 space-y-8">
        {/* Info Básica */}
        <div className="space-y-1">
          <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em]">Información Básica</h3>
          <div className="h-0.5 w-12 bg-emerald-500 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Nombre de la Ciudad" value={name} onChange={setName} placeholder="Ej: Medellín" />
          <Field label="Departamento" value={department} onChange={setDepartment} placeholder="Ej: Antioquia" />
        </div>

        {/* Pricing */}
        <div className="space-y-1 pt-4">
          <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em]">Pricing Base</h3>
          <div className="h-0.5 w-12 bg-emerald-500 rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          <NumField label="Horas Mínimas" value={minHours} onChange={setMinHours} suffix="horas" />
          <NumField label="Tarifa Automática" value={rateAuto} onChange={setRateAuto} prefix="$" suffix="/h" />
          <NumField label="Tarifa Semiautomática" value={rateSemi} onChange={setRateSemi} prefix="$" suffix="/h" />
          <NumField label="Fee Piso Extra" value={floorFee} onChange={setFloorFee} prefix="$" />
          <NumField label="Fee Escaleras" value={stairsFee} onChange={setStairsFee} prefix="$" />
        </div>

        {/* Mapa */}
        <div className="space-y-1 pt-4">
          <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em]">Centro del Mapa</h3>
          <div className="h-0.5 w-12 bg-emerald-500 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <NumField label="Latitud" value={lat} onChange={setLat} step={0.0001} />
          <NumField label="Longitud" value={lng} onChange={setLng} step={0.0001} />
          <NumField label="Zoom" value={mapZoom} onChange={setMapZoom} />
        </div>

        {/* Toggle activo */}
        <div className="flex items-center justify-between pt-4 p-4 bg-slate-50 rounded-2xl">
          <div>
            <p className="font-black text-sm text-slate-900">Ciudad Activa</p>
            <p className="text-[10px] text-slate-400 font-bold">Si se desactiva, no aparece en el selector de clientes</p>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6">
          <Button onClick={onCancel} variant="outline" className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest gap-2">
            <X className="w-4 h-4" /> Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest gap-2 bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Crear Ciudad' : 'Guardar Cambios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-12 rounded-xl font-bold text-slate-900 border-2 border-slate-200 focus:border-emerald-500" />
    </div>
  );
}

function NumField({ label, value, onChange, prefix, suffix, step }: { label: string; value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; step?: number }) {
  return (
    <div className="space-y-2">
      <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">{prefix}</span>}
        <Input type="number" step={step || 1} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`h-12 rounded-xl font-bold text-slate-900 border-2 border-slate-200 focus:border-emerald-500 ${prefix ? 'pl-8' : ''}`} />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{suffix}</span>}
      </div>
    </div>
  );
}
