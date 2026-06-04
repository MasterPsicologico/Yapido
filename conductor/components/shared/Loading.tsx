'use client';

import { cn } from '@/lib/utils';

export function Loading({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 text-muted-foreground', className)}>
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
      </div>
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

