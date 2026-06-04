'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:brightness-110 shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-slate-200',
  ghost: 'bg-transparent text-foreground hover:bg-secondary',
  destructive: 'bg-destructive text-destructive-foreground hover:brightness-110',
};
const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-12 px-5 text-base',
  lg: 'h-14 px-6 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, leftIcon, rightIcon, children, className, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all',
        'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

