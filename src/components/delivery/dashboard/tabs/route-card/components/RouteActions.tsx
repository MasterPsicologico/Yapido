
"use client";

import { Phone, MessageCircle, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.131.57-.074 1.758-.706 2.006-1.388.248-.683.248-1.265.173-1.388-.075-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .01 5.393 0 12.03c0 2.123.54 4.197 1.57 6.05L0 24l6.15-1.612a11.81 11.81 0 005.89 1.568h.005c6.634 0 12.04-5.39 12.043-12.03a11.82 11.82 0 00-3.48-8.513z"/>
  </svg>
);

interface RouteActionsProps {
  customerPhone: string;
  customerAddress: string;
  onOpenChat: () => void;
  onOpenOffer: () => void;
}

export function RouteActions({ customerPhone, customerAddress, onOpenChat, onOpenOffer }: RouteActionsProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      <a href={`tel:${customerPhone}`} className="w-full">
        <Button variant="outline" className="w-full h-12 rounded-xl border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-primary transition-all active:scale-95 shadow-sm">
          <Phone className="w-4 h-4" />
        </Button>
      </a>
      <Button 
        onClick={() => window.open(`https://wa.me/57${customerPhone?.replace(/\D/g, '')}`, '_blank')}
        variant="outline" 
        className="w-full h-12 rounded-xl border-slate-100 text-[#25d366] hover:bg-[#25d366]/5 transition-all active:scale-95 shadow-sm"
      >
        <WhatsAppIcon className="w-5 h-5" />
      </Button>
      <Button 
        onClick={onOpenChat}
        variant="outline" 
        className="w-full h-12 rounded-xl border-slate-100 text-primary hover:bg-primary/5 transition-all active:scale-95 shadow-sm"
      >
        <MessageCircle className="w-5 h-5" />
      </Button>
      <Button 
        variant="outline" 
        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customerAddress)}`, '_blank')}
        className="w-full h-12 rounded-xl border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-primary transition-all active:scale-95 shadow-sm"
      >
        <Navigation className="w-4 h-4" />
      </Button>
      <Button onClick={onOpenOffer} variant="outline" className="w-full h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-black text-[8px] uppercase tracking-widest shadow-sm transition-all active:scale-95 leading-none px-1">
        TRATO
      </Button>
    </div>
  );
}
