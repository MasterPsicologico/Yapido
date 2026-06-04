'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full bg-card border border-input rounded-xl px-4 h-12 text-foreground',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        className
      )}
      {...rest}
    />
  );
});

