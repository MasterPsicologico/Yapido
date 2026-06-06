"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, X, Loader2, ArrowDown } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { slugify } from '@/lib/city-config';
import { cn } from '@/lib/utils';
import type { CityConfig, ZoneConfig } from '@/lib/city-config';

interface ZoneEditorProps {
  cityId: string;
  cityConfig: CityConfig;
  zone: ZoneConfig | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function ZoneEditor({ cityId, cityConfig, zone, onSaved, onCancel }: ZoneEditorProps) {
  const firestore = useFirestore();
  const isNew = !zone;

  const [name, setName] = useState(zone?.name || '');
  const [description, setDescription] = useState(zone?.description || '');
  const [active, setActive] = useState(zone?.active ?? true);
  const [saving, setSaving] = useState(false);

  // Override toggles + values
  const [overrideMinHours, setOverrideMinHours] = useState(zone?.minHours != null);
  const [minHours, setMinHours] = useState(zone?.minHours ?? cityConfig.minHours);

  const [overrideRateAuto, setOverrideRateAuto] = useState(zone?.rateAuto != null);
  const [rateAuto, setRateAuto] = useState(zone?.rateAuto ?? cityConfig.rateAuto);

  const [overrideRateSemi, setOverrideRateSemi] = useState(zone?.rateSemi != null);
  const [rateSemi, setRateSemi] = useState(zone?.rateSemi ?? cityConfig.rateSemi);

  const [overrideFloorFee, setOverrideFloorFee] = useState(zone?.floorFee != null);
  const [floorFee, setFloorFee] = useState(zone?.floorFee ?? cityConfig.floorFee);

  const [overrideStairsFee, setOverrideStairsFee] = useState(zone?.stairsFee != null);
  const [stairsFee, setStairsFee] = useState(zone?.stairsFee ?? cityConfig.stairsFee);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const zoneId = zone?.id || slugify(name);
      const data: any = {
        name: name.trim(),
        description: description.trim(),
        active,
        updatedAt: serverTimestamp(),
      };
      if (isNew) data.createdAt = serverTimestamp();

      // Solo guardar fields con override activo
      if (overrideMinHours) data.minHours = minHours; else data.minHours = null;
      if (overrideRateAuto) data.rateAuto = rateAuto; else data.rateAuto = null;
      if (overrideRateSemi) data.rateSemi = rateSemi; else data.rateSemi = null;
      if (overrideFloorFee) data.floorFee = floorFee; else data.floorFee = null;
      if (overrideStairsFee) data.stairsFee = stairsFee; else data.stairsFee = null;

      await setDoc(doc(firestore, 'cities', cityId, 'zones', zoneId), data, { merge: true });
      onSaved();
    } catch (err) {
      console.error('Error saving zone:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-none rounded-[32px] shadow-sm bg-white ring-1 ring-black/[0.03]">
      <CardContent className="p-8 space-y-8">
        {/* Info Básica */}
        <div className="space-y-1">
          <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em]">Información de la Zona</h3>
          <div className="h-0.5 w-12 bg-blue-500 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre del Barrio / Sector</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Aranjuez" className="h-12 rounded-xl font-bold text-slate-900 border-2 border-slate-200 focus:border-blue-500" />
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descripción (Opcional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Zona norte de la ciudad" className="h-12 rounded-xl font-bold text-slate-900 border-2 border-slate-200 focus:border-blue-500" />
          </div>
        </div>

        {/* Pricing Overrides */}
        <div className="space-y-1 pt-4">
          <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em]">Pricing de la Zona</h3>
          <p className="text-[10px] text-slate-400 font-bold">Activa el toggle para personalizar. Si no, hereda de {cityConfig.name}.</p>
          <div className="h-0.5 w-12 bg-blue-500 rounded-full" />
        </div>

        <div className="space-y-4">
          <OverrideField label="Horas Mínimas" cityValue={cityConfig.minHours} suffix="horas" value={minHours} onChange={setMinHours} isOverride={overrideMinHours} onToggle={setOverrideMinHours} />
          <OverrideField label="Tarifa Automática" cityValue={cityConfig.rateAuto} prefix="$" suffix="/h" value={rateAuto} onChange={setRateAuto} isOverride={overrideRateAuto} onToggle={setOverrideRateAuto} />
          <OverrideField label="Tarifa Semiautomática" cityValue={cityConfig.rateSemi} prefix="$" suffix="/h" value={rateSemi} onChange={setRateSemi} isOverride={overrideRateSemi} onToggle={setOverrideRateSemi} />
          <OverrideField label="Fee Piso Extra" cityValue={cityConfig.floorFee} prefix="$" value={floorFee} onChange={setFloorFee} isOverride={overrideFloorFee} onToggle={setOverrideFloorFee} />
          <OverrideField label="Fee Escaleras" cityValue={cityConfig.stairsFee} prefix="$" value={stairsFee} onChange={setStairsFee} isOverride={overrideStairsFee} onToggle={setOverrideStairsFee} />
        </div>

        {/* Toggle activo */}
        <div className="flex items-center justify-between pt-4 p-4 bg-slate-50 rounded-2xl">
          <div>
            <p className="font-black text-sm text-slate-900">Zona Activa</p>
            <p className="text-[10px] text-slate-400 font-bold">Si se desactiva, no aparece en el selector del formulario</p>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6">
          <Button onClick={onCancel} variant="outline" className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest gap-2">
            <X className="w-4 h-4" /> Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest gap-2 bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Crear Zona' : 'Guardar Zona'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OverrideField({ label, cityValue, value, onChange, prefix, suffix, isOverride, onToggle }: {
  label: string; cityValue: number; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; isOverride: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <div className={cn("p-4 rounded-2xl border-2 transition-all", isOverride ? "bg-blue-50/50 border-blue-200" : "bg-slate-50 border-slate-100")}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
          <span className={cn("text-[7px] font-black uppercase px-2 py-0.5 rounded-full", isOverride ? "bg-blue-200 text-blue-700" : "bg-slate-200 text-slate-500")}>
            {isOverride ? 'PERSONALIZADO' : `HEREDA: ${prefix || ''}${cityValue.toLocaleString()}${suffix || ''}`}
          </span>
        </div>
        <Switch checked={isOverride} onCheckedChange={onToggle} />
      </div>
      {isOverride && (
        <div className="relative animate-in slide-in-from-top-2 duration-300">
          {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">{prefix}</span>}
          <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className={cn("h-12 rounded-xl font-bold text-slate-900 border-2 border-blue-300 focus:border-blue-500 bg-white", prefix ? "pl-8" : "")} />
          {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{suffix}</span>}
        </div>
      )}
    </div>
  );
}
