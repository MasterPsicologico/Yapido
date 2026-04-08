
"use client";

import { MapPinned, Navigation, Phone, MessageCircle, Wallet, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MissionDeliveryCardProps {
  customerAddress: string;
  customerSector?: string;
  customerName: string;
  customerPhone: string;
  customerPhoto?: string;
  totalPrice: number;
  paymentMethod: 'cash' | 'digital';
  onOpenMaps: () => void;
  onOpenChat: () => void;
}

export function MissionDeliveryCard({
  customerAddress,
  customerSector,
  customerName,
  customerPhone,
  customerPhoto,
  totalPrice,
  paymentMethod,
  onOpenMaps,
  onOpenChat
}: MissionDeliveryCardProps) {
  const formattedPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(totalPrice);

  return (
    <section className="animate-in slide-in-from-right-4 duration-500">
      <Card className="border-none rounded-[40px] bg-white shadow-2xl overflow-hidden ring-1 ring-black/[0.03]">
        {/* INDICADOR DE COBRO SUPERIOR */}
        <div className={cn(
          "h-10 flex items-center justify-center gap-2 px-6",
          paymentMethod === 'cash' ? "bg-red-600 text-white" : "bg-slate-900 text-primary"
        )}>
          {paymentMethod === 'cash' ? <Wallet className="w-4 h-4 animate-pulse" /> : <CreditCard className="w-4 h-4" />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {paymentMethod === 'cash' ? `COBRAR EN EFECTIVO: ${formattedPrice}` : 'PAGO DIGITAL - NO COBRAR'}
          </span>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-primary">
                <MapPinned className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">Punto de Entrega</span>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 leading-none uppercase italic tracking-tighter">
                  {customerAddress}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <p className="text-lg font-black text-slate-400 uppercase italic tracking-tight">
                    Barrio: {customerSector || 'Sector no especificado'}
                  </p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={onOpenMaps}
              className="rounded-[22px] h-16 w-16 bg-slate-900 text-white shadow-xl active:scale-90 transition-all group shrink-0 border-b-4 border-slate-950"
            >
              <Navigation className="w-7 h-7 group-hover:animate-bounce" />
            </Button>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-14 h-14 border-4 border-white shadow-xl">
                  <AvatarImage src={customerPhoto} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                    {customerName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white shadow-sm">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Cliente</p>
                <p className="text-lg font-black uppercase italic text-slate-800 leading-none tracking-tighter">
                  {customerName}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <a href={`tel:${customerPhone}`}>
                <Button size="icon" variant="ghost" className="rounded-full h-12 w-12 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all">
                  <Phone className="w-5 h-5" />
                </Button>
              </a>
              <Button onClick={onOpenChat} size="icon" variant="ghost" className="rounded-full h-12 w-12 bg-slate-900 text-white hover:bg-black shadow-lg transition-all active:scale-90">
                <MessageCircle className="w-5 h-5 text-primary" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
