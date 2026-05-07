'use client';

import { useDeviceSize, DeviceSize } from '@/hooks/use-device-size';
import { useUser } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export interface VisualDesignProps {
  children: React.ReactNode;
  className?: string;
}

export function VisualDesignSystem({ children, className = '' }: VisualDesignProps) {
  const deviceSize = useDeviceSize();
  const { user, isUserLoading } = useUser();
  const { isAdmin } = useProfile();
  const pathname = usePathname() || '/';

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div 
      className={`visual-design-system ${deviceSize} ${className}`}
      data-device={deviceSize}
      data-pathname={pathname}
    >
      {children}
    </div>
  );
}

export interface DeviceLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebar?: React.ReactNode;
}

export function DeviceResponsiveLayout({ children, showSidebar = false, sidebar }: DeviceLayoutProps) {
  const deviceSize = useDeviceSize();

  if (deviceSize === 'desktop' && showSidebar && sidebar) {
    return (
      <div className="layout-with-sidebar">
        <aside className="layout-sidebar">
          {sidebar}
        </aside>
        <main className="layout-main app-container">
          {children}
        </main>
      </div>
    );
  }

  return (
    <main className="app-container">
      {children}
    </main>
  );
}

export interface DeviceCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'holo' | 'aurora';
}

export function DeviceCard({ children, className = '', variant = 'default' }: DeviceCardProps) {
  const baseClasses = 'responsive-card shadow-responsive border-responsive';
  
  const variantClasses = {
    default: 'bg-card',
    glass: 'glass glass-rim-light',
    holo: 'holo-border',
    aurora: 'aurora aurora-responsive glass',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

export interface DeviceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export function DeviceButton({ 
  children, 
  size = 'md', 
  variant = 'primary',
  className = '',
  ...props 
}: DeviceButtonProps) {
  const deviceSize = useDeviceSize();

  const sizeClasses = {
    sm: 'h-10 px-3 text-sm',
    md: 'action-button-mobile min-h-[48px] px-4 py-3 text-base',
    lg: 'min-h-[56px] px-6 py-4 text-lg',
    xl: 'min-h-[64px] px-8 py-5 text-xl font-extrabold',
  };

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-glow-emerald',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10',
    ghost: 'text-muted-foreground hover:bg-muted',
  };

  return (
    <button 
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full font-semibold transition-all focus-ring-cyber ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export interface DeviceSectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'spotlight' | 'gradient';
}

export function DeviceSection({ children, className = '', variant = 'default' }: DeviceSectionProps) {
  const variantClasses = {
    default: '',
    spotlight: 'relative',
    gradient: 'mesh-gradient-bg',
  };

  return (
    <section className={`section-responsive ${variantClasses[variant]} ${className}`}>
      {children}
    </section>
  );
}

export interface DeviceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function DeviceInput({ label, error, className = '', ...props }: DeviceInputProps) {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input 
        className={`input-responsive w-full rounded-xl border bg-background px-4 text-foreground transition-all focus-ring-cyber ${error ? 'border-destructive' : 'border-input'}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export interface DeviceBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function DeviceBadge({ children, variant = 'default' }: DeviceBadgeProps) {
  const variantClasses = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-secondary/10 text-secondary',
    warning: 'bg-amber-500/10 text-amber-500',
    error: 'bg-destructive/10 text-destructive',
  };

  return (
    <span className={`badge-responsive inline-flex items-center justify-center rounded-full font-semibold ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}

export interface DeviceIconProps {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function DeviceIcon({ icon, size = 'md' }: DeviceIconProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'icon-responsive w-5 h-5',
    lg: 'w-8 h-8',
  };

  return (
    <span className={sizeClasses[size]}>
      {icon}
    </span>
  );
}

export interface DeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
}

export function DeviceDialog({ open, onOpenChange, children, title }: DeviceDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="dialog-responsive relative bg-background shadow-depth-lg animate-scale-in">
        {title && (
          <h2 className="text-xl font-bold mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}

export interface DeviceGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

export function DeviceGrid({ children, columns = 2, gap = 'md' }: DeviceGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div 
      className={`grid content-grid ${gapClasses[gap]}`}
      style={{ '--grid-columns': columns } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export { useDeviceSize, DeviceSize };