
"use client";

import { useMemo } from 'react';
import { TimelineNode } from './TimelineNode';
import { buildTimelineEvents } from './timeline-utils';

interface HorizontalTimelineProps {
  order: any;
}

export function HorizontalTimeline({ order }: HorizontalTimelineProps) {
  const events = useMemo(() => buildTimelineEvents(order), [order]);

  if (events.length === 0) return null;

  return (
    <div 
      className="flex items-start gap-6 overflow-x-auto py-3 px-2 no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {events.map((event, idx) => (
        <TimelineNode 
          key={event.id} 
          event={event} 
          isLast={idx === events.length - 1} 
        />
      ))}
    </div>
  );
}
