
"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WasherOrdersProps {
  orders: any[] | null;
  router: any;
}

export function WasherOrders({ orders, router }: WasherOrdersProps) {
  const currencyFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 ml-4">Historial de Operaciones</h3>
      <div className="space-y-4">
        {orders && orders.length > 0 ? orders.map((order) => (
          <Card key={order.id} className="border-none rounded-[32px] bg-white shadow-sm p-6 group hover:shadow-md transition-shadow ring-1 ring-black/[0.02]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner group-hover:bg-primary/5 transition-colors">
                  <Clock className="w-7 h-7 text-slate-300 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase italic text-slate-900">#{order.id.slice(-6).toUpperCase()}</span>
                    <Badge className={cn(
                      "text-[8px] font-black uppercase px-3 h-5 border-none", 
                      order.status === 'delivered' ? "bg-green-500 text-white" : "bg-orange-500 text-white animate-pulse"
                    )}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-lg font-black italic uppercase text-slate-700 tracking-tighter mt-1">{order.customerName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2 mt-1">
                    <MapPin className="w-3 h-3 text-primary" /> {order.customerAddress?.slice(0, 40)}...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Valor Cobrado</p>
                  <span className="text-2xl font-black italic text-slate-900">{currencyFormatter.format(order.totalPrice || 0)}</span>
                </div>
                <Button 
                  onClick={() => router.push(`/admin/orders#${order.id}`)} 
                  size="icon" 
                  className="w-14 h-14 rounded-2xl bg-slate-900 text-white hover:bg-primary shadow-xl transition-all"
                >
                  <MessageCircle className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </Card>
        )) : (
          <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
            <p className="text-slate-300 font-black uppercase tracking-widest italic">Sin registros en el log</p>
          </div>
        )}
      </div>
    </div>
  );
}
