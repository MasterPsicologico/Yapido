
"use client";

import { Waves } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminQuickSettingsProps {
  isAdmin: boolean;
  onOpen: () => void;
}

export function AdminQuickSettings({ isAdmin, onOpen }: AdminQuickSettingsProps) {
  return (
    <div className="relative z-10">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          if (isAdmin) onOpen();
        }}
        className={cn(
          "w-12 h-12 rounded-[18px] flex items-center justify-center border transition-all duration-500 shadow-lg group",
          isAdmin 
            ? "bg-gradient-to-br from-yellow-400 to-yellow-700 border-yellow-500/50 text-white hover:scale-110 active:scale-95" 
            : "bg-white/5 border-white/10 text-white/20 cursor-default"
        )}
      >
        <Waves className={cn("w-6 h-6", isAdmin ? "text-white animate-pulse" : "text-white/20")} />
      </button>
    </div>
  );
}
