
"use client";

import { useState } from 'react';
import { HeaderBackground } from './header/HeaderBackground';
import { HeaderAdminControls } from './header/HeaderAdminControls';
import { HeaderUserInfo } from './header/HeaderUserInfo';
import { HeaderMainAction } from './header/HeaderMainAction';
import { HeaderProfileModal } from './header/HeaderProfileModal';

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
 * DashboardHeader - Orquestador Maestro Subatómico
 * Este componente ahora solo coordina los micro-módulos independientes.
 */
export function DashboardHeader({ 
  profile, level, isOnline, onToggleOnline,
  isAdmin, dashboardConfig, onImageUpload, isUploading 
}: DashboardHeaderProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <div className="relative overflow-hidden border-b min-h-[380px] flex flex-col justify-center">
      {/* 1. SISTEMA DE FONDO DUAL (INTELIGENCIA INDEPENDIENTE) */}
      <HeaderBackground 
        isOnline={isOnline} 
        dashboardConfig={dashboardConfig} 
      />

      {/* 2. MANDO DE ADMINISTRADOR (CONTROLES DE IMAGEN) */}
      <HeaderAdminControls 
        isAdmin={isAdmin}
        isUploading={isUploading}
        onImageUpload={onImageUpload}
        isOnline={isOnline}
      />

      {/* 3. CONTENIDO CENTRAL (IDENTIDAD DEL REPARTIDOR) */}
      <div className="relative z-10 px-6 flex flex-col items-center text-center gap-8 pt-12">
        <HeaderUserInfo 
          isOnline={isOnline}
          profile={profile}
          level={level}
          onOpenInfo={() => setIsInfoOpen(true)}
        />
        
        {/* 4. BOTÓN DE ACCIÓN MAESTRO (TURNO) */}
        <HeaderMainAction 
          isOnline={isOnline}
          onToggleOnline={onToggleOnline}
        />
      </div>

      {/* 5. MODAL DE PERFIL DETALLADO */}
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
