
"use client";

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Reason {
  id: string;
  label: string;
  isAlarm: boolean;
}

interface ReleaseReasonItemProps {
  reason: Reason;
  isSelected: boolean;
  onSelect: (reason: Reason) => void;
}

export function ReleaseReasonItem({ reason, isSelected, onSelect }: ReleaseReasonItemProps) {
  return (
    <button 
      onClick={() => onSelect(reason)}
      className={cn(
        "w-full p-4 rounded-2xl text-left text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-between group active:scale-[0.98]", 
        isSelected 
          ? "bg-primary text-white border-primary shadow-xl" 
          : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
      )}
    >
      <span className="truncate pr-2">{reason.label}</span>
      {reason.isAlarm && (
        <Badge className={cn(
          "border-none text-[7px] px-2 h-4 shrink-0 transition-colors",
          isSelected ? "bg-white text-primary" : "bg-red-500 text-white"
        )}>
          ALARMA
        </Badge>
      )}
    </button>
  );
}
