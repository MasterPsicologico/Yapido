
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { ResponsiveHero } from './ResponsiveHero';
import { WelcomeFeatureCards } from './WelcomeFeatureCards';
import { AdminWelcomeControls } from './AdminWelcomeControls';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';

interface WelcomeLandingProps {
  isAdmin: boolean;
  config: any;
  onUpdateConfig: (data: any) => void;
}

export function WelcomeLanding({ isAdmin, config, onUpdateConfig }: WelcomeLandingProps) {
  const [isUploading, setIsUploading] = useState<'mobile' | 'pc' | null>(null);

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 overflow-x-hidden selection:bg-primary selection:text-white">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center relative">
        {/* FONDO GRADIENTE PROFUNDO */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black z-0" />
        
        {/* COMPONENTE ATÓMICO: HERO RESPONSIVO INTERACTIVO */}
        <ResponsiveHero 
          bgMobile={config?.bgMobile} 
          bgDesktop={config?.bgDesktop} 
        />

        {/* COMPONENTE ATÓMICO: CONTROLES DE ADMINISTRADOR */}
        {isAdmin && (
          <AdminWelcomeControls 
            isUploading={isUploading} 
            onUpload={handleImageUpload} 
          />
        )}

        {/* COMPONENTE ATÓMICO: BENEFICIOS */}
        <div className="container mx-auto px-4 max-w-2xl -mt-12 relative z-20 pb-20">
          <WelcomeFeatureCards />
        </div>
      </main>

      <footer className="py-10 text-center relative z-10 border-t border-white/5 bg-black/20">
        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.5em]">Vitriniando AI Central • Aguachica Élite</p>
      </footer>
    </div>
  );
}
