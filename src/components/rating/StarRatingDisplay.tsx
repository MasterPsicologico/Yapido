
"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingDisplayProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { star: 'w-3 h-3', text: 'text-[9px]', gap: 'gap-0.5' },
  md: { star: 'w-4 h-4', text: 'text-xs', gap: 'gap-0.5' },
  lg: { star: 'w-5 h-5', text: 'text-sm', gap: 'gap-1' },
};

export function StarRatingDisplay({ 
  rating, 
  maxStars = 5, 
  size = 'sm', 
  showNumber = true, 
  className 
}: StarRatingDisplayProps) {
  const config = SIZE_MAP[size];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className={cn("flex items-center", config.gap, className)}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className={cn(config.star, "text-yellow-400 fill-yellow-400")} />
      ))}

      {/* Half star */}
      {hasHalf && (
        <div className="relative">
          <Star className={cn(config.star, "text-slate-200")} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={cn(config.star, "text-yellow-400 fill-yellow-400")} />
          </div>
        </div>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className={cn(config.star, "text-slate-200")} />
      ))}

      {/* Number */}
      {showNumber && (
        <span className={cn("font-black text-slate-600 ml-1", config.text)}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
