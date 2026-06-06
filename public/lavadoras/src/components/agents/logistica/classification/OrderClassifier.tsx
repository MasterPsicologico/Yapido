
"use client";

import { Badge } from '@/components/ui/badge';
import { classifyAssignment } from '../timeline/timeline-utils';
import { cn } from '@/lib/utils';

interface OrderClassifierProps {
  order: any;
}

export function OrderClassifier({ order }: OrderClassifierProps) {
  const classification = classifyAssignment(order);

  return (
    <Badge className={cn(
      "text-[7px] font-black uppercase px-2.5 h-5 border-none tracking-widest shrink-0",
      classification.bgColor,
      classification.color,
    )}>
      {classification.label}
    </Badge>
  );
}
