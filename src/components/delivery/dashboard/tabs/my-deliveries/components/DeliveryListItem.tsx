
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer, CheckCircle2, Clock, ChevronDown, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DeliveryListItemProps {
  order: any;
  isCompleted: boolean;
  isExpired: boolean;
  timeIn: string;
  onClick: () => void;
}

export function DeliveryListItem({ order, isCompleted, isExpired, timeIn, onClick }: DeliveryListItemProps) {
  const isPickupPhase = order.status === 'picking_up' || order.status === 'at_pickup';

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "border-none rounded-[32px] overflow-hidden transition-all duration-500 ring-2 cursor-pointer",
        "bg-white shadow-xl", 
        isExpired && "animate-pulse-red-glow ring-red-500/50",
        isCompleted && "ring-green-500/50",
        isPickupPhase && "ring-orange-400/50"
      )}
    >
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-inner",
            isCompleted ? "bg-green-500 text-white" : isPickupPhase ? "bg-orange-500 text-white" : isExpired ? "bg-red-500 text-white" : "bg-slate-50 text-slate-400"
          )}>
            {isCompleted ? <CheckCircle2 className="w-6 h-6 animate-in zoom-in" /> : isPickupPhase ? <Truck className="w-6 h-6 animate-bounce" /> : <Timer className={cn("w-6 h-6", isExpired && "animate-bounce")} />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-lg font-black uppercase italic tracking-tighter leading-tight text-slate-900 break-words pr-2">
              {order.customerName}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Clock className="w-3 h-3 text-slate-300" /><span className="text-[9px] font-black uppercase text-slate-400">Inicio: {timeIn}</span>
              {isCompleted && <Badge className="bg-green-500 text-white border-none text-[8px] font-black uppercase px-2 h-5 ml-2">FINALIZADO</Badge>}
              {isPickupPhase && <Badge className="bg-orange-500 text-white border-none text-[8px] font-black uppercase px-2 h-5 ml-2">RECOGIENDO</Badge>}
            </div>
          </div>
        </div>
        <ChevronDown className="text-slate-300 shrink-0" />
      </CardContent>
    </Card>
  );
}
