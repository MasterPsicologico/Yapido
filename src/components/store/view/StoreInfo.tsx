
"use client";

import { Badge } from '@/components/ui/badge';

interface StoreInfoProps {
  name?: string;
  description?: string;
}

export function StoreInfo({ name, description }: StoreInfoProps) {
  return (
    <div className="space-y-4">
      <Badge className="bg-[#00c9db] hover:bg-[#00b5c5] text-white rounded-full px-5 py-1.5 text-xs font-bold border-none">
        Vitriniando
      </Badge>
      <h1 className="text-[38px] font-black text-slate-900 leading-tight tracking-tight break-words">
          {name}
      </h1>
      <p className="text-[#6b7280] text-[17px] leading-snug font-medium break-words">
        {description}
      </p>
    </div>
  );
}
