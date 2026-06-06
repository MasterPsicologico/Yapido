
"use client";

import { cn } from '@/lib/utils';
import type { TimelineEvent } from './timeline-utils';

interface TimelineNodeProps {
  event: TimelineEvent;
  isLast: boolean;
}

export function TimelineNode({ event, isLast }: TimelineNodeProps) {
  const Icon = event.icon;
  const isCurrent = event.status === 'current';
  const isCompleted = event.status === 'completed';
  const isPending = event.status === 'pending';

  return (
    <div className="flex flex-col items-center shrink-0 relative group">
      {/* Connector line */}
      {!isLast && (
        <div className={cn(
          "absolute top-[18px] left-[50%] w-16 h-[2px] z-0",
          isCompleted ? "bg-primary/40" : "bg-slate-100"
        )} />
      )}

      {/* Node circle */}
      <div className={cn(
        "relative z-10 flex items-center justify-center rounded-full border-2 transition-all duration-500 shrink-0",
        isCurrent && "w-9 h-9 border-primary shadow-lg shadow-primary/20 ring-4 ring-primary/10 animate-pulse",
        isCompleted && "w-7 h-7 border-transparent",
        isPending && "w-7 h-7 border-slate-200",
        isCompleted ? event.bgColor : isPending ? "bg-white" : event.bgColor,
      )}>
        <Icon className={cn(
          "transition-colors",
          isCurrent && "w-4 h-4",
          isCompleted && "w-3.5 h-3.5",
          isPending && "w-3 h-3 text-slate-300",
          !isPending && event.color,
        )} />
      </div>

      {/* Label */}
      <span className={cn(
        "mt-1.5 text-[8px] font-black uppercase tracking-wider text-center leading-tight whitespace-nowrap max-w-[56px]",
        isCurrent && "text-slate-900",
        isCompleted && "text-slate-500",
        isPending && "text-slate-300",
      )}>
        {event.label}
      </span>

      {/* Time */}
      {event.time && (
        <span className={cn(
          "text-[7px] font-bold font-mono tracking-wider",
          isCompleted ? "text-slate-400" : "text-primary",
        )}>
          {event.time}
        </span>
      )}
    </div>
  );
}
