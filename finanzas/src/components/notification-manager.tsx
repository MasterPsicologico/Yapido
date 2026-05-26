
"use client"

import { useEffect, useState, useRef } from 'react';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { useToast } from '@/hooks/use-toast';
import { Bell, Sparkles, CheckCircle2, AlarmClock } from 'lucide-react';
import React from 'react';

export function NotificationManager() {
  const { calendarEvents, markEventNotified } = useFinanceStore();
  const { toast } = useToast();
  const [now, setNow] = useState<Date>(new Date());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar audio de alarma
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.loop = false;
  }, []);

  // Solicitar permisos de notificación nativa al montar
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Actualizar el reloj cada 10 segundos para mayor precisión en la alarma
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const playAlarmSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log("Audio play requires user interaction first."));
    }
  };

  const sendNativeNotification = (title: string, body: string, isAlarm = false) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(title, {
        body,
        icon: '/favicon.ico',
        requireInteraction: isAlarm, // La alarma persiste hasta que el usuario la vea
        tag: isAlarm ? 'alarm-active' : undefined
      });
      
      if (isAlarm) {
        playAlarmSound();
        // Vibración si es móvil
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    }
  };

  useEffect(() => {
    if (!calendarEvents || calendarEvents.length === 0) return;

    calendarEvents.forEach(event => {
      if (!event.time) return;

      const [year, month, day] = event.date.split('-').map(Number);
      const [hours, minutes] = event.time.split(':').map(Number);
      
      const eventDate = new Date(year, month - 1, day, hours, minutes, 0);
      const diffInMinutes = (eventDate.getTime() - now.getTime()) / 60000;

      // 1. Recordatorio 15 minutos antes (Pre-Alerta)
      if (diffInMinutes > 0 && diffInMinutes <= 15 && !event.notifiedStages?.pre) {
        const title = "PRÓXIMO COMPROMISO";
        const message = `En ${Math.round(diffInMinutes)} minutos comienza: "${event.title}". ¡Prepárate!`;
        
        toast({
          title,
          description: message,
          action: <AlarmClock className="h-5 w-5 text-accent animate-pulse" />,
        });
        
        sendNativeNotification(title, message);
        markEventNotified(event.id, 'pre');
      }

      // 2. ALARMA CRÍTICA (Hora del evento) - FORZADA
      if (diffInMinutes <= 0 && diffInMinutes > -2 && !event.notifiedStages?.start) {
        const title = "¡ES EL MOMENTO!";
        const message = `ALARMA ACTIVA: Es hora de iniciar "${event.title}".`;
        
        toast({
          title,
          description: message,
          variant: "destructive",
          action: <AlarmClock className="h-6 w-6 text-white animate-bounce" />,
        });
        
        sendNativeNotification(title, message, true); // true activa el sonido y persistencia
        markEventNotified(event.id, 'start');
      }

      // 3. Check-in inteligente (30 minutos después)
      if (diffInMinutes <= -30 && diffInMinutes > -45 && !event.notifiedStages?.post) {
        const title = "SEGUIMIENTO IA";
        let checkInMessage = `¿Lograste realizar la actividad de "${event.title}"? Cuéntame para actualizar tu reporte.`;
        
        if (event.category === 'finanzas') checkInMessage = `¿Completaste el pago/trámite de "${event.title}"? Es importante para tu balance.`;
        if (event.category === 'trabajo') checkInMessage = `¿Cómo terminó tu turno de "${event.title}"? ¿Hubo ingresos extra?`;

        toast({
          title,
          description: checkInMessage,
          action: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        });
        
        sendNativeNotification(title, checkInMessage);
        markEventNotified(event.id, 'post');
      }
    });
  }, [now, calendarEvents, toast, markEventNotified]);

  return null;
}
