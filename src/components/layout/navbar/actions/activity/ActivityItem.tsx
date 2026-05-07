"use client";

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnalogClock } from './components/AnalogClock';
import { ServiceType } from './components/useServiceType';

interface ActivityItemProps {
  orderId: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  timestamp?: any;
  isUnread?: boolean;
  serviceType?: ServiceType;
  onClick?: () => void;
}

export function ActivityItem({ orderId, label, desc, icon: Icon, color, bg, timestamp, isUnread, serviceType, onClick }: ActivityItemProps) {
  const dateObj = timestamp?.toDate?.() || new Date();
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const dateStr = format(dateObj, "eee", { locale: es }).toUpperCase();
  const showClock = serviceType === 'RENTAL';

  return (
    <div 
      className="rounded-2xl p-3.5 cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all hover:scale-[1.02] relative group outline-none" 
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {showClock ? (
          <div className={cn(
            "flex items-center justify-center shrink-0 transition-all duration-500",
            isUnread && "animate-pulse ring-4 ring-offset-0 ring-primary/5"
          )}>
            <AnalogClock hours={hours} minutes={minutes} size="md" className={cn(bg, color)} />
          </div>
        ) : (
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all duration-500",
            bg, color,
            isUnread && "animate-pulse ring-4 ring-offset-0 ring-primary/5"
          )}>
            <Icon className="w-5.5 h-5.5" />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              "text-[10px] font-bold tracking-tight leading-none transition-colors",
              isUnread ? color : "text-slate-500"
            )}>
              {label}
            </p>
            
            {showClock && (
              <div className="flex items-center px-2 py-0.5 rounded-md bg-slate-100/50 border border-slate-200/50 group-hover:bg-white group-hover:shadow-sm transition-all shrink-0">
                <span className="text-[8px] font-black text-slate-400 tracking-tighter">{dateStr}</span>
              </div>
            )}
            
            {!showClock && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/50 border border-slate-200/50 group-hover:bg-white group-hover:shadow-sm transition-all shrink-0">
                <span className="text-[8px] font-black text-slate-400 tracking-tighter">{dateStr}</span>
                <div className="w-[1px] h-2 bg-slate-300" />
                <span className="text-[9px] font-black text-slate-600 font-mono">{format(dateObj, "HH:mm")}</span>
              </div>
            )}
          </div>

          <p className={cn(
            "text-[11px] font-medium leading-snug break-words whitespace-normal transition-all",
            isUnread ? "text-slate-800" : "text-slate-600"
          )}>
            {desc}
          </p>
        </div>

        {isUnread && (
          <div className={cn("absolute top-3 right-3 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm bg-primary", color.replace('text-', 'bg-'))} />
        )}
      </div>
    </div>
  );
}