
"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderMainActionProps {
  isOnline: boolean;
  onToggleOnline: () => void;
}

export function HeaderMainAction({ isOnline, onToggleOnline }: HeaderMainActionProps) {
  const handleToggle = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      // Patrón de vibración más fuerte y notorio
      navigator.vibrate([200, 100, 200]);
    }
    onToggleOnline();
  };

  return (
    <div className="w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
      <Button 
        onClick={handleToggle} 
        className={cn(
          "w-full h-[60px] rounded-[32px] font-black text-base uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 border-b-[6px]",
          isOnline 
            ? "bg-red-500 text-white border-red-800 hover:bg-red-600 shadow-red-500/20" 
            : "bg-green-500 text-white border-green-800 hover:bg-green-600 shadow-green-500/20"
        )}
      >
        {isOnline ? "Cerrar Turno" : "Iniciar Turno"}
      </Button>
    </div>
  );
}
