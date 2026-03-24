
"use client";

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActivityTriggerProps {
  count: number;
}

export function ActivityTrigger({ count }: ActivityTriggerProps) {
  return (
    <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 transition-colors h-8 w-8 sm:h-9 sm:w-9">
      <Bell className={cn("w-4 h-4 sm:w-4.5 sm:h-4.5", count > 0 ? "text-primary animate-vibrate" : "text-slate-400")} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] sm:text-[9px] font-black w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          {count}
        </span>
      )}
    </Button>
  );
}
