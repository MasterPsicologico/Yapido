'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { BrainCircuit, Sparkles, Sprout, Footprints, Loader2 } from 'lucide-react';
import type { DreamSpecialist } from '@/lib/types';
import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';

const specialists: DreamSpecialist[] = [
  {
    name: 'El Psicólogo Junguiano',
    title: 'Análisis Profundo',
    description: 'Explora arquetipos, sombras y el lenguaje del subconsciente para un entendimiento psicológico.',
    perspective: 'psychological',
    icon: BrainCircuit,
  },
  {
    name: 'El Intérprete Simbólico',
    title: 'Diccionario Personal',
    description: 'Decodifica cada símbolo de tu sueño, conectándolo con tu vida y tus emociones personales.',
    perspective: 'symbolic',
    icon: Sparkles,
  },
  {
    name: 'El Guía Espiritual',
    title: 'Mensaje del Alma',
    description: 'Descubre las lecciones, advertencias y guías que tu ser superior o el universo te envían.',
    perspective: 'spiritual',
    icon: Sprout,
  },
  {
    name: 'El Onironauta Chamánico',
    title: 'Viaje Energético',
    description: 'Interpreta el sueño como un viaje a otros planos para recuperar energía y encontrar animales de poder.',
    perspective: 'shamanic',
    icon: Footprints,
  },
];

const SPEC_CLASS_MAP: Record<string, string> = {
  psychological: 'dream-spec--psychological',
  symbolic: 'dream-spec--symbolic',
  spiritual: 'dream-spec--spiritual',
  shamanic: 'dream-spec--shamanic',
};

interface DreamSpecialistSelectionProps {
  onSelectSpecialist: (specialist: DreamSpecialist) => void;
  isLoading: boolean;
}

export default function DreamSpecialistSelection({ onSelectSpecialist, isLoading }: DreamSpecialistSelectionProps) {
  const [selected, setSelected] = useState<DreamSpecialist | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headerRef.current || !gridRef.current) return;

    const tl = anime.timeline({ easing: 'easeOutCubic' });
    tl.add({ targets: headerRef.current, opacity: [0, 1], translateY: [-20, 0], duration: 800 }, 0);
    tl.add({ targets: '.dream-specialist-card', opacity: [0, 1], translateY: [40, 0], scale: [0.92, 1], delay: anime.stagger(120, { start: 200 }), duration: 700 }, 100);

    return () => {
      anime.remove('.dream-specialist-card');
    };
  }, []);

  const handleSelect = (specialist: DreamSpecialist) => {
    setSelected(specialist);

    const cardEl = document.querySelector(`[data-spec="${specialist.perspective}"]`);
    if (cardEl) {
      anime({
        targets: cardEl,
        scale: [1, 1.03, 1],
        duration: 500,
        easing: 'easeInOutQuad',
      });
    }

    anime({
      targets: '.dream-specialist-card:not([data-spec="' + specialist.perspective + '"])',
      opacity: [1, 0.4],
      scale: [1, 0.97],
      duration: 400,
      easing: 'easeOutCubic',
    });

    setTimeout(() => onSelectSpecialist(specialist), 300);
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '32px 20px' }}>
       <div ref={headerRef} style={{ textAlign: 'center', marginBottom: '40px', opacity: 0 }}>
           <h2 className="dream-hero-title" style={{ marginBottom: '12px' }}>Elige tu Guía Onírico</h2>
           <p className="dream-hero-subtitle">¿Desde qué perspectiva quieres interpretar tu sueño?</p>
       </div>

       <div ref={gridRef} className="dream-specialist-grid">
         {specialists.map((specialist, index) => {
           const Icon = specialist.icon;
           const isThisLoading = isLoading && selected?.perspective === specialist.perspective;
           const specClass = SPEC_CLASS_MAP[specialist.perspective] || '';
           return (
             <div
               key={specialist.perspective}
               data-spec={specialist.perspective}
               className={`dream-specialist-card ${specClass}`}
               style={{ opacity: 0 }}
               onClick={() => !isLoading && handleSelect(specialist)}
             >
               <div className="dream-spec-icon">
                 <Icon style={{ width: '24px', height: '24px' }} />
                 <div className="dream-glow-ring" />
               </div>
               <div className="dream-spec-name">{specialist.name}</div>
               <div className="dream-spec-title">{specialist.title}</div>
               <div className="dream-spec-desc">{specialist.description}</div>
               <button
                 className="dream-spec-btn"
                 onClick={(e) => { e.stopPropagation(); !isLoading && handleSelect(specialist); }}
                 disabled={isLoading}
               >
                  {isThisLoading ? (
                      <>
                        <Loader2 style={{ width: '16px', height: '16px', animation: 'dream-spin 1s linear infinite' }} />
                        Analizando...
                      </>
                  ) : 'Elegir'}
               </button>
             </div>
           );
         })}
       </div>
    </div>
  );
}
