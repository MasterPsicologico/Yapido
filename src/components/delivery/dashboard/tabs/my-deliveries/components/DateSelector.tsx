"use client";

import { useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  monthDays: Date[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  pendingDates?: string[];
}

export function DateSelector({ monthDays, selectedDate, onSelectDate, pendingDates }: DateSelectorProps) {
  // REFERENCIA PARA CENTRADO AUTOMÁTICO
  const currentDayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Sincronización de scroll al montar para ubicar hoy en el centro
    if (currentDayRef.current) {
      currentDayRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Selector de Jornada</h3>
        </div>
        <Badge className="bg-slate-900 text-white border-none font-black text-[8px] px-3 uppercase tracking-widest">
          {format(selectedDate, "MMMM", { locale: es })}
        </Badge>
      </div>

      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex gap-3 px-4 py-2">
          {monthDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDay = isSameDay(day, new Date());
            const hasPending = pendingDates?.includes(format(day, 'yyyy-MM-dd'));

            return (
              <button
                key={day.toString()}
                ref={isTodayDay ? currentDayRef : null}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[60px] h-20 rounded-[24px] transition-all duration-500 border-2",
                  isSelected ? "shadow-2xl scale-110 z-10" : "shadow-sm",
                  // PRIORIDAD ROJA: Si hay una lavadora por recoger, se ilumina en rojo
                  hasPending 
                    ? "bg-red-600 border-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-pulse" 
                    : isSelected 
                      ? "bg-slate-900 border-primary text-white" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-primary/20"
                )}
              >
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest mb-1", 
                  (hasPending || isSelected) ? "text-white/60" : "text-slate-300"
                )}>
                  {format(day, "eee", { locale: es })}
                </span>
                <span className="text-xl font-black italic tracking-tighter leading-none">{format(day, "d")}</span>
                {isTodayDay && !isSelected && !hasPending && <div className="w-1 h-1 rounded-full bg-primary mt-1 animate-pulse" />}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </section>
  );
}
