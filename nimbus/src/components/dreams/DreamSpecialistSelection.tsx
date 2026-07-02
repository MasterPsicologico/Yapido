'use client';

import { motion } from 'framer-motion';
import { BrainCircuit, Sparkles, Sprout, Footprints, Loader2 } from 'lucide-react';
import type { DreamSpecialist } from '@/lib/types';
import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import {
  bindTiltParallax,
  animateSpecialistBreathing,
  spawnWaterRipple,
  EASE,
  TIMING,
} from '@/app/dreams/dream-animations';

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

    // Fragmentación aurora del header
    const headerTitle = headerRef.current.querySelector<HTMLElement>('.dream-hero-title');
    if (headerTitle) {
      const txt = headerTitle.textContent || '';
      headerTitle.innerHTML = '';
      const chars: HTMLSpanElement[] = [];
      txt.split('').forEach((c) => {
        const span = document.createElement('span');
        span.className = 'dream-hero-char';
        span.textContent = c === ' ' ? '\u00A0' : c;
        headerTitle.appendChild(span);
        chars.push(span);
      });
      anime.set(chars, { opacity: 0, translateY: [40, 0], rotateZ: anime.random(-20, 20), scale: 0.5 });
      anime({
        targets: chars,
        opacity: [0, 1],
        scale: [0.5, 1],
        rotateZ: [anime.random(-20, 20), 0],
        translateY: [40, 0],
        color: [
          { value: '#93c5fd', duration: 800 },
          { value: '#a5b4fc', duration: 800 },
          { value: '#c4b5fd', duration: 800 },
        ],
        delay: anime.stagger(28),
        duration: TIMING.slow,
        easing: EASE.spring,
      });
    }

    // Stagger orbital 3D para entrar las cards
    const cards = Array.from(gridRef.current.querySelectorAll<HTMLElement>('.dream-specialist-card'));
    anime.set(cards, {
      opacity: 0,
      translateY: 100,
      rotateX: -30,
      scale: 0.8,
    });

    cards.forEach((card, i) => {
      bindTiltParallax(card, 25);
      const accent = (card.style.getPropertyValue('--spec-accent') || '#93c5fd');
      animateSpecialistBreathing(card, accent);
    });

    anime({
      targets: cards,
      opacity: [0, 1],
      translateY: [100, 0],
      rotateX: [-30, 0],
      scale: [0.8, 1],
      delay: anime.stagger(160, { start: 300 }),
      duration: TIMING.slow,
      easing: EASE.elastic,
    });

    return () => {
      anime.remove(cards);
      cards.forEach(c => c.replaceWith(c.cloneNode(true)));
    };
  }, []);

  const handleSelect = (specialist: DreamSpecialist) => {
    setSelected(specialist);

    const cardEl = document.querySelector(`[data-spec="${specialist.perspective}"]`) as HTMLElement;
    if (cardEl) {
      // Wave ripple from card center
      const rect = cardEl.getBoundingClientRect();
      const accent = getComputedStyle(cardEl).getPropertyValue('--spec-accent') || '#93c5fd';
      spawnWaterRipple(rect.left + rect.width / 2, rect.top + rect.height / 2, accent);

      // Selected card: magnetic pull + pulse
      anime({
        targets: cardEl,
        scale: [1, 1.08, 1.02],
        rotateY: [0, 8, -4, 0],
        boxShadow: [
          '0 0 0px transparent',
          `0 0 50px ${accent}`,
          `0 0 20px ${accent}`,
        ],
        duration: 800,
        easing: EASE.spring,
      });
    }

    // Non-selected cards fade out
    anime({
      targets: '.dream-specialist-card:not([data-spec="' + specialist.perspective + '"])',
      opacity: [1, 0.2],
      scale: [1, 0.9],
      translateY: [0, 30],
      filter: ['blur(0px)', 'blur(3px)'],
      duration: 600,
      easing: EASE.cubic,
    });

    setTimeout(() => onSelectSpecialist(specialist), 400);
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
