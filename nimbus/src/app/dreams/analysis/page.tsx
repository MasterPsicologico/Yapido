'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { DreamInterpretationDoc } from '@/lib/types';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useAuth, useFirestore, useDocument } from '@/firebase';
import { doc } from 'firebase/firestore';
import anime from 'animejs';
import '../dreams.css';

export default function DreamAnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const firestore = useFirestore();

  const dreamId = useMemo(() => searchParams.get('id'), [searchParams]);

  const dreamRef = useMemo(
      () => (user && firestore && dreamId ? doc(firestore, `users/${user.uid}/dreams`, dreamId) : undefined),
      [user, firestore, dreamId]
  );

  const { data: dreamDoc, loading } = useDocument<DreamInterpretationDoc>(dreamRef);

  const analysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !dreamDoc && dreamId) {
      toast({ variant: "destructive", title: "Análisis no encontrado", description: "No pudimos encontrar este sueño en tu diario." });
      router.push('/dreams');
    }
  }, [loading, dreamDoc, dreamId, router, toast]);

  useEffect(() => {
    if (typeof window === 'undefined' || loading || !dreamDoc || !analysisRef.current) return;

    anime({
      targets: analysisRef.current,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 1000,
      easing: 'easeOutExpo',
    });

    anime({
      targets: '.dream-analysis-content h1',
      backgroundPosition: ['0% 50%', '200% 50%'],
      duration: 3000,
      delay: 400,
      easing: 'easeInOutQuad',
    });
  }, [loading, dreamDoc]);

  const interpretationText = dreamDoc?.interpretation?.interpretationText;

  if (loading) {
    return (
      <div className="dream-loading">
        <div className="dream-loading-spinner" />
        <p className="dream-loading-text">Cargando tu universo interior...</p>
      </div>
    );
  }

  if (!interpretationText) {
    return (
      <div className="dream-analysis-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', color: 'hsl(220, 30%, 70%)', marginBottom: '16px' }}>No se encontró el análisis del sueño.</p>
             <Link href="/dreams" className="dream-analysis-back">
                <ChevronLeft style={{ width: '16px', height: '16px' }} />
                Volver al Portal
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dream-analysis-page">
      <div className="dream-stars" suppressHydrationWarning>
        {Array.from({ length: 16 }, (_, i) => {
          const size = i < 3 ? 3 : 1.5;
          return (
            <div key={i} className={`dream-star ${i < 3 ? 'dream-star--lg' : ''}`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${(i * 7 + 5) % 100}%`,
                top: `${(i * 13 + 8) % 100}%`,
              }} />
          );
        })}
      </div>

      <div className="dream-analysis-container">
        <Link href="/dreams" className="dream-analysis-back">
          <ChevronLeft style={{ width: '16px', height: '16px' }} />
          Volver al Portal
        </Link>

        <div ref={analysisRef} className="dream-analysis-content" style={{ opacity: 0 }}>
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="dream-analysis-content h1" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="dream-analysis-content h2" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="dream-analysis-content p" {...props} />
              ),
              ul: ({ node, ...props }) => <ul {...props} />,
              li: ({ node, ...props }) => <li {...props} />,
            }}
          >
            {interpretationText}
          </ReactMarkdown>
        </div>

        <div className="dream-reflection" style={{ opacity: 0 }}>
          <h3 className="dream-reflection-title">Continúa la Exploración</h3>
          <p className="dream-reflection-desc">Usa este espacio para escribir tus propias reflexiones sobre la interpretación.</p>
          <textarea
            placeholder="Mis pensamientos sobre esto son..."
            className="dream-reflection-textarea"
          />
        </div>
      </div>
    </div>
  );
}