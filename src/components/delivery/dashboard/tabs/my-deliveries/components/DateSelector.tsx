
"use client";

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
}

export function DateSelector({ monthDays, selectedDate, onSelectDate }: DateSelectorProps) {
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
        <div className="flex gap-3 px-4">
          {monthDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDay = isSameDay(day, new Date());
            return (
              <button
                key={day.toString()}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[60px] h-20 rounded-[24px] transition-all duration-500 border-2",
                  isSelected ? "bg-slate-900 border-primary text-white shadow-2xl scale-110 z-10" : "bg-white border-slate-100 text-slate-400 hover:border-primary/20 shadow-sm"
                )}
              >
                <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", isSelected ? "text-primary" : "text-slate-300")}>{format(day, "eee", { locale: es })}</span>
                <span className="text-xl font-black italic tracking-tighter leading-none">{format(day, "d")}</span>
                {isTodayDay && !isSelected && <div className="w-1 h-1 rounded-full bg-primary mt-1 animate-pulse" />}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </section>
  );
}
