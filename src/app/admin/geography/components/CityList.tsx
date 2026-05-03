"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Settings, Layers, ChevronRight, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CityConfig } from '@/lib/city-config';

interface CityListProps {
  cities: CityConfig[];
  onEdit: (city: CityConfig) => void;
  onViewZones: (city: CityConfig) => void;
}

export function CityList({ cities, onEdit, onViewZones }: CityListProps) {
  if (!cities.length) {
    return (
      <div className="py-24 text-center space-y-6 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
        <MapPin className="w-16 h-16 text-slate-200 mx-auto" />
        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-400">Sin ciudades configuradas</h3>
        <p className="text-slate-400 text-sm">Agrega tu primera ciudad para empezar a operar.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 pb-20">
      {cities.map((city) => (
        <Card key={city.id} className="group border-none rounded-[32px] shadow-sm bg-white overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 ring-1 ring-black/[0.03]">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              {/* Indicador de color */}
              <div className="w-full sm:w-3 bg-gradient-to-b from-emerald-400 to-teal-600 sm:rounded-l-[32px]" />

              <div className="flex-1 p-6 sm:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {city.name}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {city.department}, {city.country}
                    </p>
                  </div>
                  <Badge className={cn(
                    "text-[8px] font-black uppercase px-3 border-none",
                    city.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                  )}>
                    {city.active ? 'ACTIVA' : 'INACTIVA'}
                  </Badge>
                </div>

                {/* Pricing Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <PricingStat label="Mín. Horas" value={`${city.minHours}h`} />
                  <PricingStat label="Tarifa Auto" value={`$${city.rateAuto.toLocaleString()}/h`} />
                  <PricingStat label="Tarifa Semi" value={`$${city.rateSemi.toLocaleString()}/h`} />
                  <PricingStat label="Fee Piso" value={`$${city.floorFee.toLocaleString()}`} />
                  <PricingStat label="Fee Escaleras" value={`$${city.stairsFee.toLocaleString()}`} />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button onClick={() => onEdit(city)} variant="outline" className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest gap-2 border-2 border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-all">
                    <DollarSign className="w-4 h-4" /> Editar Pricing
                  </Button>
                  <Button onClick={() => onViewZones(city)} className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest gap-2 bg-slate-900 hover:bg-emerald-600 transition-all">
                    <Layers className="w-4 h-4" /> Ver Zonas <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PricingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}
