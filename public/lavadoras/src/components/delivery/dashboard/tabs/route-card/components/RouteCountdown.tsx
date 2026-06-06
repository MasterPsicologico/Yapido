
"use client";

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteCountdownProps {
  createdAt: any;
}

export function RouteCountdown({ createdAt }: RouteCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const created = createdAt?.toMillis?.() || (createdAt?.seconds * 1000) || Date.now();
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - created) / 1000);
      const remaining = Math.max(0, 900 - elapsed); // 15 mins
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  if (timeLeft === null) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 120; // Menos de 2 minutos

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-500",
      isUrgent 
        ? "bg-red-500 text-white border-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" 
        : "bg-slate-100 text-slate-500 border-slate-200"
    )}>
      <Clock className={cn("w-3 h-3", isUrgent && "animate-spin-slow")} />
      <span className="text-[10px] font-black italic tracking-widest tabular-nums leading-none">
        {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      </span>
    </div>
  );
}
