'use client';

import { useDeviceSize, DeviceSize } from '@/hooks/use-device-size';
import { cn } from '@/lib/utils';

export interface DeviceAwareContainerProps {
  children: React.ReactNode;
  className?: string;
  forceDevice?: DeviceSize;
}

export function DeviceAwareContainer({ 
  children, 
  className = '',
  forceDevice 
}: DeviceAwareContainerProps) {
  const deviceSize = useDeviceSize();
  const currentDevice = forceDevice || deviceSize;

  const containerClasses = {
    mobile: 'max-w-full mx-auto',
    tablet: 'max-w-3xl mx-auto',
    desktop: 'max-w-7xl mx-auto',
  };

  return (
    <div className={cn(containerClasses[currentDevice], 'w-full px-2 sm:px-4 lg:px-8', className)}>
      {children}
    </div>
  );
}

export interface DeviceGridLayoutProps {
  children: React.ReactNode;
  className?: string;
  forceDevice?: DeviceSize;
}

export function DeviceGridLayout({ 
  children, 
  className = '',
  forceDevice 
}: DeviceGridLayoutProps) {
  const deviceSize = useDeviceSize();
  const currentDevice = forceDevice || deviceSize;

  const gridClasses = {
    mobile: 'grid-cols-1 gap-3',
    tablet: 'grid-cols-2 gap-4 sm:gap-6',
    desktop: 'grid-cols-3 gap-6 xl:grid-cols-4',
  };

  return (
    <div className={cn('grid', gridClasses[currentDevice], className)}>
      {children}
    </div>
  );
}

export interface DeviceCardLayoutProps {
  children: React.ReactNode;
  className?: string;
  forceDevice?: DeviceSize;
}

export function DeviceCardLayout({ 
  children, 
  className = '',
  forceDevice 
}: DeviceCardLayoutProps) {
  const deviceSize = useDeviceSize();
  const currentDevice = forceDevice || deviceSize;

  const cardClasses = {
    mobile: 'rounded-2xl p-4',
    tablet: 'rounded-3xl p-5 sm:p-6',
    desktop: 'rounded-[1.5rem] p-6 xl:p-8',
  };

  const shadowClasses = {
    mobile: 'shadow-md',
    tablet: 'shadow-lg',
    desktop: 'shadow-xl',
  };

  return (
    <div className={cn(
      'bg-card transition-all duration-300',
      cardClasses[currentDevice],
      shadowClasses[currentDevice],
      className
    )}>
      {children}
    </div>
  );
}

export interface DeviceHeaderProps {
  children: React.ReactNode;
  className?: string;
  forceDevice?: DeviceSize;
  align?: 'left' | 'center' | 'right';
}

export function DeviceHeader({ 
  children, 
  className = '',
  forceDevice,
  align = 'left'
}: DeviceHeaderProps) {
  const deviceSize = useDeviceSize();
  const currentDevice = forceDevice || deviceSize;

  const sizeClasses = {
    mobile: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    tablet: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    desktop: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  };

  return (
    <div className={cn(
      'font-bold text-foreground',
      sizeClasses[currentDevice][align],
      currentDevice === 'mobile' && 'text-xl mb-3',
      currentDevice === 'tablet' && 'text-2xl mb-4',
      currentDevice === 'desktop' && 'text-3xl mb-6',
      className
    )}>
      {children}
    </div>
  );
}

export interface DeviceTextProps {
  children: React.ReactNode;
  className?: string;
  forceDevice?: DeviceSize;
  variant?: 'body' | 'caption' | 'label' | 'headline';
}

export function DeviceText({ 
  children, 
  className = '',
  forceDevice,
  variant = 'body'
}: DeviceTextProps) {
  const deviceSize = useDeviceSize();
  const currentDevice = forceDevice || deviceSize;

  const variantClasses = {
    body: {
      mobile: 'text-sm leading-relaxed',
      tablet: 'text-base leading-relaxed',
      desktop: 'text-lg leading-relaxed',
    },
    caption: {
      mobile: 'text-xs leading-normal',
      tablet: 'text-sm leading-normal',
      desktop: 'text-base leading-normal',
    },
    label: {
      mobile: 'text-xs font-semibold uppercase tracking-wide',
      tablet: 'text-sm font-semibold uppercase tracking-wide',
      desktop: 'text-sm font-bold uppercase tracking-wider',
    },
    headline: {
      mobile: 'text-2xl font-black leading-tight',
      tablet: 'text-3xl font-black leading-tight',
      desktop: 'text-4xl font-black leading-none',
    },
  };

  return (
    <div className={cn(
      'text-foreground',
      variantClasses[variant][currentDevice],
      className
    )}>
      {children}
    </div>
  );
}

export interface DeviceButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  forceDevice?: DeviceSize;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  disabled?: boolean;
}

export function DeviceButton({ 
  children, 
  onClick,
  className = '',
  forceDevice,
  variant = 'primary',
  fullWidth = false,
  disabled = false
}: DeviceButtonProps) {
  const deviceSize = useDeviceSize();
  const currentDevice = forceDevice || deviceSize;

  const sizeClasses = {
    mobile: 'h-12 px-5 text-sm',
    tablet: 'h-14 px-7 text-base',
    desktop: 'h-16 px-10 text-lg',
  };

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm active:scale-[0.98]',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-glow-emerald',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10',
    ghost: 'text-muted-foreground hover:bg-muted',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-full font-bold transition-all duration-300 focus-ring-cyber',
        sizeClasses[currentDevice],
        variantClasses[variant],
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}

export interface DeviceInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number';
  className?: string;
  forceDevice?: DeviceSize;
  error?: string;
}

export function DeviceInput({ 
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  className = '',
  forceDevice,
  error
}: DeviceInputProps) {
  const deviceSize = useDeviceSize();
  const currentDevice = forceDevice || deviceSize;

  const sizeClasses = {
    mobile: 'h-12 text-base px-3',
    tablet: 'h-14 text-lg px-4',
    desktop: 'h-16 text-xl px-5',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className={cn(
          'font-semibold text-foreground',
          currentDevice === 'mobile' && 'text-xs',
          currentDevice === 'tablet' && 'text-sm',
          currentDevice === 'desktop' && 'text-base'
        )}>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'w-full rounded-xl border bg-background text-foreground transition-all focus-ring-cyber',
          sizeClasses[currentDevice],
          error ? 'border-destructive' : 'border-input'
        )}
      />
      {error && (
        <p className={cn(
          'text-destructive',
          currentDevice === 'mobile' && 'text-[10px]',
          currentDevice === 'tablet' && 'text-xs',
          currentDevice === 'desktop' && 'text-sm'
        )}>
          {error}
        </p>
      )}
    </div>
  );
}

export interface DeviceBadgeProps {
  children: React.ReactNode;
  className?: string;
  forceDevice?: DeviceSize;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function DeviceBadge({ 
  children, 
  className = '',
  forceDevice,
  variant = 'default'
}: DeviceBadgeProps) {
  const deviceSize = useDeviceSize();
  const currentDevice = forceDevice || deviceSize;

  const sizeClasses = {
    mobile: 'text-[10px] min-w-[18px] h-[18px] px-1.5',
    tablet: 'text-xs min-w-[22px] h-[22px] px-2',
    desktop: 'text-sm min-w-[24px] h-[24px] px-2.5',
  };

  const variantClasses = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-secondary/10 text-secondary',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    error: 'bg-destructive/10 text-destructive',
    info: 'bg-cyber-violet/10 text-cyber-violet',
  };

  return (
    <span className={cn(
      'inline-flex items-center justify-center rounded-full font-bold',
      sizeClasses[currentDevice],
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}

export interface DeviceSpacingProps {
  children: React.ReactNode;
  className?: string;
  forceDevice?: DeviceSize;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function DeviceSpacing({ 
  children, 
  className = '',
  forceDevice,
  size = 'md'
}: DeviceSpacingProps) {
  const deviceSize = useDeviceSize();
  const currentDevice = forceDevice || deviceSize;

  const spacingMultipliers = {
    mobile: 1,
    tablet: 1.25,
    desktop: 1.5,
  };

  const baseSpacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  };

  const multiplier = spacingMultipliers[currentDevice];
  const spacing = baseSpacing[size] * multiplier;

  return (
    <div 
      className={className} 
      style={{ padding: `${spacing}px` }}
    >
      {children}
    </div>
  );
}

export { useDeviceSize, DeviceSize };