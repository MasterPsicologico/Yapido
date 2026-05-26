
"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Bell, 
  Sparkles, 
  Briefcase, 
  Landmark, 
  HeartPulse, 
  Coffee, 
  User, 
  CheckCircle2,
  AlarmClock,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, React.ReactNode> = {
  trabajo: <Briefcase className="w-3.5 h-3.5" />,
  finanzas: <Landmark className="w-3.5 h-3.5" />,
  salud: <HeartPulse className="w-3.5 h-3.5" />,
  ocio: <Coffee className="w-3.5 h-3.5" />,
  personal: <User className="w-3.5 h-3.5" />,
};

const categoryColors: Record<string, string> = {
  trabajo: "bg-blue-500",
  finanzas: "bg-green-500",
  salud: "bg-red-500",
  ocio: "bg-purple-500",
  personal: "bg-accent",
};

const format12h = (timeStr?: string) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export function CalendarFeature() {
  const { calendarEvents } = useFinanceStore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000); // Actualización cada 10s para precisión de contador
    return () => clearInterval(timer);
  }, []);

  const eventDays = useMemo(() => calendarEvents.map(e => {
    const d = new Date(e.date + 'T12:00:00');
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }), [calendarEvents]);

  const selectedDateEvents = useMemo(() => calendarEvents.filter(e => {
    if (!date) return false;
    const [y, m, d] = e.date.split('-').map(Number);
    return (
      d === date.getDate() &&
      m === (date.getMonth() + 1) &&
      y === date.getFullYear()
    );
  }).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00')), [calendarEvents, date]);

  const currentFormattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="flex-1 flex flex-col w-full bg-white overflow-y-auto m-0 p-0">
      <div className="shrink-0 bg-primary text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-widest">Agenda Inteligente</h2>
        </div>
        <Badge className="bg-accent text-white border-none text-[10px] uppercase font-black">
          {calendarEvents.length} Eventos
        </Badge>
      </div>

      <div className="bg-white border-b p-2">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="w-full"
          modifiers={{ 
            hasEvent: (d) => eventDays.includes(new Date(d).setHours(0,0,0,0)) 
          }}
          modifiersClassNames={{ 
            hasEvent: "underline decoration-accent decoration-2 underline-offset-4 font-bold text-accent"
          }}
        />
      </div>

      <div className="bg-white flex-1 flex flex-col">
        <div className="shrink-0 bg-muted/10 border-b p-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-black uppercase text-primary">
            {date ? date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Cronograma'}
          </span>
        </div>
        
        <div className="flex-1">
          {selectedDateEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-6 space-y-4">
              <Sparkles className="w-10 h-10 text-primary/10" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Día sin compromisos</p>
            </div>
          ) : (
            <div className="divide-y">
              {selectedDateEvents.map((e, index) => {
                const isHappeningNow = e.time && e.time <= currentFormattedTime && (index === selectedDateEvents.length - 1 || (selectedDateEvents[index+1].time && selectedDateEvents[index+1].time! > currentFormattedTime));
                const isPast = e.time && e.time < currentFormattedTime;
                const isUpcoming = e.time && e.time > currentFormattedTime;

                // Cálculo de cuenta regresiva
                let countdownText = null;
                if (isUpcoming && e.time) {
                  const [h, m] = e.time.split(':').map(Number);
                  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
                  const diffMs = target.getTime() - now.getTime();
                  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                  countdownText = diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
                }
                
                return (
                  <div key={e.id} className="p-5 relative group hover:bg-muted/5 transition-colors">
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1.5",
                      categoryColors[e.category] || "bg-accent",
                      isHappeningNow && "animate-pulse"
                    )} />
                    
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={cn("font-black text-sm text-primary leading-tight break-words uppercase", isPast && "text-muted-foreground line-through opacity-50")}>
                            {e.title}
                          </h4>
                          {isHappeningNow && (
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-red-500 animate-pulse text-[8px] px-2 py-0.5 uppercase font-black text-white border-none h-fit">
                                En Vivo
                              </Badge>
                              <AlarmClock className="w-4 h-4 text-red-500 animate-bounce" />
                            </div>
                          )}
                          {isPast && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[8px] font-black uppercase py-0 px-1.5 h-4 flex items-center gap-1">
                            {categoryIcons[e.category] || categoryIcons.personal}
                            {e.category}
                          </Badge>
                          {countdownText && (
                            <Badge variant="outline" className="text-[8px] font-black border-red-500/30 text-red-600 uppercase h-4 flex items-center gap-1 animate-pulse bg-red-50">
                              <Timer className="w-2.5 h-2.5" /> Faltan {countdownText}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                        <span className={cn(
                          "text-[10px] font-black px-3 py-1 rounded-lg whitespace-nowrap shadow-sm",
                          isHappeningNow ? "bg-red-600 text-white animate-pulse" : "bg-muted text-primary"
                        )}>
                          {e.allDay ? 'Todo el día' : format12h(e.time)}
                        </span>
                        {isUpcoming && (
                          <div className="flex items-center gap-1 text-accent">
                            <AlarmClock className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">Programado</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {e.description && (
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 italic font-medium">
                        {e.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-4 bg-primary/5 border-t border-b border-primary/10 mb-20">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-[9px] font-black text-primary uppercase tracking-wider">Sugerencia IA</span>
            </div>
            <p className="text-[10px] text-primary/70 leading-relaxed italic">
              {selectedDateEvents.length > 0 
                ? "He activado el seguimiento inteligente y la alarma de cuenta regresiva para tus compromisos. Recibirás alertas sonoras en cada hito."
                : "Aprovecha este día despejado para organizar tus facturas o programar nuevos compromisos."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
