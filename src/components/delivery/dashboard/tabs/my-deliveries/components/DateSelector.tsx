"use client";

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface DateSelectorProps {
  monthDays: Date[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  pendingDates?: string[];
  /** Año y mes actualmente visualizados */
  currentYear: number;
  currentMonth: number; // 0-indexed
  onChangeMonth: (year: number, month: number) => void;
}

export function DateSelector({ 
  monthDays, selectedDate, onSelectDate, pendingDates,
  currentYear, currentMonth, onChangeMonth
}: DateSelectorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const currentDayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (currentDayRef.current) {
      currentDayRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [currentMonth, currentYear]);

  const now = new Date();
  const isFutureMonth = (year: number, month: number) => {
    return year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());
  };

  const handleMonthSelect = (month: number) => {
    if (isFutureMonth(currentYear, month)) return;
    onChangeMonth(currentYear, month);
    setIsPickerOpen(false);
  };

  const handleYearChange = (delta: number) => {
    const newYear = currentYear + delta;
    if (newYear > now.getFullYear()) return;
    // Si cambiamos a un año futuro relativo al mes actual, ajustar
    if (newYear === now.getFullYear() && currentMonth > now.getMonth()) {
      onChangeMonth(newYear, now.getMonth());
    } else {
      onChangeMonth(newYear, currentMonth);
    }
  };

  const displayLabel = MONTHS[currentMonth];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Selector de Jornada</h3>
        </div>
        <button
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-[8px] uppercase tracking-widest transition-all active:scale-95",
            isPickerOpen 
              ? "bg-primary text-white shadow-lg" 
              : "bg-slate-900 text-white hover:bg-slate-800"
          )}
        >
          {displayLabel} {currentYear !== now.getFullYear() && ` ${currentYear}`}
          <ChevronDown className={cn("w-3 h-3 transition-transform", isPickerOpen && "rotate-180")} />
        </button>
      </div>

      {/* ═══ MONTH/YEAR PICKER ═══ */}
      <AnimatePresence>
        {isPickerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mx-4"
          >
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl p-5 space-y-4">
              {/* Year Navigation */}
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => handleYearChange(-1)}
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-90"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <span className="text-sm font-black tracking-widest text-slate-900 uppercase">{currentYear}</span>
                <button 
                  onClick={() => handleYearChange(1)}
                  disabled={currentYear >= now.getFullYear()}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-90",
                    currentYear >= now.getFullYear() ? "bg-slate-50 text-slate-200 cursor-not-allowed" : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((month, idx) => {
                  const isCurrentMonth = idx === currentMonth && currentYear === now.getFullYear() && idx === now.getMonth();
                  const isSelected = idx === currentMonth;
                  const isFuture = isFutureMonth(currentYear, idx);

                  return (
                    <button
                      key={month}
                      onClick={() => handleMonthSelect(idx)}
                      disabled={isFuture}
                      className={cn(
                        "py-2.5 px-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95",
                        isFuture && "text-slate-200 cursor-not-allowed",
                        !isFuture && !isSelected && "text-slate-500 hover:bg-slate-50",
                        isSelected && "bg-slate-900 text-white shadow-lg",
                        isCurrentMonth && !isSelected && "ring-2 ring-primary/30 text-primary"
                      )}
                    >
                      {month.slice(0, 3)}
                      {isCurrentMonth && <span className="block text-[7px] font-bold tracking-normal mt-0.5 text-primary/60">Hoy</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ DAY STRIP ═══ */}
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
