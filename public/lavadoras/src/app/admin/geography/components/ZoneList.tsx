"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Settings, ArrowRight } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { resolveZonePricing } from '@/lib/city-config';
import type { CityConfig, ZoneConfig } from '@/lib/city-config';

interface ZoneListProps {
  cityId: string;
  cityConfig: CityConfig;
  onEdit: (zone: ZoneConfig) => void;
}

export function ZoneList({ cityId, cityConfig, onEdit }: ZoneListProps) {
  const firestore = useFirestore();

  const zonesQuery = useMemoFirebase(
    () => collection(firestore, 'cities', cityId, 'zones'),
    [firestore, cityId]
  );
  const { data: zonesRaw, isLoading } = useCollection(zonesQuery);

  const zones: ZoneConfig[] = (zonesRaw || []).map((z: any) => ({
    id: z.id,
    name: z.name || z.id,
    active: z.active !== false,
    description: z.description || '',
    rateAuto: z.rateAuto != null ? Number(z.rateAuto) : undefined,
    rateSemi: z.rateSemi != null ? Number(z.rateSemi) : undefined,
    minHours: z.minHours != null ? Number(z.minHours) : undefined,
    floorFee: z.floorFee != null ? Number(z.floorFee) : undefined,
    stairsFee: z.stairsFee != null ? Number(z.stairsFee) : undefined,
  }));

  if (isLoading) {
    return <div className="py-16 text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Cargando zonas...</p></div>;
  }

  if (!zones.length) {
    return (
      <div className="py-24 text-center space-y-6 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
        <MapPin className="w-16 h-16 text-slate-200 mx-auto" />
        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-400">Sin zonas configuradas</h3>
        <p className="text-slate-400 text-sm">Esta ciudad opera con pricing general. Agrega zonas para pricing por barrio.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 pb-20">
      {/* Info card */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 mb-2">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
          💡 Los campos con badge "HEREDA" usan el pricing base de {cityConfig.name}. Los badges "OVERRIDE" tienen valor propio.
        </p>
      </div>

      {zones.map((zone) => {
        const resolved = resolveZonePricing(cityConfig, zone);
        const hasOverrides = [zone.rateAuto, zone.rateSemi, zone.minHours, zone.floorFee, zone.stairsFee].some(v => v != null);

        return (
          <Card key={zone.id} className="group border-none rounded-[24px] shadow-sm bg-white overflow-hidden hover:shadow-lg transition-all ring-1 ring-black/[0.03]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">{zone.name}</h3>
                    <Badge className={cn("text-[7px] font-black uppercase border-none", zone.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")}>
                      {zone.active ? 'ACTIVA' : 'INACTIVA'}
                    </Badge>
                    {hasOverrides && <Badge className="text-[7px] font-black uppercase bg-blue-100 text-blue-700 border-none">OVERRIDE</Badge>}
                  </div>
                  {zone.description && <p className="text-xs text-slate-400">{zone.description}</p>}
                </div>
                <Button onClick={() => onEdit(zone)} size="sm" variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-1 border-2 hover:border-blue-500 hover:text-blue-600">
                  <Settings className="w-3 h-3" /> Editar
                </Button>
              </div>

              {/* Pricing grid */}
              <div className="grid grid-cols-5 gap-2">
                <ZonePricingCell label="Mín. Horas" value={`${resolved.minHours}h`} isOverride={zone.minHours != null} />
                <ZonePricingCell label="Auto" value={`$${resolved.rateAuto.toLocaleString()}`} isOverride={zone.rateAuto != null} />
                <ZonePricingCell label="Semi" value={`$${resolved.rateSemi.toLocaleString()}`} isOverride={zone.rateSemi != null} />
                <ZonePricingCell label="Piso" value={`$${resolved.floorFee.toLocaleString()}`} isOverride={zone.floorFee != null} />
                <ZonePricingCell label="Escaleras" value={`$${resolved.stairsFee.toLocaleString()}`} isOverride={zone.stairsFee != null} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ZonePricingCell({ label, value, isOverride }: { label: string; value: string; isOverride: boolean }) {
  return (
    <div className={cn("p-2.5 rounded-xl text-center border", isOverride ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100")}>
      <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <span className="text-xs font-black text-slate-900">{value}</span>
      <div className="mt-1">
        <span className={cn("text-[6px] font-black uppercase", isOverride ? "text-blue-500" : "text-slate-300")}>
          {isOverride ? 'OVERRIDE' : 'HEREDA'}
        </span>
      </div>
    </div>
  );
}
