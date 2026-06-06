"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveIndicatorProps {
  status?: 'idle' | 'typing' | 'saved';
  className?: string;
}

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  if (!status || status === 'idle') return null;

  return (
    <div className={cn("absolute z-20 flex items-center justify-center pointer-events-none transition-all duration-300", className)}>
      {status === 'typing' && (
        <div className="flex gap-1 items-center bg-white/80 backdrop-blur-sm px-2 py-1.5 rounded-full shadow-sm border border-slate-100 animate-in fade-in">
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
      {status === 'saved' && (
        <div className="bg-emerald-100 rounded-full p-1 shadow-sm border border-emerald-200 animate-in zoom-in duration-300">
          <Check className="w-4 h-4 text-emerald-600" />
        </div>
      )}
    </div>
  );
}
