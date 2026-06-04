'use client';

import { cn } from '@/lib/utils';

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const map: Record<string, { label: string; tone: string }> = {
    searching:    { label: 'Buscando',         tone: 'bg-amber-100 text-amber-800' },
    offered:      { label: 'Ofreciendo',       tone: 'bg-amber-100 text-amber-800' },
    accepted:     { label: 'Aceptado',         tone: 'bg-blue-100 text-blue-800' },
    arriving:     { label: 'Conductor llegando', tone: 'bg-blue-100 text-blue-800' },
    in_progress:  { label: 'En viaje',         tone: 'bg-primary/15 text-primary' },
    completed:    { label: 'Finalizado',       tone: 'bg-emerald-100 text-emerald-800' },
    rated:        { label: 'Calificado',       tone: 'bg-emerald-100 text-emerald-800' },
    cancelled:    { label: 'Cancelado',        tone: 'bg-slate-200 text-slate-700' },
    no_drivers:   { label: 'Sin conductores',  tone: 'bg-red-100 text-red-800' },
  };
  const it = map[status] ?? { label: status, tone: 'bg-slate-200 text-slate-700' };
  return (
    <span className={cn('inline-flex items-center px-3 h-7 rounded-full text-xs font-medium', it.tone, className)}>
      {it.label}
    </span>
  );
}

