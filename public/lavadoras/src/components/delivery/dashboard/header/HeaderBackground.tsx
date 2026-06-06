
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface HeaderBackgroundProps {
  isOnline: boolean;
  dashboardConfig?: any;
}

const CACHE_ACTIVE = 'yapido_click_delivery_bg_active';
const CACHE_INACTIVE = 'yapido_click_delivery_bg_inactive';

export function HeaderBackground({ isOnline, dashboardConfig }: HeaderBackgroundProps) {
  const [localActive, setLocalActive] = useState<string | null>(null);
  const [localInactive, setLocalInactive] = useState<string | null>(null);

  // CARGA INSTANTÁNEA DESDE EL CELULAR (MANDAMIENTO #1)
  useEffect(() => {
    setLocalActive(localStorage.getItem(CACHE_ACTIVE));
    setLocalInactive(localStorage.getItem(CACHE_INACTIVE));
  }, []);

  useEffect(() => {
    if (dashboardConfig?.bgActive && dashboardConfig.bgActive !== localActive) {
      setLocalActive(dashboardConfig.bgActive);
      localStorage.setItem(CACHE_ACTIVE, dashboardConfig.bgActive);
    }
    if (dashboardConfig?.bgInactive && dashboardConfig.bgInactive !== localInactive) {
      setLocalInactive(dashboardConfig.bgInactive);
      localStorage.setItem(CACHE_INACTIVE, dashboardConfig.bgInactive);
    }
  }, [dashboardConfig, localActive, localInactive]);

  const bgActive = localActive || dashboardConfig?.bgActive;
  const bgInactive = localInactive || dashboardConfig?.bgInactive;

  return (
    <div className="absolute inset-0 z-0">
      {/* CAPA DESCANSO */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000 ease-in-out",
        isOnline ? "opacity-0" : "opacity-100"
      )}>
        {bgInactive ? (
          <Image src={bgInactive} alt="Descanso" fill className="object-cover object-top animate-in fade-in duration-500" priority />
        ) : (
          <div className="absolute inset-0 bg-slate-900" />
        )}
      </div>

      {/* CAPA ACTIVO */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000 ease-in-out",
        isOnline ? "opacity-100" : "opacity-0"
      )}>
        {bgActive ? (
          <Image src={bgActive} alt="Activo" fill className="object-cover object-top animate-in fade-in duration-500" priority />
        ) : (
          <div className="absolute inset-0 bg-primary" />
        )}
      </div>
    </div>
  );
}
