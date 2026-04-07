
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store as StoreIcon } from 'lucide-react';

interface Offer {
  id: string;
  storeName: string;
  price: number;
  [key: string]: any;
}

interface OffersRadarSectionProps {
  offers: Offer[] | null;
  onAccept: (offer: Offer) => void;
}

/**
 * OffersRadarSection - Escucha activa de misiones y contraofertas.
 */
export function OffersRadarSection({ offers, onAccept }: OffersRadarSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 italic">Radar de Ofertas ({offers?.length || 0})</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">VIVO</span>
        </div>
      </div>

      {offers && offers.length > 0 ? (
        <div className="grid gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="border-none rounded-[40px] bg-white shadow-xl overflow-hidden ring-1 ring-black/[0.03] animate-in slide-in-from-right-4">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><StoreIcon className="w-6 h-6" /></div>
                    <div>
                      <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{offer.storeName}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Propuesta recibida</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary italic">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.price)}
                    </span>
                  </div>
                </div>
                <Button onClick={() => onAccept(offer)} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-transform">ACEPTAR ESTE TRATO</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
          <Loader2 className="w-10 h-10 animate-spin text-slate-200 mx-auto mb-4" />
          <p className="text-slate-300 font-black uppercase tracking-widest italic text-xs">Sincronizando con alquileres cercanos...</p>
        </div>
      )}
    </section>
  );
}
