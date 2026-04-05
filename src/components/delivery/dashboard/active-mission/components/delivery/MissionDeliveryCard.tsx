
"use client";

import { MapPinned, Navigation, Phone, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MissionDeliveryCardProps {
  customerAddress: string;
  customerName: string;
  customerPhone: string;
  customerPhoto?: string;
  onOpenMaps: () => void;
  onOpenChat: () => void;
}

export function MissionDeliveryCard({
  customerAddress,
  customerName,
  customerPhone,
  customerPhoto,
  onOpenMaps,
  onOpenChat
}: MissionDeliveryCardProps) {
  return (
    <section className="animate-in slide-in-from-right-4 duration-500">
      <Card className="border-none rounded-[36px] bg-white shadow-xl p-8 space-y-6 ring-1 ring-black/[0.03]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 text-primary">
              <MapPinned className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Punto de Entrega</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight uppercase italic tracking-tighter">
              {customerAddress}
            </h2>
          </div>
          <Button 
            onClick={onOpenMaps}
            className="rounded-2xl h-14 w-14 bg-slate-900 text-white shadow-lg active:scale-90 transition-all group shrink-0"
          >
            <Navigation className="w-6 h-6 group-hover:animate-bounce" />
          </Button>
        </div>

        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-slate-50 shadow-sm">
              <AvatarImage src={customerPhoto} />
              <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                {customerName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Cliente</p>
              <p className="text-sm font-black uppercase italic text-slate-700">{customerName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={`tel:${customerPhone}`}>
              <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 bg-slate-50 text-slate-400 hover:text-primary">
                <Phone className="w-4 h-4" />
              </Button>
            </a>
            <Button onClick={onOpenChat} size="icon" variant="ghost" className="rounded-full h-10 w-10 bg-slate-50 text-slate-400 hover:text-primary">
              <MessageCircle className="w-4 h-4 text-primary" />
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
