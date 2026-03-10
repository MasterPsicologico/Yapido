
"use client";

import { MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoreContactContainerProps {
  address?: string;
  phoneNumber?: string;
  onOpenChat: () => void;
}

export function StoreContactContainer({ address, phoneNumber, onOpenChat }: StoreContactContainerProps) {
  return (
    <div className="bg-[#f5f2eb] p-6 rounded-[32px] border border-[#e5e7eb]/40 space-y-6">
      <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
              <MapPin className="w-5 h-5 text-slate-700" />
          </div>
          <span className="text-slate-600 text-sm font-bold leading-tight">
              {address || 'Aguachica, Cesar'}
          </span>
      </div>

      <Button 
        onClick={onOpenChat}
        className="w-full h-14 bg-[#25d366] hover:bg-[#128c7e] text-white rounded-full font-black text-lg gap-3 shadow-xl shadow-green-200 border-none group transition-all"
      >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {phoneNumber || '+57 300 000 0000'}
      </Button>
    </div>
  );
}
