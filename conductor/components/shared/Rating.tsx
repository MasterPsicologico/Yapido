'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Rating({ score, size = 'md', className }: { score: number; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const px = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  return (
    <div className={cn('inline-flex items-center gap-1 font-semibold', className)}>
      <Star className="text-amber-500 fill-amber-500" size={px} />
      <span>{score.toFixed(1)}</span>
    </div>
  );
}

