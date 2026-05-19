
"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderUserInfoProps {
  isOnline: boolean;
  profile: any;
  level: any;
  onOpenInfo: () => void;
}

export function HeaderUserInfo({ isOnline, profile, level, onOpenInfo }: HeaderUserInfoProps) {
  return (
    <div
      onClick={onOpenInfo}
      className="cursor-pointer group/info flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700"
    >
      {/* Avatar — 30% más grande (64 → 83px), subido 20% */}
      <div className="relative -mt-3">
        <div className={cn(
          "absolute inset-0 rounded-full animate-pulse blur-xl transition-colors duration-1000",
          isOnline ? "bg-primary/40" : "bg-white/20"
        )} />
        <Avatar className="w-[84px] h-[84px] border-[4px] border-white shadow-2xl relative z-10 group-hover/info:border-primary transition-all">
          <AvatarImage src={profile?.photoURL} className="object-cover !opacity-100 !grayscale-0" />
          <AvatarFallback className="bg-primary text-white font-black text-xl uppercase italic">
            {profile?.displayName?.charAt(0) || 'R'}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-lg z-20">
          <ShieldCheck className="w-4 h-4 text-green-500" />
        </div>
      </div>

      {/* Badge de nivel — siempre visible */}
      {isOnline && (
        <Badge className={cn("h-5 border-none font-black italic text-[9px] px-3 shadow-xl", level.bg, level.color)}>
          {level.name}
        </Badge>
      )}
    </div>
  );
}
