
"use client";

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FavoritesTriggerProps {
  totalCount: number;
}

export function FavoritesTrigger({ totalCount }: FavoritesTriggerProps) {
  return (
    <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 transition-colors h-8 w-8 sm:h-9 sm:w-9">
      <Heart className={cn("w-4 h-4 sm:w-4.5 sm:h-4.5 transition-all", totalCount > 0 ? "text-rose-500 fill-rose-500" : "text-slate-400")} />
      {totalCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[7px] sm:text-[8px] font-black w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in">
          {totalCount}
        </span>
      )}
    </Button>
  );
}
