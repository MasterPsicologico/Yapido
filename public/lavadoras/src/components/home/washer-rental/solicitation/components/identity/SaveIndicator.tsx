"use client";

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveIndicatorProps {
  status?: 'idle' | 'typing' | 'saved';
  className?: string;
}

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  // Solo mostrar indicador cuando está guardado (saved), no en typing
  if (!status || status !== 'saved') return null;

  return (
    <div className={cn("absolute z-20 flex items-center justify-center pointer-events-none transition-all duration-300", className)}>
      <div className="bg-emerald-100 rounded-full p-1 shadow-sm border border-emerald-200 animate-in zoom-in duration-300">
        <Check className="w-4 h-4 text-emerald-600" />
      </div>
    </div>
  );
}
