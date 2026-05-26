
"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { CalendarEvent, useFinanceStore } from '@/hooks/use-finance-store';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Bell, 
  Sparkles, 
  MapPin, 
  Briefcase, 
  Landmark, 
  HeartPulse, 
  Coffee, 
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  events: CalendarEvent[];
}

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

export function CalendarView({ events }: CalendarViewProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const eventDays = useMemo(() => events.map(e => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }), [events]);

  const selectedDateEvents = useMemo(() => events.filter(e => {
    if (!date) return false;
    const eventDate = new Date(e.date);
    return (
      eventDate.getUTCDate() === date.getDate() &&
      eventDate.getUTCMonth() === date.getMonth() &&
      eventDate.getUTCFullYear() === date.getFullYear()
    );
  }).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00')), [events, date]);

  const currentFormattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="flex-1 flex flex-col w-full bg-white overflow-y-auto m-0 p-0">
      <div className="shrink-0 bg-primary text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-widest">Agenda Inteligente</h2>
        </div>
        <Badge className="bg-accent text-white border-none text-[10px] uppercase font-black">
          {events.length} Eventos
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
                
                return (
                  <div key={e.id} className="p-5 relative group hover:bg-muted/5 transition-colors">
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      categoryColors[e.category] || "bg-accent",
                      isHappeningNow && "animate-pulse"
                    )} />
                    
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={cn("font-bold text-sm text-primary leading-tight break-words", isPast && "text-muted-foreground line-through")}>
                            {e.title}
                          </h4>
                          {isHappeningNow && (
                            <Badge className="bg-red-500 animate-pulse text-[8px] px-2 py-0.5 whitespace-nowrap flex-shrink-0 uppercase font-black text-white border-none h-fit">
                              En Vivo
                            </Badge>
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
                          <Badge variant="outline" className="text-[8px] font-black border-accent/30 text-accent uppercase h-4 flex items-center gap-1">
                            <Bell className="w-2.5 h-2.5" /> Seguimiento IA
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap",
                          isHappeningNow ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground"
                        )}>
                          {e.allDay ? 'Todo el día' : format12h(e.time)}
                        </span>
                        {isUpcoming && (
                          <span className="text-[8px] font-bold text-accent uppercase tracking-tighter">
                            Próximamente
                          </span>
                        )}
                      </div>
                    </div>
                    {e.description && (
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 italic">
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
                ? "He activado el seguimiento inteligente para tus compromisos de hoy. Te avisaré 15 minutos antes de cada uno."
                : "Aprovecha este día despejado para organizar tus facturas pendientes."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
