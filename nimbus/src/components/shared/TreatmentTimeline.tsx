'use client';

import { Check, Zap, Brain, MessageSquare, Users, Target } from 'lucide-react';
import type { RecommendedTreatment } from '@/lib/types';
import * as LucideIcons from 'lucide-react';

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    zap: LucideIcons.Zap,
    brain: LucideIcons.Brain,
    messagesquare: LucideIcons.MessageSquare,
    users: LucideIcons.Users,
    target: LucideIcons.Target,
    default: LucideIcons.Check,
};

interface TreatmentTimelineProps {
  treatment: RecommendedTreatment;
}

export default function TreatmentTimeline({ treatment }: TreatmentTimelineProps) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-9 top-0 h-full w-0.5 bg-border -translate-x-1/2" />

      <div className="space-y-8">
        {treatment.timeline.map((item) => {
           const Icon = iconMap[item.icon.toLowerCase()] || iconMap.default;
           return (
            <div key={item.step} className="relative flex items-start">
              <div className="absolute left-9 top-1 h-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary -translate-x-1/2">
                   <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <div className="pl-12">
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
           )
        })}
      </div>
    </div>
  );
}
