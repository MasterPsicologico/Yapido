"use client";

import { useState, useEffect, useRef } from 'react';
import { HeaderBackground } from './header/HeaderBackground';
import { HeaderAdminControls } from './header/HeaderAdminControls';
import { HeaderUserInfo } from './header/HeaderUserInfo';
import { HeaderMainAction } from './header/HeaderMainAction';
import { HeaderProfileModal } from './header/HeaderProfileModal';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

interface DashboardHeaderProps {
  profile: any;
  level: any;
  stats: { rating: number; deliveredCount: number };
  isOnline: boolean;
  onToggleOnline: () => void;
  isAdmin?: boolean;
  dashboardConfig?: any;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>, target: 'active' | 'inactive') => void;
  isUploading?: 'active' | 'inactive' | null;
}

/**
 * DashboardHeader - Orquestador Maestro con Dinámica Háptica y Visual
 */
export function DashboardHeader({ 
  profile, level, isOnline, onToggleOnline,
  isAdmin, dashboardConfig, onImageUpload, isUploading 
}: DashboardHeaderProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [animStatus, setAnimStatus] = useState<'on' | 'off' | null>(null);
  const isFirstRender = useRef(true);

  // EFECTO DE VIBRACIÓN Y ANIMACIÓN AL CAMBIAR TURNO
  useEffect(() => {
    // Evitar que se dispare al cargar la página
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const triggerHaptics = async (type: 'on' | 'off') => {
      try {
        if (type === 'on') {
          await Haptics.notification({ type: NotificationType.Success });
          setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 200);
        } else {
          await Haptics.notification({ type: NotificationType.Error });
        }
      } catch (err) {
        // Fallback for web or if Haptics is not available
        if (typeof window !== 'undefined' && navigator.vibrate) {
          if (type === 'on') {
            navigator.vibrate([100, 50, 100, 50, 100]);
          } else {
            navigator.vibrate(400);
          }
        }
      }
    };

    if (isOnline) {
      // SECUENCIA DE ENCENDIDO (VERDE)
      setAnimStatus('on');
      triggerHaptics('on');
    } else {
      // SECUENCIA DE APAGADO (ROJO)
      setAnimStatus('off');
      triggerHaptics('off');
    }

    // Reset de animación visual después de 2 segundos
    const timer = setTimeout(() => setAnimStatus(null), 2000);
    return () => clearTimeout(timer);
  }, [isOnline]);

  return (
    <div className={cn(
      "relative overflow-hidden border-b min-h-[380px] flex flex-col justify-center transition-all duration-500",
      animStatus === 'on' && "animate-shake-strong",
      animStatus === 'off' && "animate-shake-strong"
    )}>
      {/* CAPA DE ILUMINACIÓN DE BORDES (GLOW) */}
      <div className={cn(
        "absolute inset-0 z-20 pointer-events-none transition-all duration-500",
        animStatus === 'on' && "animate-glow-green-strong",
        animStatus === 'off' && "animate-glow-red-strong"
      )} />

      {/* 1. SISTEMA DE FONDO DUAL */}
      <HeaderBackground 
        isOnline={isOnline} 
        dashboardConfig={dashboardConfig} 
      />

      {/* 2. MANDO DE ADMINISTRADOR */}
      <HeaderAdminControls 
        isAdmin={isAdmin}
        isUploading={isUploading}
        onImageUpload={onImageUpload}
        isOnline={isOnline}
      />

      {/* 3. CONTENIDO CENTRAL (IDENTIDAD) */}
      <div className="relative z-10 px-6 flex flex-col items-center text-center gap-8 pt-12">
        <HeaderUserInfo 
          isOnline={isOnline}
          profile={profile}
          level={level}
          onOpenInfo={() => setIsInfoOpen(true)}
        />
        
        {/* 4. BOTÓN DE ACCIÓN MAESTRO */}
        <HeaderMainAction 
          isOnline={isOnline}
          onToggleOnline={onToggleOnline}
        />
      </div>

      {/* 5. MODAL DE PERFIL */}
      <HeaderProfileModal 
        isOpen={isInfoOpen}
        onOpenChange={setIsInfoOpen}
        profile={profile}
        level={level}
        isOnline={isOnline}
      />
    </div>
  );
}