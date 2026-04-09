"use client";

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChallengeStatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  className?: string;
}

/**
 * ChallengeStatCard - Componente Atómico: Cuadrante Informativo Élite.
 * Diseñado para representar métricas de rendimiento con alta legibilidad.
 */
export function ChallengeStatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  className
}: ChallengeStatCardProps) {
  return (
    <div className={cn(
      "bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center text-center sm:flex-row sm:text-left gap-3 shadow-sm overflow-hidden min-w-0 transition-all hover:shadow-md",
      className
    )}>
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
        iconBg
      )}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-1">
          {label}
        </p>
        <p className={cn(
          "text-xl font-black italic tracking-tighter leading-none truncate",
          iconColor === 'text-primary' ? "text-primary" : "text-slate-900"
        )}>
          {value}
        </p>
      </div>
    </div>
  );
}
