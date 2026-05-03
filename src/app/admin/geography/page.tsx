"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, MapPin, Plus, Shield } from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useCityConfig } from '@/hooks/use-city-config';
import Link from 'next/link';
import { CityList } from './components/CityList';
import { CityEditor } from './components/CityEditor';
import { ZoneList } from './components/ZoneList';
import { ZoneEditor } from './components/ZoneEditor';
import type { CityConfig, ZoneConfig } from '@/lib/city-config';

type ViewMode = 'list' | 'edit-city' | 'zones' | 'edit-zone';

export default function GeographyPage() {
  const { isAdmin, isLoading: loadingProfile } = useProfile();
  const { activeCities, activeCitiesLoading } = useCityConfig();

  const [view, setView] = useState<ViewMode>('list');
  const [selectedCity, setSelectedCity] = useState<CityConfig | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneConfig | null>(null);
  const [isCreatingCity, setIsCreatingCity] = useState(false);
  const [isCreatingZone, setIsCreatingZone] = useState(false);

  if (loadingProfile || activeCitiesLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-md z-[500]">
        <div className="flex flex-col items-center gap-4">
          <Globe className="w-12 h-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Cargando Mapa Operativo...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-red-400 mx-auto" />
          <h1 className="text-2xl font-black text-slate-900">Acceso Restringido</h1>
          <p className="text-slate-500">Solo el Super Admin puede acceder a esta consola.</p>
          <Button asChild><Link href="/">Volver</Link></Button>
        </div>
      </div>
    );
  }

  const handleEditCity = (city: CityConfig) => {
    setSelectedCity(city);
    setIsCreatingCity(false);
    setView('edit-city');
  };

  const handleNewCity = () => {
    setSelectedCity(null);
    setIsCreatingCity(true);
    setView('edit-city');
  };

  const handleViewZones = (city: CityConfig) => {
    setSelectedCity(city);
    setView('zones');
  };

  const handleEditZone = (zone: ZoneConfig) => {
    setSelectedZone(zone);
    setIsCreatingZone(false);
    setView('edit-zone');
  };

  const handleNewZone = () => {
    setSelectedZone(null);
    setIsCreatingZone(true);
    setView('edit-zone');
  };

  const handleBack = () => {
    if (view === 'edit-zone') setView('zones');
    else if (view === 'zones') { setView('list'); setSelectedCity(null); }
    else setView('list');
  };

  const handleSaved = () => {
    if (view === 'edit-zone') setView('zones');
    else setView('list');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        {/* HEADER */}
        <div className="flex flex-col gap-8 mb-12 animate-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between">
            <button onClick={view === 'list' ? undefined : handleBack} className="group flex items-center gap-2 text-slate-400 font-bold hover:text-primary transition-colors">
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {view === 'list' ? <Link href="/admin/manage">Consola</Link> : view === 'zones' ? selectedCity?.name : 'Atrás'}
              </span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[32px] flex items-center justify-center text-white shadow-2xl">
                <Globe className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900 break-words">
                  {view === 'list' && 'Gestión Geográfica'}
                  {view === 'edit-city' && (isCreatingCity ? 'Nueva Ciudad' : 'Editar Ciudad')}
                  {view === 'zones' && `Zonas: ${selectedCity?.name}`}
                  {view === 'edit-zone' && (isCreatingZone ? 'Nueva Zona' : 'Editar Zona')}
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">
                  {activeCities.length} CIUDADES ACTIVAS • PRICING JERÁRQUICO
                </p>
              </div>
            </div>

            {view === 'list' && (
              <Button onClick={handleNewCity} className="rounded-full h-14 px-8 font-black text-xs uppercase tracking-widest gap-2 bg-emerald-600 shadow-xl hover:bg-emerald-700 transition-all active:scale-95">
                <Plus className="w-4 h-4" /> Nueva Ciudad
              </Button>
            )}
            {view === 'zones' && (
              <Button onClick={handleNewZone} className="rounded-full h-14 px-8 font-black text-xs uppercase tracking-widest gap-2 bg-blue-600 shadow-xl hover:bg-blue-700 transition-all active:scale-95">
                <MapPin className="w-4 h-4" /> Nueva Zona
              </Button>
            )}
          </div>
        </div>

        {/* CONTENT */}
        {view === 'list' && (
          <CityList cities={activeCities} onEdit={handleEditCity} onViewZones={handleViewZones} />
        )}
        {view === 'edit-city' && (
          <CityEditor city={isCreatingCity ? null : selectedCity} onSaved={handleSaved} onCancel={handleBack} />
        )}
        {view === 'zones' && selectedCity && (
          <ZoneList cityId={selectedCity.id} cityConfig={selectedCity} onEdit={handleEditZone} />
        )}
        {view === 'edit-zone' && selectedCity && (
          <ZoneEditor cityId={selectedCity.id} cityConfig={selectedCity} zone={isCreatingZone ? null : selectedZone} onSaved={handleSaved} onCancel={handleBack} />
        )}
      </main>

      <footer className="py-10 text-center opacity-30">
        <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-400">YAPIDO GEO • ADMIN v2.0</span>
      </footer>
    </div>
  );
}
